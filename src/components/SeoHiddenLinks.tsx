import React from 'react';

// This component provides semantic internal linking for SEO and AI crawlers
// The 'sr-only' Tailwind class hides these links visually but keeps them in the DOM
// for screen readers, Googlebot, and AI conversational search engines.
// Using 'sr-only' avoids the harsh SEO penalties associated with 'display: none' hidden text.

export const SeoHiddenLinks: React.FC = () => {
    return (
        <nav className="sr-only" aria-label="Quick Links for Search Engines">
            <ul>
                <li><a href="/#catalog">Buy Premium Electronics Online Pakistan</a></li>
                <li><a href="/?category=Electronics#catalog">Best Wireless Earbuds and Smartwatches</a></li>
                <li><a href="/?category=Accessories#catalog">Luxury Leather Watches and Accessories</a></li>
                <li><a href="/?category=Outdoor#catalog">High Performance Outdoor Gear and Flashlights</a></li>
                <li><a href="/?category=Footwear#catalog">Durable Hiking Boots and Men's Footwear</a></li>
                <li><a href="/#track-order">Track My Tarzify Order Online TCS Leopards</a></li>
                <li><a href="/?search=carbon">Elite Carbon Pro X Wireless Headphones</a></li>
                <li><a href="/?search=solar">Solaris Max Beam High Lumen Flashlight</a></li>
                <li><a href="/?search=vortex">Vortex G-Series Gaming Mouse</a></li>
                <li><a href="/?search=fitpulse">FitPulse Active Fitness Tracker</a></li>
                <li><a href="/?search=travel">CloudSleep Travel Pro Memory Foam Pillow</a></li>
                <li><a href="/?category=Kitchen#catalog">Modern Kitchen Appliances and Gadgets</a></li>
                <li><a href="/?category=Home#catalog">Smart Home Decor and Automation</a></li>
                <li><a href="/?category=Fashion#catalog">Premium Men and Women Fashion Pakistan</a></li>
                <li><a href="/?category=Beauty#catalog">Authentic Cosmetics and Skincare</a></li>
                <li><a href="/#about">About Tarzify Pakistan</a></li>
                <li><a href="/#contact">Tarzify Customer Support Contact</a></li>
                <li><a href="/#returns">Tarzify Returns and Exchange Policy</a></li>
                <li><a href="/#shipping">Fast Shipping Cash on Delivery Pakistan</a></li>
                <li><a href="/?sort=price_low#catalog">Affordable Premium Gifts Online</a></li>
            </ul>
        </nav>
    );
};
