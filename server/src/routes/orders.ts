import express from 'express';
import nodemailer from 'nodemailer';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Helper to send order email using Nodemailer & Hostinger SMTP
const sendOrderEmail = async (email: string, order: any, items: any, total: number, shippingAddress: string) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials missing, skipping email.');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true, // true for 465, false for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const itemsList = items.map((item: any) => `<li>${item.name} (${item.quantity}x) - Rs. ${item.price}</li>`).join('');

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"TARZIFY" <${process.env.SMTP_USER}>`,
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
        console.log('Order email sent successfully via Hostinger SMTP.');
    } catch (error) {
        console.error('Nodemailer error:', error);
    }
};

router.post('/create', async (req, res) => {
    const { userId, items, total, shippingAddress, phone, paymentMethod, customerName } = req.body;

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
                    order_number: customId,
                    customer_name: customerName
                })
                .select()
                .single();

            if (!error) {
                order = data;
                break;
            }

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

        // Send Confirmation Email via Hostinger SMTP
        if (email) {
            await sendOrderEmail(email, order, items, total, shippingAddress);
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
    const { tracking_number, courier_name, shipping_proof_url } = req.body;

    try {
        const { error } = await supabase
            .from('orders')
            .update({
                tracking_number,
                courier_name,
                shipping_proof_url,
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
