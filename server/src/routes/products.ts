import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dtaonueid',
    api_key: process.env.CLOUDINARY_API_KEY || '895755865122633',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'GXSLkzUOZjxmc93FtnzaY5MuLhs'
});

const upload = multer({ storage: multer.memoryStorage() });

// Upload Endpoint (Multiple Images)
router.post('/upload', upload.array('images', 5), async (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) throw new Error('No files uploaded');

        const uploadPromises = files.map(async (file) => {
            const b64 = Buffer.from(file.buffer).toString('base64');
            let dataURI = "data:" + file.mimetype + ";base64," + b64;
            const response = await cloudinary.uploader.upload(dataURI, {
                folder: 'tarzify/products'
            });
            return response.secure_url;
        });

        const urls = await Promise.all(uploadPromises);

        res.json({
            success: true,
            imageUrls: urls
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
