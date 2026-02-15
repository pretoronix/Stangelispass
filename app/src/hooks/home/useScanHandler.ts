import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { addBeer, joinEvent, redeemBeerStamp } from '@/services/supabase';
import { parseScanPayload } from '@/utils/scanPayload';
import { BADGES } from '@/services/achievements';
import { audioService } from '@/services/audio';
import { reportError } from '@/utils/logger';

interface User {
    id: string;
}

interface Event {
    id: string;
}

interface EventPermissions {
    canManageLogs: boolean;
}

export function useScanHandler(
    currentUser: User | null,
    activeEvent: Event | null,
    eventPermissions: EventPermissions,
    openNamePrompt: (action: 'start_round' | 'join_event', eventName?: string, eventId?: string) => void,
    setScanning: (value: boolean) => void,
    refresh: () => void
) {
    const handleScan = async (data: string) => {
        try {
            const payload = parseScanPayload(data);
            if (payload.type === 'unknown') {
                Alert.alert('Invalid QR', 'This code is not recognized by Stangelispass.');
                return;
            }

            if (payload.type === 'join_event') {
                if (currentUser) {
                    if (payload.eventId) {
                        await joinEvent(payload.eventId, currentUser.id).catch((e) => {
                            reportError(new Error('Failed to join event membership'), {
                                scope: 'useScanHandler',
                                action: 'join_event',
                                metadata: { cause: e instanceof Error ? e.message : String(e) },
                            });
                        });
                    }
                    Alert.alert('Joined!', `You are now part of ${payload.eventName || 'the round'}.`);
                    setScanning(false);
                    return;
                }

                openNamePrompt('join_event', payload.eventName || 'the round', payload.eventId);
                setScanning(false);
                return;
            }

            if (payload.type === 'stamp_redeem') {
                if (!currentUser) {
                    Alert.alert('Select User', 'Please select a user in Settings before redeeming stamps.');
                    return;
                }
                const redemption = await redeemBeerStamp(payload.stampId, currentUser.id);
                if (!redemption.ok) {
                    const reasonMessage = {
                        invalid_stamp: 'This stamp is invalid.',
                        already_redeemed: 'This stamp has already been redeemed.',
                        expired_stamp: 'This stamp has expired.',
                        stamps_unavailable: 'Stamp feature is not available in the database yet.',
                    } as Record<string, string>;
                    Alert.alert('Stamp', reasonMessage[redemption.reason] || 'Could not redeem stamp.');
                    setScanning(false);
                    return;
                }

                audioService.playPsst();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

                // ✅ CRASH PREVENTION: Ensure newBadges is always an array
                const badges = redemption.newBadges || [];
                if (badges.length > 0) {
                    const badgeNames = badges.map(b => BADGES[b]?.name || 'Unknown').filter(Boolean).join(', ');
                    Alert.alert('Stamp Redeemed', `+1 beer added.\nNew badges: ${badgeNames}`);
                } else {
                    Alert.alert('Stamp Redeemed', '+1 beer added successfully.');
                }
                setScanning(false);

                // ✅ CRASH PREVENTION: Wrap refresh in try-catch
                try {
                    refresh();
                } catch (refreshError) {
                    reportError(new Error('Failed to refresh after stamp redeem'), {
                        scope: 'useScanHandler',
                        action: 'post_stamp_refresh',
                        metadata: { cause: refreshError instanceof Error ? refreshError.message : String(refreshError) },
                    });
                }
                return;
            }

            if (!currentUser) {
                Alert.alert('Select User', 'Please select a user in Settings before scanning beer QR codes.');
                return;
            }
            const effectiveEventId = payload.eventId || activeEvent?.id;
            if (!effectiveEventId) {
                Alert.alert('No Active Round', 'This QR code is not linked to an active round.');
                return;
            }
            if (activeEvent?.id && payload.eventId && payload.eventId !== activeEvent.id) {
                Alert.alert('Wrong Round', 'This QR code belongs to a different event.');
                return;
            }
            if (!eventPermissions.canManageLogs && payload.userId !== currentUser.id) {
                Alert.alert('Not Authorized', 'Only admins can log beers for other users.');
                return;
            }

            const result = await addBeer(payload.userId, currentUser.id, effectiveEventId);

            // ✅ CRASH PREVENTION: Ensure newBadges is always an array
            const newBadges = result?.newBadges || [];

            // Audio & Haptic feedback
            audioService.playPsst();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

            if (newBadges.length > 0) {
                const badgeNames = newBadges.map(b => BADGES[b]?.name || 'Unknown').filter(Boolean).join(', ');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
                Alert.alert(
                    '🏆 Achievement Unlocked!',
                    `You earned: ${badgeNames}\n\nBeer logged via scan!`,
                    [{ text: 'Woohoo!' }]
                );
            }

            setScanning(false);

            // ✅ CRASH PREVENTION: Wrap refresh in try-catch
            try {
                refresh();
            } catch (refreshError) {
                reportError(new Error('Failed to refresh after beer log'), {
                    scope: 'useScanHandler',
                    action: 'post_beer_refresh',
                    metadata: { cause: refreshError instanceof Error ? refreshError.message : String(refreshError) },
                });
            }
        } catch (e) {
            reportError(new Error('Failed to add beer via scan'), {
                scope: 'useScanHandler',
                action: 'scan_add_beer',
                metadata: { cause: e instanceof Error ? e.message : String(e) },
            });
            Alert.alert('Error', 'Failed to log beer. Please try again.');
        }
    };

    return { handleScan };
}
