import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReviews() {
    console.log('--- Checking Reviews Table ---');

    // 1. Try to fetch reviews
    const { data: reviews, error: fetchError } = await supabase
        .from('reviews')
        .select('*');

    if (fetchError) {
        console.error('Fetch Error:', fetchError);
    } else {
        console.log(`Fetched ${reviews.length} reviews.`);
        console.log(reviews);
    }

    // 2. Check Table Info (via obscure RPC or assumption)
    // We can't easy check RLS status via JS client without specific SQL functions.
    // But verifying if we can read with Service Role Key (which bypasses RLS) vs Anon Key is a good test.
}

checkReviews();
