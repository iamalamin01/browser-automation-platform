import 'dotenv/config';
import app from './app';
import { createBullBoard } from './utils/bullBoard';
import logger from './utils/logger';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Bull Board: http://localhost:${PORT}/admin/queues`);
  createBullBoard();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received - shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default server;
