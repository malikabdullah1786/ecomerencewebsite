import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
}

export const SEO = ({
    title = 'Tarzify | Premium Lifestyle Store',
    description = 'Discover a complete shopping ecosystem where premium quality meets unparalleled convenience. Enjoy rapid, tracked delivery across Pakistan.',
    image = '/og-image-1200.png', // Fallback to optimized OG image
    url = 'https://www.tarzify.com',
    type = 'website'
}: SEOProps) => {
    const siteTitle = title === 'Tarzify | Premium Lifestyle Store' ? title : `${title} | Tarzify`;
    const baseUrl = 'https://www.tarzify.com';

    // Ensure absolute image URL for social previews
    const absoluteImageUrl = image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
    const absolutePageUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

    // Schema.org Organization Markup
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Tarzify",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+92-309-4561786",
            "contactType": "customer service",
            "areaServed": "PK",
            "availableLanguage": "English"
        },
        "sameAs": [
            "https://www.facebook.com/tarzify",
            "https://www.instagram.com/tarzify",
            "https://twitter.com/tarzify"
        ]
    };

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content="ecommerce, online shopping Pakistan, luxury store, premium products, Tarzify, best online store, lifestyle products, electronics, fashion, home decor" />
            <link rel="canonical" href={absolutePageUrl} />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta name="author" content="Tarzify Pakistan" />
            <meta name="publisher" content="Tarzify" />

            {/* Geographic Metadata */}
            <meta name="geo.region" content="PK-PB" />
            <meta name="geo.placename" content="Lahore" />
            <meta name="geo.position" content="31.5204;74.3587" />
            <meta name="ICBM" content="31.5204, 74.3587" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={absolutePageUrl} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={absoluteImageUrl} />
            <meta property="og:image:secure_url" content={absoluteImageUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={siteTitle} />
            <meta property="og:site_name" content="Tarzify" />
            <meta property="og:locale" content="en_PK" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={absolutePageUrl} />
            <meta property="twitter:title" content={siteTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={absoluteImageUrl} />
            <meta property="twitter:image:alt" content={siteTitle} />
            <meta name="twitter:site" content="@tarzify" />
            <meta name="twitter:creator" content="@tarzify" />

            {/* Advanced Technical Meta */}
            <meta name="theme-color" content="#1e3a8a" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="format-detection" content="telephone=no" />

            {/* Favicon - Technical Compliance for Google Search */}
            <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

            {/* Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(organizationSchema)}
            </script>
        </Helmet>
    );
};
