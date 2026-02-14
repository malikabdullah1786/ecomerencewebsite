import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

import ordersRouter from './routes/orders';
import paymentRouter from './routes/payment';
import shippingRouter from './routes/shipping';
import productsRouter from './routes/products';
import { supabase } from './lib/supabase';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.supabasedemo.com"],
            "img-src": ["'self'", "data:", "blob:", "https://*.cloudinary.com", "https://*.unsplash.com"],
            "connect-src": ["'self'", "https://*.supabase.co", "https://*.cloudinary.com"]
        }
    }
}));
app.use(cors({
    origin: true, // Allow all origins (for debugging/initial setup)
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/products', productsRouter);

// Secure Password Update Endpoint (Bypasses Client Auth Quirks)
app.post('/api/update-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Verify User
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Admin Update (Service Role)
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Password Update Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Seed Endpoint to ensure 8+ products
app.post('/api/setup/seed', async (req, res) => {
    const products = [
        { name: 'Premium Wireless Headphones', sku: 'HEAD-001', price: 15500, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', category: 'Electronics', stock: 50 },
        { name: 'Minimalist Leather Watch', sku: 'WATCH-002', price: 8500, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', category: 'Accessories', stock: 30 },
        { name: 'Ultra-Bright LED Flashlight', sku: 'LIGHT-003', price: 4200, image_url: 'https://images.unsplash.com/photo-1517055727180-60b70c3f5904?w=800&q=80', category: 'Outdoor', stock: 100 },
        { name: 'Ergonomic Gaming Mouse', sku: 'MOUSE-004', price: 6800, image_url: 'https://images.unsplash.com/photo-1527814732934-94b1ec5d0927?w=800&q=80', category: 'Electronics', stock: 40 },
        { name: 'Smart Fitness Tracker', sku: 'FIT-005', price: 5500, image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80', category: 'Accessories', stock: 75 },
        { name: 'Portable Bluetooth Speaker', sku: 'SPK-006', price: 12000, image_url: 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=800&q=80', category: 'Electronics', stock: 25 },
        { name: 'Waterproof Hiking Boots', sku: 'BOOT-007', price: 18500, image_url: 'https://images.unsplash.com/photo-1520639889313-72702c18d1f0?w=800&q=80', category: 'Outdoor', stock: 15 },
        { name: 'Compact Travel Pillow', sku: 'PILLOW-008', price: 2200, image_url: 'https://images.unsplash.com/photo-1584305116359-ef81baaf2fd3?w=800&q=80', category: 'Accessories', stock: 200 }
    ];

    try {
        const { error } = await supabase.from('products').upsert(products, { onConflict: 'sku' });
        if (error) throw error;
        res.json({ success: true, message: 'Products seeded successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'The All-in-One Store Backend is running (TypeScript)' });
});

app.listen(PORT, () => {
    console.log(`Consolidated TypeScript Server running on port ${PORT}`);
});
