import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const slugify = (name: string): string =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 70);

const generateProductURL = (name: string, sku: string): string => {
    const slug = slugify(name);
    return `#product/${slug}-${sku.toLowerCase()}`;
};

async function generateSitemap() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('name, sku, created_at');

        if (error) throw error;

        const dateCurrent = new Date().toISOString().split('T')[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Static routes
        const staticRoutes = [
            { path: '', priority: '1.0', changefreq: 'daily' },
            { path: '#categories', priority: '0.8', changefreq: 'weekly' },
            { path: '#track-order', priority: '0.5', changefreq: 'monthly' },
            { path: '#privacy', priority: '0.3', changefreq: 'yearly' },
            { path: '#returns', priority: '0.3', changefreq: 'yearly' },
        ];

        for (const route of staticRoutes) {
            xml += `  <url>\n`;
            xml += `    <loc>https://www.tarzify.com/${route.path}</loc>\n`;
            xml += `    <lastmod>${dateCurrent}</lastmod>\n`;
            xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
            xml += `    <priority>${route.priority}</priority>\n`;
            xml += `  </url>\n`;
        }

        // Dynamic routes (Products)
        if (products) {
            for (const product of products) {
                const productUrlPath = generateProductURL(product.name, product.sku);
                const lastmod = product.created_at ? new Date(product.created_at).toISOString().split('T')[0] : dateCurrent;

                xml += `  <url>\n`;
                xml += `    <loc>https://www.tarzify.com/${productUrlPath}</loc>\n`;
                xml += `    <lastmod>${lastmod}</lastmod>\n`;
                xml += `    <changefreq>daily</changefreq>\n`; // Assuming products might change occasionally
                xml += `    <priority>0.9</priority>\n`; // Products are important
                xml += `  </url>\n`;
            }
        }

        xml += `</urlset>\n`;

        const sitemapPath = path.resolve(__dirname, '../../public/sitemap.xml');
        fs.writeFileSync(sitemapPath, xml);

        console.log(`Successfully generated sitemap.xml with ${products?.length || 0} products at ${sitemapPath}`);
    } catch (err) {
        console.error('Error generating sitemap:', err);
    }
}

generateSitemap();
