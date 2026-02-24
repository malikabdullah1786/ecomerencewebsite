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
            <td style="padding: 15px 15px 15px 0; border-bottom: 1px solid #eeeeee; width: 60px;">
                <img src="${item.image || 'https://via.placeholder.com/60'}" width="60" height="60" style="border-radius: 8px; block-size: 60px; object-fit: cover;" alt="${item.name}">
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid #eeeeee;">
                <div style="font-weight: 700; color: #212121; font-size: 14px; margin-bottom: 4px;">${item.name}</div>
                <div style="color: #757575; font-size: 12px;">Qty: ${item.quantity} | Rs. ${item.price.toLocaleString()} each</div>
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: 700; color: #212121; vertical-align: top;">
                Rs. ${(item.price * item.quantity).toLocaleString()}
            </td>
        </tr>
    `).join('');

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"TARZIFY" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Hooray! Your Order #${order.order_number} is Confirmed`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f6; color: #212121;">
                    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                        
                        <!-- Top Accent Bar -->
                        <div style="height: 6px; background-color: #f85606;"></div>

                        <!-- Logo Section -->
                        <div style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
                            <h1 style="margin: 0; color: #f85606; font-size: 32px; font-weight: 900; letter-spacing: -1px; font-style: italic;">TARZIFY</h1>
                            <p style="margin: 5px 0 0 0; color: #424242; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Elevating Your Lifestyle</p>
                        </div>

                        <!-- Success Header -->
                        <div style="padding: 40px 40px 30px; text-align: center;">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 15px;">
                                <tr>
                                    <td align="center" valign="middle" style="color: #f85606; font-size: 64px; font-weight: bold; line-height: 1;">
                                        &#10003;
                                    </td>
                                </tr>
                            </table>
                            <h2 style="margin: 0 0 10px 0; color: #212121; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Order Confirmed!</h2>
                            <p style="margin: 0; color: #424242; font-size: 16px; line-height: 1.5; font-weight: 500;">Hi there! We've received your order and we're getting it ready for shipment.</p>
                        </div>

                        <!-- Order Summary Box -->
                        <div style="padding: 0 40px 40px;">
                            <div style="background-color: #f9f9f9; border-radius: 12px; padding: 25px; border: 1px solid #eeeeee;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding-bottom: 15px; font-size: 11px; color: #424242; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Order ID</td>
                                        <td style="padding-bottom: 15px; font-size: 11px; color: #424242; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; text-align: right;">Date</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 20px; color: #f85606; font-weight: 900; letter-spacing: -0.5px;">#${order.order_number}</td>
                                        <td style="font-size: 16px; color: #212121; font-weight: 800; text-align: right;">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Items List -->
                            <div style="margin-top: 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    ${itemsRows}
                                </table>
                            </div>

                            <!-- Totals -->
                            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #212121;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #424242; font-size: 14px; font-weight: 600;">Subtotal</td>
                                        <td style="padding: 8px 0; text-align: right; color: #212121; font-weight: 700; font-size: 15px;">Rs. ${subtotal.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #424242; font-size: 14px; font-weight: 600;">Shipping</td>
                                        <td style="padding: 8px 0; text-align: right; color: #212121; font-weight: 700; font-size: 15px;">Rs. ${shippingCost.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 0 0 0; color: #212121; font-size: 20px; font-weight: 900;">Total Amount</td>
                                        <td style="padding: 20px 0 0 0; text-align: right; color: #f85606; font-size: 24px; font-weight: 900;">Rs. ${total.toLocaleString()}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Payment & Shipping Info -->
                            <div style="margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                                            <h3 style="margin: 0 0 10px 0; font-size: 11px; color: #424242; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Shipping To</h3>
                                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #212121; font-weight: 700;">${shippingAddress}</p>
                                        </td>
                                        <td style="width: 50%; vertical-align: top;">
                                            <h3 style="margin: 0 0 10px 0; font-size: 11px; color: #424242; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Payment Method</h3>
                                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #212121; font-weight: 700;">${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online (FastPay)'}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Track Button -->
                            <div style="margin-top: 50px; text-align: center;">
                                <a href="https://tarzify.com/#track-order" style="display: inline-block; background-color: #f85606; color: #ffffff; padding: 20px 45px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 8px 20px rgba(248, 86, 6, 0.3);">Track My Order Now</a>
                            </div>

                        </div>

                        <!-- Friendly Footer -->
                        <div style="background-color: #1a1a1a; padding: 40px; text-align: center; color: #ffffff;">
                            <div style="margin-bottom: 25px;">
                                <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 900; letter-spacing: 1px;">QUESTIONS?</h4>
                                <p style="margin: 0; font-size: 14px; opacity: 0.8; font-weight: 500;">Email us anytime at <a href="mailto:support@tarzify.com" style="color: #f85606; text-decoration: none; font-weight: 800; border-bottom: 1px solid #f85606;">support@tarzify.com</a></p>
                            </div>
                            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 25px; font-size: 12px; opacity: 0.6; font-weight: 500;">
                                <p style="margin: 0 0 8px 0; letter-spacing: 0.5px;">&copy; 2026 TARZIFY. HIGH QUALITY LIFESTYLE STORE.</p>
                                <p style="margin: 0;">This is an automated confirmation email. Please do not reply.</p>
                            </div>
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

    // Validation: All fields mandatory
    if (!customerName || !shippingAddress || !phone || !items || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Missing required information. Please provide full name, address, and phone number.'
        });
    }

    const generateOrderId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomChar1 = chars.charAt(Math.floor(Math.random() * chars.length));
        const randomChar2 = chars.charAt(Math.floor(Math.random() * chars.length));
        const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 digits
        return `${randomChar1}${randomChar2}${randomDigits}`;
    };

    try {
        // 1. Verify Stock for all items first
        for (const item of items) {
            const { data: product, error: stockErr } = await supabase
                .from('products')
                .select('stock, name')
                .eq('id', item.id)
                .single();

            if (stockErr || !product) throw new Error(`Product ${item.id} not found`);
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} left.`);
            }
        }

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
                    payment_method: paymentMethod || 'cod',
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
        const finalEmail = req.body.email || email; // Prefer provided email from body

        if (finalEmail) {
            console.log(`Attempting to send order email to: ${finalEmail}`);
            const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
            const shippingCost = total - subtotal;
            await sendOrderEmail(finalEmail, order, items, subtotal, shippingCost, total, shippingAddress);
        } else {
            console.warn('No email found for order notification. Skipping.');
        }

        // 2. Reduce Stock (Now safer because we checked above)
        for (const item of items) {
            await supabase.rpc('decrement_stock', { product_id: item.id, amount: item.quantity });
        }

        res.json({ success: true, orderId: order.order_number });
    } catch (error: any) {
        console.error('Order creation error:', error);
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
