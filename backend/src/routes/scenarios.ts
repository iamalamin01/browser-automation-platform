import { Router } from 'express';
import {
  getScenarios,
  getScenario,
  createScenario,
  updateScenario,
  deleteScenario,
  toggleScenario,
} from '../controllers/scenarios';

const router = Router();

router.get('/', getScenarios);
router.get('/:id', getScenario);
router.post('/', createScenario);
router.put('/:id', updateScenario);
router.delete('/:id', deleteScenario);
router.patch('/:id/toggle', toggleScenario);

export default router;
