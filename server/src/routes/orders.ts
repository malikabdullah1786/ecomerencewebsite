import express from 'express';
import nodemailer from 'nodemailer';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Helper to send order email using Nodemailer & Hostinger SMTP
const sendOrderEmail = async (email: string, order: any, items: any, subtotal: number, shippingCost: number, total: number, shippingAddress: string) => {
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

    const itemsRows = items.map((item: any) => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                <strong>${item.name}</strong><br/>
                <span style="color: #666; font-size: 13px;">Quantity: ${item.quantity}</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
                Rs. ${(item.price * item.quantity).toLocaleString()}
            </td>
        </tr>
    `).join('');

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"TARZIFY" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Order Confirmation #${order.order_number} - TARZIFY`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
                    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #ff3366 0%, #ff6b9d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 2px;">TARZIFY</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Premium Lifestyle Store</p>
                        </div>

                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            
                            <!-- Success Message -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="width: 60px; height: 60px; background-color: #4CAF50; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                    <span style="color: white; font-size: 30px;">✓</span>
                                </div>
                                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px; font-weight: 600;">Order Confirmed!</h2>
                                <p style="margin: 0; color: #666; font-size: 15px;">Thank you for shopping with us</p>
                            </div>

                            <!-- Order Info -->
                            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Order Number:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #333; font-weight: 600; font-size: 16px;">#${order.order_number}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Order Date:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #333; font-weight: 600;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Payment Method:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #333; font-weight: 600;">${order.payment_method === 'cod' ? 'Cash on Delivery' : 'FastPay'}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Order Items -->
                            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px; font-weight: 600; border-bottom: 2px solid #ff3366; padding-bottom: 10px;">Order Summary</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                ${itemsRows}
                            </table>

                            <!-- Billing Breakdown -->
                            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #666; font-size: 15px;">Subtotal:</td>
                                        <td style="padding: 10px 0; text-align: right; color: #333; font-size: 15px;">Rs. ${subtotal.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #666; font-size: 15px;">Shipping Charges:</td>
                                        <td style="padding: 10px 0; text-align: right; color: #333; font-size: 15px;">Rs. ${shippingCost.toLocaleString()}</td>
                                    </tr>
                                    <tr style="border-top: 2px solid #ddd;">
                                        <td style="padding: 15px 0 0 0; color: #333; font-size: 18px; font-weight: 700;">Total Amount:</td>
                                        <td style="padding: 15px 0 0 0; text-align: right; color: #ff3366; font-size: 20px; font-weight: 700;">Rs. ${total.toLocaleString()}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Shipping Address -->
                            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 600;">Shipping Address</h3>
                            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">${shippingAddress}</p>
                            </div>

                            <!-- Tracking Info -->
                            <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px 20px; border-radius: 4px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                                    <strong style="color: #ff9800;">📦 Track Your Order</strong><br/>
                                    You can track your order status anytime at <a href="https://tarzify.com/#track-order" style="color: #ff3366; text-decoration: none; font-weight: 600;">tarzify.com/#track-order</a> using your Order ID.
                                </p>
                            </div>

                            <!-- Support -->
                            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Need help? Contact us:</p>
                                <p style="margin: 0; color: #ff3366; font-size: 15px; font-weight: 600;">
                                    <a href="mailto:order@tarzify.com" style="color: #ff3366; text-decoration: none;">order@tarzify.com</a>
                                </p>
                            </div>

                        </div>

                        <!-- Footer -->
                        <div style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee;">
                            <p style="margin: 0 0 10px 0; color: #999; font-size: 13px;">© 2026 TARZIFY. All rights reserved.</p>
                            <p style="margin: 0; color: #999; font-size: 12px;">This is an automated email, please do not reply directly.</p>
                        </div>

                    </div>
                </body>
                </html>
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
            // Calculate subtotal from items
            const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
            const shippingCost = total - subtotal;

            await sendOrderEmail(email, order, items, subtotal, shippingCost, total, shippingAddress);
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
