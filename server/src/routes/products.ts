import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Cloudinary Config - Use environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dtaonueid',
    api_key: process.env.CLOUDINARY_API_KEY || 'GXSLkzUOZjxmc93FtnzaY5MuLhs',
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

// Upload Endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) throw new Error('No file uploaded');

        // Upload to Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const response = await cloudinary.uploader.upload(dataURI, {
            folder: 'tarzify/products'
        });

        res.json({
            success: true,
            imageUrl: response.secure_url
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
