import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rsduijvlwlyspilrjalm.supabase.co';
const supabaseAnonKey = 'sb_publishable_mQW_fSMYmlY6rpaTmE6YUg__Xo-2Klt';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    console.log('--- One-Time DB Verification ---');
    const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Connection Failed:', error.message);
    } else {
        console.log('✅ Connection Success!');
        console.log(`✅ Table "users" is accessible. Rows: ${count}`);
    }

    // Check event_game_stats
    const { error: statsError } = await supabase
        .from('event_game_stats')
        .select('*', { head: true, count: 'exact' });

    if (statsError) {
        console.error('❌ event_game_stats check failed:', statsError.message);
    } else {
        console.log('✅ event_game_stats table is accessible.');
    }

    console.log('--- Verification Complete ---');
}

verify().catch(console.error);
