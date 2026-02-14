# Implementation Plan: User Authentication (OTP)

**Priority**: 🔵 FUTURE  
**Estimated Time**: 2-3 weeks  
**Technical Complexity**: ⭐⭐⭐⭐ High  
**ROI**: High (required for scaling)

---

## Overview

Replace name-based user selection with proper SMS/Email OTP authentication using Supabase Auth.

## Current State

✅ Infrastructure:
- Supabase backend
- User table with IDs
- SecureStore for persistence

⏳ Missing:
- Supabase Auth integration
- OTP flow
- User migration strategy
- Row Level Security (RLS)

---

## Time Breakdown

| Task | Duration | Complexity |
|------|----------|------------|
| Plan migration strategy | 8 hours | High |
| Enable Supabase Auth | 4 hours | Medium |
| Build OTP flow UI | 16 hours | Medium |
| Migrate existing users | 12 hours | High |
| Implement RLS policies | 16 hours | High |
| Update all queries | 20 hours | High |
| Testing & QA | 24 hours | High |
| **Total** | **100 hours (12-15 days)** | **High** |

---

## Migration Strategy

### Phase 1: Data Migration

**Challenge**: Map anonymous users to auth UIDs

**Options**:

1. **Fresh Start** (Simplest):
   - New users sign up with OTP
   - Old data archived
   - Clean slate

2. **Email Linking** (Recommended):
   - Contact existing users for email
   - Create auth accounts
   - Link to existing user_id
   - Preserve history

3. **Hybrid**:
   - Keep legacy users table
   - Add auth_uid column (nullable)
   - Gradually migrate

**Recommended**: Hybrid approach

```sql
-- Add auth column to users table
ALTER TABLE users ADD COLUMN auth_uid UUID REFERENCES auth.users(id);
ALTER TABLE users ADD COLUMN migrated_at TIMESTAMPTZ;

-- Index for lookups
CREATE INDEX idx_users_auth_uid ON users(auth_uid);
```

---

### Phase 2: Supabase Auth Setup (4 hours)

**File**: `supabase/config.toml`

```toml
[auth]
enabled = true
site_url = "exp://localhost:8081"
additional_redirect_urls = ["exp://192.168.1.1:8081"]

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false  # OTP instead

[auth.sms]
enable_signup = true
provider = "twilio"  # or messagebird
```

**Environment Variables**:
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_MESSAGE_SERVICE_SID=your_service
```

---

### Phase 3: OTP Flow UI (16 hours)

**File**: `app/src/app/auth/login.tsx` (new)

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { supabase } from '@/services/supabase';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'verify'>('phone');
    const [loading, setLoading] = useState(false);
    
    const sendOTP = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            phone: phone,
        });
        
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setStep('verify');
        }
        setLoading(false);
    };
    
    const verifyOTP = async () => {
        setLoading(true);
        const { data, error } = await supabase.auth.verifyOtp({
            phone: phone,
            token: otp,
            type: 'sms',
        });
        
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            // Create or link user
            await handleAuthSuccess(data.user);
        }
        setLoading(false);
    };
    
    const handleAuthSuccess = async (authUser: any) => {
        // Check if user exists in our users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('auth_uid', authUser.id)
            .single();
        
        if (!existingUser) {
            // Create new user record
            await supabase.from('users').insert({
                auth_uid: authUser.id,
                name: authUser.user_metadata?.name || 'User',
                phone: authUser.phone,
            });
        }
        
        // Navigate to main app
        router.replace('/');
    };
    
    if (step === 'phone') {
        return (
            <View>
                <Text>Enter your phone number</Text>
                <TextInput
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
                <Button title="Send Code" onPress={sendOTP} disabled={loading} />
            </View>
        );
    }
    
    return (
        <View>
            <Text>Enter the code sent to {phone}</Text>
            <TextInput
                placeholder="123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
            />
            <Button title="Verify" onPress={verifyOTP} disabled={loading} />
            <Button title="Resend Code" onPress={sendOTP} />
        </View>
    );
}
```

---

### Phase 4: Row Level Security (16 hours)

**File**: `supabase/migrations/YYYYMMDD_enable_rls.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = auth_uid);

-- Beers policies
CREATE POLICY "Users can view beers in their events"
    ON beers FOR SELECT
    USING (
        event_id IN (
            SELECT event_id FROM event_memberships
            WHERE user_id = (
                SELECT id FROM users WHERE auth_uid = auth.uid()
            )
        )
    );

CREATE POLICY "Users can add beers to their events"
    ON beers FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT event_id FROM event_memberships
            WHERE user_id = (
                SELECT id FROM users WHERE auth_uid = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can delete beers"
    ON beers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM event_memberships em
            WHERE em.event_id = beers.event_id
            AND em.user_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
            AND em.role IN ('admin', 'owner')
        )
    );

-- Event memberships policies
CREATE POLICY "Users can view event memberships"
    ON event_memberships FOR SELECT
    USING (
        user_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
        OR event_id IN (
            SELECT event_id FROM event_memberships
            WHERE user_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
        )
    );

-- Comments policies  
CREATE POLICY "Users can view comments in their events"
    ON comments FOR SELECT
    USING (
        beer_id IN (
            SELECT id FROM beers WHERE event_id IN (
                SELECT event_id FROM event_memberships
                WHERE user_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
            )
        )
    );

CREATE POLICY "Users can add comments"
    ON comments FOR INSERT
    WITH CHECK (
        user_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
    );

CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    USING (user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));
```

---

### Phase 5: Update Service Layer (20 hours)

All service functions need to use auth context:

**File**: Update `app/src/services/users.ts`

```typescript
// Before
export const addUser = async (name: string, isAdmin: boolean = false) => {
    const { data, error } = await supabase
        .from('users')
        .insert({ name, is_admin: isAdmin })
        .select()
        .single();
    // ...
};

// After
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_uid', user.id)
        .single();
    
    return data;
};

export const updateCurrentUser = async (updates: Partial<User>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('auth_uid', user.id)
        .select()
        .single();
    
    return data;
};
```

---

## Testing Strategy

### Testing Checklist

- [ ] OTP sent successfully
- [ ] OTP verification works
- [ ] User created on first login
- [ ] Existing user linked correctly
- [ ] RLS prevents unauthorized access
- [ ] All queries work with auth
- [ ] Session persists across app restarts
- [ ] Logout clears session
- [ ] Re-login works

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | Critical | Backup database, test on staging |
| SMS costs | Medium | Use email OTP option |
| User confusion | Medium | Clear migration communication |
| RLS bugs | High | Extensive testing, staged rollout |

---

## Cost Estimate

**Twilio SMS** (recommended provider):
- $0.0075 per SMS sent
- ~100 users = $0.75 per login event
- Monthly: ~$75 for active users

**Alternative**: Email OTP (free)

---

## Success Criteria

- ✅ All users can authenticate
- ✅ No unauthorized data access
- ✅ Session management works
- ✅ Migration completed successfully
- ✅ < 5% user drop-off during migration
