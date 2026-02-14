import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { User } from '@/services/supabase';
import {
    createLifetimePassCode,
    listLifetimePassCodes,
    redeemLifetimePassCode,
    type LifetimePassCode,
} from '@/services/lifetimePass';
import { reportError } from '@/utils/logger';

interface UseLifetimePassesProps {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    refreshUsers: () => Promise<void>;
}

export const useLifetimePasses = ({ currentUser, setCurrentUser, refreshUsers }: UseLifetimePassesProps) => {
    const [codes, setCodes] = useState<LifetimePassCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [redeeming, setRedeeming] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');

    const refreshCodes = useCallback(async () => {
        if (!currentUser?.is_admin) return;
        setLoading(true);
        try {
            const list = await listLifetimePassCodes();
            setCodes(list);
        } catch (e) {
            reportError(e as Error, { scope: 'lifetime_pass', action: 'list_codes' });
        } finally {
            setLoading(false);
        }
    }, [currentUser?.is_admin]);

    useEffect(() => {
        refreshCodes();
    }, [refreshCodes]);

    const handleGenerateCode = useCallback(async () => {
        if (!currentUser?.is_admin) {
            Alert.alert('Not Authorized', 'Only app owners can generate lifetime pass codes.');
            return;
        }
        setGenerating(true);
        try {
            const created = await createLifetimePassCode(currentUser.id);
            if (!created) {
                Alert.alert('Unavailable', 'Lifetime pass codes are not available until the database is ready.');
                return;
            }
            setCodes((prev) => [created, ...prev]);
            Alert.alert('Code Generated', `Share this code: ${created.code}`);
        } catch (e) {
            Alert.alert('Error', 'Failed to generate code.');
            reportError(e as Error, { scope: 'lifetime_pass', action: 'generate_code' });
        } finally {
            setGenerating(false);
        }
    }, [currentUser]);

    const handleRedeemCode = useCallback(async () => {
        if (!currentUser) {
            Alert.alert('Select User', 'Please select a user before redeeming a code.');
            return;
        }
        const trimmed = redeemCode.trim();
        if (!trimmed) {
            Alert.alert('Enter Code', 'Please enter a lifetime pass code.');
            return;
        }
        setRedeeming(true);
        try {
            const result = await redeemLifetimePassCode(trimmed, currentUser.id);
            if (!result.ok) {
                const message = result.reason === 'already_redeemed'
                    ? 'This code has already been redeemed.'
                    : result.reason === 'expired'
                        ? 'This code has expired.'
                        : result.reason === 'codes_unavailable'
                            ? 'Lifetime pass codes are not available yet.'
                            : 'Invalid code. Please check and try again.';
                Alert.alert('Redeem Failed', message);
                return;
            }
            if (result.user) {
                setCurrentUser(result.user);
            }
            await refreshUsers();
            setRedeemCode('');
            Alert.alert('Success', 'Lifetime pass activated. Enjoy!');
        } catch (e) {
            Alert.alert('Error', 'Failed to redeem code.');
            reportError(e as Error, { scope: 'lifetime_pass', action: 'redeem_code' });
        } finally {
            setRedeeming(false);
        }
    }, [currentUser, redeemCode, refreshUsers, setCurrentUser]);

    return {
        codes,
        loading,
        generating,
        redeeming,
        redeemCode,
        setRedeemCode,
        refreshCodes,
        handleGenerateCode,
        handleRedeemCode,
    };
};
