// tmp_add_beer.js
// Script to simulate addBeer logic via Supabase REST API
// Usage: node tmp_add_beer.js

const url = 'https://rsduijvlwlyspilrjalm.supabase.co';
const anon = 'sb_publishable_mQW_fSMYmlY6rpaTmE6YUg__Xo-2Klt';
const headersBase = { 'apikey': anon, 'Authorization': `Bearer ${anon}`, 'Content-Type': 'application/json' };

(async ()=>{
  try{
    // 1. Create test user
    const name = `AutomationTestUser_${Date.now()}`;
    const createUser = await fetch(`${url}/rest/v1/users`, {method: 'POST', headers: {...headersBase, Prefer: 'return=representation'}, body: JSON.stringify({name})});
    const userText = await createUser.text();
    console.log('== create user ==');
    console.log('status:', createUser.status);
    console.log('body:', userText);

    let userId = null;
    try{ const parsed = JSON.parse(userText); userId = parsed[0]?.id || parsed.id; } catch(e){}
    if(!userId){ console.error('Failed to obtain user id; aborting.'); return; }

    // 2. Insert beer for that user
    const createBeer = await fetch(`${url}/rest/v1/beers`, {method: 'POST', headers: {...headersBase, Prefer: 'return=representation'}, body: JSON.stringify({user_id: userId, added_by: userId})});
    const beerText = await createBeer.text();
    console.log('\n== create beer ==');
    console.log('status:', createBeer.status);
    console.log('body:', beerText);

    let beerRow = null;
    try{ const parsed = JSON.parse(beerText); beerRow = parsed[0] || parsed; } catch(e){}
    if(!beerRow){ console.error('Failed to obtain created beer row; aborting.'); return; }

    // 3. Fetch recent beers (order created_at desc limit 10)
    const recentRes = await fetch(`${url}/rest/v1/beers?user_id=eq.${userId}&order=created_at.desc&limit=10`, {headers: headersBase});
    const recentText = await recentRes.text();
    console.log('\n== recent beers (limit 10) ==');
    console.log('status:', recentRes.status);
    console.log('body:', recentText);

    let recentBeers = [];
    try{ recentBeers = JSON.parse(recentText); } catch(e){ recentBeers = []; }

    // 4. Compute lifetime count (fetch all beers for user and get length)
    const allRes = await fetch(`${url}/rest/v1/beers?user_id=eq.${userId}&select=id`, {headers: headersBase});
    const allText = await allRes.text();
    let lifetimeCount = 0;
    try{ const parsed = JSON.parse(allText); lifetimeCount = Array.isArray(parsed) ? parsed.length : 0; } catch(e){ lifetimeCount = 0; }
    console.log('\n== lifetime beers count ==');
    console.log('status:', allRes.status);
    console.log('count:', lifetimeCount);

    // 5. Inline checkAchievements logic (adapted from project)
    const checkAchievements = (currentBeers, newBeer, totalLifetimeBeers) => {
      const unlocked = [];
      const now = new Date(newBeer.created_at);

      // Early Bird: before 18:00 and after or equal 6:00
      if (now.getHours() < 18 && now.getHours() >= 6) unlocked.push('early_bird');
      // Night Owl: after 02:00 and before 06:00
      if (now.getHours() >= 2 && now.getHours() < 6) unlocked.push('night_owl');
      // Weekend Warrior: Fri (5) or Sat (6)
      const day = now.getDay(); if (day === 5 || day === 6) unlocked.push('weekend_warrior');
      // Century Club: exactly 100
      if (totalLifetimeBeers === 100) unlocked.push('century_club');

      // Hat Trick: 3 beers in under 1 hour
      const userBeers = (currentBeers || []).filter(b => b.user_id === newBeer.user_id);
      const sortedBeers = [...userBeers, newBeer].sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (sortedBeers.length >= 3) {
        const b1 = sortedBeers[0];
        const b3 = sortedBeers[2];
        if (b1 && b3) {
          const latest = new Date(b1.created_at).getTime();
          const thirdLatest = new Date(b3.created_at).getTime();
          const diffHours = (latest - thirdLatest) / (1000*60*60);
          if (diffHours <= 1) unlocked.push('hat_trick');
        }
      }

      // First Blood: if currentBeers length === 0
      if ((currentBeers || []).length === 0) unlocked.push('first_blood');

      // Dedup
      return [...new Set(unlocked)];
    };

    const potentialBadges = checkAchievements(recentBeers, beerRow, lifetimeCount);
    console.log('\n== potential badges ==');
    console.log(potentialBadges);

    // 6. Fetch existing achievements for user
    const achRes = await fetch(`${url}/rest/v1/achievements?user_id=eq.${userId}`, {headers: headersBase});
    const achText = await achRes.text();
    console.log('\n== existing achievements ==');
    console.log('status:', achRes.status);
    console.log('body:', achText);

    let existing = [];
    try{ existing = JSON.parse(achText); } catch(e){ existing = []; }

    const owned = new Set(existing.map(a=>a.badge_type));
    const newlyUnlocked = potentialBadges.filter(b => !owned.has(b));

    // 7. Insert newly unlocked badges
    let inserted = [];
    if (newlyUnlocked.length>0) {
      const body = JSON.stringify(newlyUnlocked.map(type=>({ user_id: userId, badge_type: type })));
      const insRes = await fetch(`${url}/rest/v1/achievements`, {method: 'POST', headers: {...headersBase, Prefer: 'return=representation'}, body});
      const insText = await insRes.text();
      console.log('\n== insert achievements ==');
      console.log('status:', insRes.status);
      console.log('body:', insText);
      try{ inserted = JSON.parse(insText); } catch(e){ inserted = []; }
    } else {
      console.log('\nNo new badges to insert.');
    }

    // 8. Print concise summary
    console.log('\n=== SUMMARY ===');
    console.log('user_id:', userId);
    console.log('beer_id:', beerRow.id || beerRow);
    console.log('potential_badges:', potentialBadges);
    console.log('newly_inserted_badges:', inserted.map(i=>i.badge_type || i));

  } catch(e){ console.error('Error:', e && e.message ? e.message : e); }
})();
