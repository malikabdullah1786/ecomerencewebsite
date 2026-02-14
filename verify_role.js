import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFixRole() {
    console.log('--- Merchant Role Verification ---');

    // 1. Get the user from auth.users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const targetUser = users.find(u => u.email === 'malikabdullah1786@gmail.com');
    if (!targetUser) {
        console.log('User malikabdullah1786@gmail.com not found.');
        return;
    }

    console.log(`User found: ${targetUser.id}`);

    // 2. Check profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUser.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        return;
    }

    if (!profile) {
        console.log('Profile missing. Creating merchant profile...');
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: targetUser.id,
                full_name: targetUser.user_metadata?.full_name || 'Merchant User',
                role: 'merchant'
            });

        if (insertError) {
            console.error('Error creating profile:', insertError);
        } else {
            console.log('SUCCESS: Merchant profile created.');
        }
    } else {
        console.log(`Current role: ${profile.role}`);
        if (profile.role !== 'merchant') {
            console.log('Updating role to merchant...');
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'merchant' })
                .eq('id', targetUser.id);

            if (updateError) {
                console.error('Error updating role:', updateError);
            } else {
                console.log('SUCCESS: Role updated to merchant.');
            }
        } else {
            console.log('Role is already correctly set to merchant.');
        }
    }
}

checkAndFixRole();
