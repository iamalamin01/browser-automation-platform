import { Queue } from 'bullmq';
import { createBullBoard as initBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
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

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

export function createBullBoard() {
  initBullBoard({
    queues: [new BullMQAdapter(automationQueue)],
    serverAdapter,
  });
}

export default automationQueue;
