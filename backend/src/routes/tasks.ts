import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  startTask,
  stopTask,
  retryTask,
  deleteTask,
} from '../controllers/tasks';

const router = Router();

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.post('/:id/start', startTask);
router.post('/:id/stop', stopTask);
router.post('/:id/retry', retryTask);
router.delete('/:id', deleteTask);

export default router;
