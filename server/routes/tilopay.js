import { Router } from 'express';
import { createPayment, confirmPayment, handleWebhook } from '../controllers/tilopayController.js';

const router = Router();

router.post('/create-payment', createPayment);
router.post('/confirm', confirmPayment);
router.post('/webhook', handleWebhook);

export default router;
