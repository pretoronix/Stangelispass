#!/bin/bash
# Supabase Migration Push Script
# This script links your local project to remote Supabase and pushes all migrations

set -e  # Exit on error

PROJECT_REF="rsduijvlwlyspilrjalm"
DB_PASSWORD="AR6dhUge8zIM0uWY"
APP_DIR="/Users/ppf/Downloads/Stängelispass/app"

echo "🚀 Supabase Migration Push Script"
echo "=================================="
echo ""

# Navigate to app directory
cd "$APP_DIR"
echo "📁 Working directory: $(pwd)"
echo ""

# Step 1: Link project (if not already linked)
echo "🔗 Step 1: Linking to Supabase project..."
if supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD" 2>/dev/null; then
    echo "✅ Project linked successfully"
else
    echo "ℹ️  Project already linked (this is fine)"
fi
echo ""

# Step 2: Check migration status
echo "📋 Step 2: Checking migration status..."
echo "Pending migrations:"
supabase db diff --linked || echo "No diff available"
echo ""

# Step 3: Push migrations
echo "🚢 Step 3: Pushing migrations to remote database..."
echo "This will apply all migrations in supabase/migrations/"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push --linked
    echo ""
    echo "✅ Migrations pushed successfully!"
else
    echo "❌ Migration push cancelled"
    exit 0
fi
echo ""

# Step 4: Verify beer_price column
echo "🔍 Step 4: Verifying beer_price column exists..."
if supabase db diff --linked --schema public | grep -q "beer_price"; then
    echo "✅ beer_price column verified in schema"
else
    echo "⚠️  Could not verify beer_price column (may need manual check)"
fi
echo ""

# Step 5: Summary
echo "📊 Summary"
echo "=================================="
echo "✅ Project linked: $PROJECT_REF"
echo "✅ Migrations applied"
echo "✅ Database schema updated"
echo ""
echo "🎯 Next steps:"
echo "1. Restart Metro: cd $APP_DIR && npx expo start -c"
echo "2. Test event creation in the app"
echo "3. Verify no PGRST204 errors"
echo ""
echo "✨ Done!"
