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
                const itemsList = items.map((item: any) => `<li>${item.name} (${item.quantity}x) - Rs. ${item.price}</li>`).join('');
                await resend.emails.send({
                    from: 'TARZIFY <order@tarzify.com>',
                    to: email,
                    subject: `Order Confirmation #${order.order_number}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
                            <h2 style="color: #ff3366; text-transform: uppercase;">Thank you for your order!</h2>
                            <p>We've received your order <strong>#${order.order_number}</strong> and it is being processed.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                            <h3>Order Summary</h3>
                            <ul style="list-style: none; padding: 0;">
                                ${itemsList}
                            </ul>
                            <p style="font-size: 18px; font-weight: bold;">Total Paid: Rs. ${total}</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p>Shipping to: ${shippingAddress}</p>
                            <p>Track your order anytime at <a href="https://tarzify.com/track">tarzify.com/track</a> using your Order ID.</p>
                        </div>
                    `
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

router.patch('/assign-tracking/:id', async (req, res) => {
    const { id } = req.params;
    const { tracking_number, courier_name } = req.body;

    try {
        const { error } = await supabase
            .from('orders')
            .update({
                tracking_number,
                courier_name,
                status: 'shipped' // Automatically move to shipped when tracking is assigned
            })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
