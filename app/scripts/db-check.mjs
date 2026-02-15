import { createClient } from '@supabase/supabase-js';
import pkg from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
const { config } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the app directory
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading environment from: ${envPath}`);

if (fs.existsSync(envPath)) {
    console.log('✅ Found .env file.');
    config({ path: envPath });
} else {
    console.error('❌ Could not find .env file at expected path.');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env');
    console.log('Current process.env keys (subset):', Object.keys(process.env).filter(k => k.startsWith('EXPO_')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const formatSupabaseError = (error) => {
    if (!error) return null;
    const code = error.code || 'UNKNOWN';
    const message = error.message || String(error);
    if (code === 'PGRST204') {
        return `Missing column (PGRST204): ${message}. Run migrations (ensure 014_add_beer_price_to_events.sql applied).`;
    }
    if (code === 'PGRST205' || code === '42P01') {
        return `Missing table (PGRST205/42P01): ${message}. Run schema + migrations in Supabase.`;
    }
    return `${code}: ${message}`;
};

async function checkSelect(table, columns, hint) {
    const { error } = await supabase.from(table).select(columns, { head: true, count: 'exact' });
    if (error) {
        const formatted = formatSupabaseError(error);
        throw new Error(`${formatted}${hint ? ` (${hint})` : ''}`);
    }
}

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
        try {
            const { error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });

            if (error) {
                process.stdout.write(`Checking table "${table}"... ❌ FAILED (${error.code})\n`);
                console.error(`  Error: ${formatSupabaseError(error)}`);
            } else {
                process.stdout.write(`Checking table "${table}"... ✅ OK (Rows: ${count ?? 0})\n`);
            }
        } catch (e) {
            process.stdout.write(`Checking table "${table}"... ❌ CRASHED\n`);
            console.error(e);
        }
    }

    console.log('\n--- Critical Schema Checks ---');
    try {
        await checkSelect('events', 'id, beer_price, current_leader', 'required for event creation + leader tracking');
        console.log('✅ events has required columns (id, beer_price, current_leader).');

        await checkSelect('notifications', 'id, target_user, payload, processed, attempts, created_at', 'required for push queue + processor');
        console.log('✅ notifications has required columns (target_user, payload, processed, attempts, created_at).');
    } catch (e) {
        console.error('❌ Critical schema check failed:', e?.message || e);
        process.exitCode = 1;
    }

    console.log('\n--- Connection Check Complete ---');
}

checkDatabase().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
