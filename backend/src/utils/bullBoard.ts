import { Queue } from 'bullmq';
import redis from './redis';

export const AUTOMATION_QUEUE_NAME = 'automation';

export const automationQueue = new Queue(AUTOMATION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

// Bull Board setup (optional UI) - called from index.ts
export function createBullBoard() {
  // Bull board UI disabled to avoid version compatibility issues
  // Queue is still fully functional
}

export default automationQueue;
