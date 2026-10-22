import { Request, Response } from 'express';
import pool from './db';
import jwt from 'jsonwebtoken';
import { validatePhoneNumber, validateOTP } from './validation';

const OTP_STORE = new Map<string, { otp: string; expiresAt: number }>();

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (req: Request, res: Response) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  if (!validatePhoneNumber(phone_number)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  OTP_STORE.set(phone_number, { otp, expiresAt });

  console.log(`\n========== MOCK OTP ==========`);
  console.log(`Phone: ${phone_number}`);
  console.log(`OTP: ${otp}`);
  console.log(`Expires at: ${new Date(expiresAt).toISOString()}`);
  console.log(`=============================\n`);

  res.json({ message: 'OTP sent successfully', expires_in: 300 });
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { phone_number, otp } = req.body;

  if (!phone_number || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  if (!validatePhoneNumber(phone_number)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  if (!validateOTP(otp)) {
    return res.status(400).json({ error: 'OTP must be 6 digits' });
  }

  const storedOTP = OTP_STORE.get(phone_number);

  if (!storedOTP) {
    return res.status(400).json({ error: 'OTP expired or not found' });
  }

  if (Date.now() > storedOTP.expiresAt) {
    OTP_STORE.delete(phone_number);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (storedOTP.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  OTP_STORE.delete(phone_number);

  try {
    const result = await pool.query(
      'INSERT INTO users (phone_number) VALUES ($1) ON CONFLICT (phone_number) DO UPDATE SET phone_number = $1 RETURNING id',
      [phone_number]
    );

    const userId = result.rows[0].id;
    const token = jwt.sign({ userId, phone_number }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: userId, phone_number },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    (req as any).user = user;
    next();
  });
};
