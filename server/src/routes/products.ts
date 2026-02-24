import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { supabase } from '../lib/supabase';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Cloudinary Config
const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
};

console.log('[Cloudinary] Attempting initialization with:', {
    cloud_name: cloudinaryConfig.cloud_name,
    api_key: cloudinaryConfig.api_key,
    has_secret: !!cloudinaryConfig.api_secret
});

cloudinary.config(cloudinaryConfig);

// Upload Endpoint (Base64 Images)
router.post('/upload', async (req, res) => {
    try {
        const { images } = req.body; // Array of base64 strings
        console.log(`[Upload] Received ${images?.length || 0} images`);

        if (!images || !Array.isArray(images) || images.length === 0) {
            throw new Error('No images provided in base64 format');
        }

        const uploadPromises = images.map(async (base64, idx) => {
            console.log(`[Upload] Processing image ${idx + 1}/${images.length} (Size: ${Math.round(base64.length / 1024)} KB)`);
            // Upload directly to Cloudinary
            const response = await cloudinary.uploader.upload(base64, {
                folder: 'tarzify/products'
            });
            console.log(`[Upload] Image ${idx + 1} uploaded successfully: ${response.secure_url}`);
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
