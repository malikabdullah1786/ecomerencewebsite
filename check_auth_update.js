import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserUpdate() {
    console.log('--- Checking User Auth/Update Status ---');

    const emails = ['malikabdullah1786@gmail.com', 'l243071@lhr.nu.edu.pk'];

    for (const email of emails) {
        console.log(`\nChecking: ${email}`);
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error('Error listing users:', error);
            continue;
        }

        const user = users.find(u => u.email === email);

        if (user) {
            console.log(`ID: ${user.id}`);
            console.log(`Role: ${user.role}`);
            console.log(`Last Sign In: ${user.last_sign_in_at}`);
            console.log(`Updated At:   ${user.updated_at}`);
            console.log(`Created At:   ${user.created_at}`);
        } else {
            console.log('User not found.');
        }
    }
}

checkUserUpdate();
