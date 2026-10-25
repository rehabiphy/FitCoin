import env from './config/env.js';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

async function start() {
  await connectDB();

  // 0.0.0.0 so phones / emulators on the same network can reach it
  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`Fitcoin API running on http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
  });

  const shutdown = signal => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
