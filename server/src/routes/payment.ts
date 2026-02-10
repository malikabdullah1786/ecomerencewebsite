import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

router.post('/initiate', async (req, res) => {
    const { amount, orderId } = req.body;
    try {
        res.json({ success: true, payment_url: 'https://example.com/pay' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
