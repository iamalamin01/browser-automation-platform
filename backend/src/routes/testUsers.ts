import { Router } from 'express';
import {
  getTestUsers,
  getTestUser,
  generateUser,
  generateMultipleUsers,
  updateTestUser,
  deleteTestUser,
  assignToProfile,
} from '../controllers/testUsers';

const router = Router();

router.get('/', getTestUsers);
router.get('/:id', getTestUser);
router.post('/generate', generateUser);
router.post('/generate-multiple', generateMultipleUsers);
router.put('/:id', updateTestUser);
router.delete('/:id', deleteTestUser);
router.post('/:id/assign', assignToProfile);

export default router;
