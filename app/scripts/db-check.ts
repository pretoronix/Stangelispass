import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the app directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
    console.log('--- Supabase Database Health Check ---');
    console.log(`URL: ${supabaseUrl}`);

    const tablesToCheck = [
        'users',
        'events',
        'beers',
        'achievements',
        'wall_of_fame',
        'toasts',
        'beer_stamps',
        'device_tokens',
        'notifications',
        'comments',
        'event_game_stats',
        'event_leader_state',
        'event_leader_snapshots'
    ];

    for (const table of tablesToCheck) {
        process.stdout.write(`Checking table "${table}"... `);
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log('❌ FAILED');
            console.error(`  Error: ${error.message} (${error.code})`);
        } else {
            console.log(`✅ OK (Rows: ${count ?? 0})`);
        }
    }

    console.log('\n--- Schema Integrity Check ---');
    // Check a specific recent table for column existence
    const { data: stats, error: statsError } = await supabase
        .from('event_game_stats')
        .select('*')
        .limit(1);

    if (!statsError) {
        console.log('✅ event_game_stats table is accessible and has data/columns.');
    } else {
        console.warn('⚠️ Could not verify event_game_stats columns.');
    }

    console.log('\n--- Connection Check Complete ---');
}

checkDatabase().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
