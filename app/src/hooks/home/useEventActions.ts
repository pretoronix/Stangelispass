import { useState } from 'react';
import { Alert } from 'react-native';
import { addUser, joinEvent as joinEventService } from '@/services/supabase';
import type { User } from '@/services/types';
import { reportError } from '@/utils/logger';

type PendingAction = 'start_round' | 'join_event';

export function useEventActions(
    setCurrentUser: (user: User | null) => void,
    startEvent: (name: string, passType: string, beerPrice?: number) => Promise<void>,
    refresh: () => void
) {
    const [showStartRoundPrompt, setShowStartRoundPrompt] = useState(false);
    const [startRoundName, setStartRoundName] = useState('');
    const [beerPrice, setBeerPrice] = useState('5.00');
    const [pendingAction, setPendingAction] = useState<PendingAction>('start_round');
    const [pendingJoinEventName, setPendingJoinEventName] = useState('');
    const [pendingJoinEventId, setPendingJoinEventId] = useState<string | undefined>(undefined);
    const [promptSubmitting, setPromptSubmitting] = useState(false);

    const openNamePrompt = (action: PendingAction, joinEventName?: string, joinEventId?: string) => {
        setPendingAction(action);
        setPendingJoinEventName(joinEventName || '');
        setPendingJoinEventId(joinEventId);
        setStartRoundName('');
        setBeerPrice('5.00');
        setShowStartRoundPrompt(true);
    };

    const submitNamePrompt = async () => {
        const cleanName = startRoundName.trim();
        if (!cleanName || promptSubmitting) return;

        setPromptSubmitting(true);
        try {
            const user = await addUser(cleanName, pendingAction === 'start_round');
            if (!user) {
                Alert.alert('Error', 'Could not create user. Please try again.');
                return;
            }

            setCurrentUser(user);
            if (pendingAction === 'start_round') {
                if (!user.is_admin) {
                    Alert.alert('Admin Required', 'Only an admin can start a round.');
                    return;
                }
                const price = parseFloat(beerPrice) || 5.00;
                if (price <= 0) {
                    Alert.alert('Invalid Price', 'Beer price must be greater than 0.');
                    return;
                }
                await startEvent('Night Out', 'standard', price);
            } else {
                if (pendingJoinEventId) {
                    await joinEventService(pendingJoinEventId, user.id).catch((e) => {
                        reportError(new Error('Failed to join event membership:', e), { scope: 'useEventActions', action: 'replace_console' });
                    });
                }
                Alert.alert('Joined!', `You are now part of ${pendingJoinEventName || 'the round'}.`);
            }

            setShowStartRoundPrompt(false);
            setStartRoundName('');
            setBeerPrice('5.00');
            refresh();
        } catch (e) {
            reportError(new Error('Failed to complete action after creating user:', e), { scope: 'useEventActions', action: 'replace_console' });
            Alert.alert('Error', 'Failed to complete this action. Please try again.');
        } finally {
            setPromptSubmitting(false);
        }
    };

    return {
        showStartRoundPrompt,
        setShowStartRoundPrompt,
        startRoundName,
        setStartRoundName,
        beerPrice,
        setBeerPrice,
        pendingAction,
        pendingJoinEventName,
        promptSubmitting,
        openNamePrompt,
        submitNamePrompt,
    };
}
