import { Router } from 'express';
import bootstrapController from '../controllers/bootstrap.controller.js';

const router = Router();

router.get('/bootstrap', bootstrapController.getBootstrap);

export default router;
