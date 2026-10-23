import express, { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { randomInt } from 'node:crypto';
import { Pool } from 'pg';
import { isValidAmount, isValidDueDate, isValidFriendName, isValidOtp, normalizePhone } from './validation';

type AuthenticatedRequest = Request & { userId: number };
type PendingOtp = { code: string; expiresAt: number };

function requireAuth(secret: string): RequestHandler {
  return (request, response, next) => {
    const token = request.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      response.status(401).json({ error: 'Sign in to continue.' });
      return;
    }

    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload & { userId: number };
      if (!Number.isInteger(payload.userId)) throw new Error('Invalid token');
      (request as AuthenticatedRequest).userId = payload.userId;
      next();
    } catch {
      response.status(401).json({ error: 'Your session is invalid or expired.' });
    }
  };
}

export function createApp(database: Pool, jwtSecret: string): express.Express {
  const app = express();
  const pendingOtps = new Map<string, PendingOtp>();
  app.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_request, response) => response.json({ status: 'ok' }));

  app.post('/api/auth/send-otp', (request, response) => {
    const phone = normalizePhone(request.body?.phone_number);
    if (!phone) {
      response.status(400).json({ error: 'Enter a valid international phone number.' });
      return;
    }

    const code = randomInt(100000, 1000000).toString();
    pendingOtps.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log(`MiniLedger mock OTP for ${phone}: ${code}`);
    response.json({ message: 'OTP created. Check the server log.', expires_in: 300 });
  });

  app.post('/api/auth/verify-otp', async (request, response, next) => {
    const phone = normalizePhone(request.body?.phone_number);
    const code = request.body?.otp;
    if (!phone || !isValidOtp(code)) {
      response.status(400).json({ error: 'Enter a valid phone number and six-digit OTP.' });
      return;
    }

    const pending = pendingOtps.get(phone);
    if (!pending || pending.expiresAt < Date.now() || pending.code !== code) {
      if (pending && pending.expiresAt < Date.now()) pendingOtps.delete(phone);
      response.status(400).json({ error: 'That OTP is incorrect or expired.' });
      return;
    }

    try {
      const result = await database.query<{ id: number }>(
        'INSERT INTO users (phone_number) VALUES ($1) ON CONFLICT (phone_number) DO UPDATE SET phone_number = EXCLUDED.phone_number RETURNING id',
        [phone],
      );
      pendingOtps.delete(phone);
      const user = { id: result.rows[0].id, phone_number: phone };
      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
      response.json({ token, user });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/loans', requireAuth(jwtSecret));

  app.get('/api/loans/summary', async (request, response, next) => {
    try {
      const { rows } = await database.query(
        `SELECT
          COALESCE(SUM(amount), 0)::numeric(12, 2) AS total_lent,
          COALESCE(SUM(amount) FILTER (WHERE is_repaid), 0)::numeric(12, 2) AS total_repaid,
          COALESCE(SUM(amount) FILTER (WHERE NOT is_repaid AND due_date < CURRENT_DATE), 0)::numeric(12, 2) AS overdue_amount
        FROM loans WHERE user_id = $1`,
        [(request as AuthenticatedRequest).userId],
      );
      const summary = rows[0];
      response.json({
        total_lent: Number(summary.total_lent),
        total_repaid: Number(summary.total_repaid),
        overdue_amount: Number(summary.overdue_amount),
        pending_amount: Number(summary.total_lent) - Number(summary.total_repaid),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/loans', async (request, response, next) => {
    try {
      const { rows } = await database.query(
        `SELECT id, friend_name, amount::float8 AS amount, due_date::text AS due_date,
          is_repaid, created_at,
          (NOT is_repaid AND due_date < CURRENT_DATE) AS is_overdue
        FROM loans WHERE user_id = $1 ORDER BY is_repaid, due_date ASC, created_at DESC`,
        [(request as AuthenticatedRequest).userId],
      );
      response.json(rows);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/loans', async (request, response, next) => {
    const { friend_name: name, amount, due_date: dueDate } = request.body ?? {};
    if (!isValidFriendName(name) || !isValidAmount(amount) || !isValidDueDate(dueDate)) {
      response.status(400).json({ error: 'Add a name, an amount up to 1,000,000, and a valid due date.' });
      return;
    }

    try {
      const { rows } = await database.query(
        `INSERT INTO loans (user_id, friend_name, amount, due_date)
        VALUES ($1, $2, $3, $4)
        RETURNING id, friend_name, amount::float8 AS amount, due_date::text AS due_date,
          is_repaid, created_at, FALSE AS is_overdue`,
        [(request as AuthenticatedRequest).userId, name.trim(), amount, dueDate],
      );
      response.status(201).json(rows[0]);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/loans/:id/repaid', async (request, response, next) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id < 1) {
      response.status(400).json({ error: 'Invalid loan ID.' });
      return;
    }

    try {
      const { rows } = await database.query(
        `UPDATE loans SET is_repaid = TRUE, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, friend_name, amount::float8 AS amount, due_date::text AS due_date,
          is_repaid, created_at, FALSE AS is_overdue`,
        [id, (request as unknown as AuthenticatedRequest).userId],
      );
      if (!rows.length) {
        response.status(404).json({ error: 'Loan not found.' });
        return;
      }
      response.json(rows[0]);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _request: Request, response: express.Response, _next: express.NextFunction) => {
    console.error('Request failed:', error);
    response.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}