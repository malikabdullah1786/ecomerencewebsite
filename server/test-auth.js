
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Env Vars!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    console.log(`Testing Auth with: ${testEmail}`);

    try {
        // 1. Sign Up
        console.log('1. Attempting Sign Up...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
        });

        if (signUpError) {
            console.error('SignUp Failed:', signUpError.message);
            return;
        }
        console.log('SignUp Success! User ID:', signUpData.user?.id);

        // Check if email confirmation is required
        if (signUpData.session === null && signUpData.user) {
            console.warn('WARNING: Session is null. Email confirmation is likely REQUIRED.');
            console.log('Cannot proceed to Login test without email verification.');
            return;
        }

        // 2. Sign In
        console.log('2. Attempting Sign In...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
        });

        if (signInError) {
            console.error('SignIn Failed:', signInError.message);
            return;
        }

        console.log('SignIn Success!');
        console.log('Access Token:', signInData.session?.access_token ? 'Present' : 'Missing');

    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testAuth();
