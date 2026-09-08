import 'dotenv/config';
import './workers/automationWorker';
import logger from './utils/logger';

logger.info('🚀 Worker process started');

process.on('SIGTERM', () => {
  logger.info('Worker shutting down...');
  process.exit(0);
});
