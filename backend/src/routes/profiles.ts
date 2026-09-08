import { Router } from 'express';
import {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  duplicateProfile,
  startProfile,
  stopProfile,
} from '../controllers/profiles';

const router = Router();

router.get('/', getProfiles);
router.get('/:id', getProfile);
router.post('/', createProfile);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);
router.post('/:id/duplicate', duplicateProfile);
router.post('/:id/start', startProfile);
router.post('/:id/stop', stopProfile);

export default router;
