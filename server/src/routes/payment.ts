import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

router.post('/initiate', async (req, res) => {
    const { amount, orderId } = req.body;
    try {
        res.json({ success: true, payment_url: 'https://example.com/pay' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
