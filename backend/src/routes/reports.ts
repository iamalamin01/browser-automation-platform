import { Router } from 'express';
import { getReports, getReport, getRunLogs, getNetworkLogs, getScreenshots } from '../controllers/reports';

const router = Router();

router.get('/', getReports);
router.get('/:runId', getReport);
router.get('/:runId/logs', getRunLogs);
router.get('/:runId/network', getNetworkLogs);
router.get('/:runId/screenshots', getScreenshots);

export default router;
