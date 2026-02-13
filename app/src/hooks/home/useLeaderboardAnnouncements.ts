import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { getStreakBonus, isStreakMilestone } from '@/utils/gameStats';

interface BeerCount {
    userId: string;
    name: string;
    streakCount?: number;
}

interface LeaderInfo {
    userId: string;
    name: string;
    count: number;
}

interface UseLeaderboardAnnouncementsProps {
    activeEventId?: string;
    leaderInfo?: LeaderInfo;
    beerCounts: BeerCount[];
    currentUserId?: string;
}

export function useLeaderboardAnnouncements({
    activeEventId,
    leaderInfo,
    beerCounts,
    currentUserId,
}: UseLeaderboardAnnouncementsProps) {
    const [leaderAnnouncement, setLeaderAnnouncement] = useState<string | null>(null);
    const [streakAnnouncement, setStreakAnnouncement] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const leaderRef = useRef<string | null>(null);
    const streakRef = useRef<number>(0);

    // Detect leader changes
    useEffect(() => {
        if (!activeEventId || !leaderInfo?.userId) return;
        if (leaderRef.current && leaderRef.current !== leaderInfo.userId) {
            setLeaderAnnouncement(`${leaderInfo.name} took the lead!`);
            setShowConfetti(true); // 🎉 Trigger confetti on leader change
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
        }
        leaderRef.current = leaderInfo.userId;
    }, [activeEventId, leaderInfo?.userId, leaderInfo?.name]);

    // Auto-clear leader announcement
    useEffect(() => {
        if (!leaderAnnouncement) return;
        const timer = setTimeout(() => setLeaderAnnouncement(null), 3000);
        return () => clearTimeout(timer);
    }, [leaderAnnouncement]);

    // Detect streak milestones
    useEffect(() => {
        if (!currentUserId) return;
        const currentStats = beerCounts.find((u) => u.userId === currentUserId);
        const nextStreak = currentStats?.streakCount || 0;
        if (nextStreak > (streakRef.current || 0) && isStreakMilestone(nextStreak)) {
            const bonus = getStreakBonus(nextStreak);
            setStreakAnnouncement(`Streak x${nextStreak}! +${bonus} pts`);
            setShowConfetti(true); // 🎉 Trigger confetti on streak milestone
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
        }
        streakRef.current = nextStreak;
    }, [beerCounts, currentUserId]);

    // Auto-clear streak announcement
    useEffect(() => {
        if (!streakAnnouncement) return;
        const timer = setTimeout(() => setStreakAnnouncement(null), 3000);
        return () => clearTimeout(timer);
    }, [streakAnnouncement]);

    return {
        leaderAnnouncement,
        streakAnnouncement,
        showConfetti,
        setShowConfetti,
        setLeaderAnnouncement,
        setStreakAnnouncement,
    };
}
