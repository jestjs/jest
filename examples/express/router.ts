import express from 'express';
import HealthController from './controllers/health';

const router = express.Router();

router.get('/health', new HealthController().handle);

export default router;
