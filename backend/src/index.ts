import 'dotenv/config';
import { createApp } from './app';
import { initDatabase, pool } from './db';

async function start(): Promise<void> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!process.env.DATABASE_URL || !jwtSecret) {
    throw new Error('Set DATABASE_URL and JWT_SECRET in backend/.env before starting MiniLedger.');
  }

  await initDatabase();
  const port = Number(process.env.PORT ?? 3000);
  const server = createApp(pool, jwtSecret).listen(port, () => {
    console.log(`MiniLedger API listening on http://localhost:${port}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      void pool.end();
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error: unknown) => {
  console.error('Could not start MiniLedger:', error);
  process.exitCode = 1;
});