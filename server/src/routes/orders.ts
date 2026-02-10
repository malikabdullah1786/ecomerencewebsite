import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

router.post('/create', async (req, res) => {
    const { userId, items, total, shippingAddress, phone, paymentMethod } = req.body;

    const generateOrderId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomChar1 = chars.charAt(Math.floor(Math.random() * chars.length));
        const randomChar2 = chars.charAt(Math.floor(Math.random() * chars.length));
        const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 digits
        return `${randomChar1}${randomChar2}${randomDigits}`;
    };

    try {
        let order;
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries) {
            const customId = generateOrderId();

            const { data, error } = await supabase
                .from('orders')
                .insert({
                    user_id: userId,
                    total_amount: total,
                    status: 'pending',
                    shipping_address: shippingAddress,
                    phone: phone,
                    payment_method: paymentMethod || 'fastpay',
                    order_number: customId
                })
                .select()
                .single();

            if (!error) {
                order = data;
                break;
            }

            // If error is unique violation, retry. Otherwise throw.
            if (error.code !== '23505') throw error;
            retries++;
        }

        if (!order) throw new Error("Failed to generate unique order ID");

        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // Fetch user email for notification
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const email = userData?.user?.email;

        // Send Confirmation Email
        if (email && resend) {
            try {
                await resend.emails.send({
                    from: 'Tarzify <order@tarzify.com>',
                    to: email,
                    subject: `Order Confirmation #${order.order_number}`,
                    html: `<h1>Thank you for your order!</h1><p>Your Order ID is <strong>${order.order_number}</strong></p><p>Total: Rs. ${total}</p>`
                });
            } catch (e) {
                console.error('Email failed:', e);
            }
        }

        // Reduce Stock
        for (const item of items) {
            await supabase.rpc('decrement_stock', { product_id: item.id, amount: item.quantity });
        }

        res.json({ success: true, orderId: order.order_number });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.patch('/status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
