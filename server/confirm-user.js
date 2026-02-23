
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Service Key or URL!');
    process.exit(1);
}

// Create client with SERVICE ROLE (Admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function confirmUser(email) {
    console.log(`Attempting to confirm email for: ${email}`);

    // 1. Get User ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('List Users Error:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log(`Found User ID: ${user.id}`);
    console.log(`Current Status: ${user.email_confirmed_at ? 'Confirmed' : 'Unconfirmed'}`);

    if (user.email_confirmed_at) {
        console.log('User is already confirmed.');
        return;
    }

    // 2. Confirm Email
    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true, user_metadata: { email_verified: true } }
    );

    if (error) {
        console.error('Confirmation Failed:', error);
    } else {
        console.log('SUCCESS: User email verified manually!');
    }
}

// Get email from command line arg
const targetEmail = process.argv[2];
if (!targetEmail) {
    console.log('Usage: node confirm-user.js <email>');
} else {
    confirmUser(targetEmail);
}
