import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { getBeers } from '@/services/supabase';
import type { Beer as BeerType } from '@/services/types';
import { reportError } from '@/utils/logger';

interface Event {
    id: string;
    name: string;
}

export function useExportData() {
    const handleExportData = async (activeEvent?: Event) => {
        if (!activeEvent) {
            Alert.alert('Export', 'No active round to export.');
            return;
        }
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
            const beers = await getBeers(activeEvent.id);
            const eventBeers = beers.filter((b: BeerType) => b.event_id === activeEvent.id);

            if (eventBeers.length === 0) {
                Alert.alert('Export', 'No beers logged for this event yet.');
                return;
            }

            const header = 'User,Added By,Timestamp\n';
            const rows = eventBeers.map((b: BeerType) =>
                `${b.user?.name || 'Unknown'},${b.added_by_user?.name || 'Unknown'},${b.created_at}`
            ).join('\n');

            const csv = header + rows;
            const filename = `stangelispass_${activeEvent.name.replace(/\s+/g, '_')}.csv`;

            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    Alert.alert('Export', 'CSV downloaded successfully!');
                }
            } else {
                const cacheDirectory = (FileSystem as any).cacheDirectory;
                if (!cacheDirectory) {
                    throw new Error('File system cache directory is unavailable');
                }
                const fileUri = `${cacheDirectory}${filename}`;
                await FileSystem.writeAsStringAsync(fileUri, csv);

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    Alert.alert('Export', 'CSV saved to your device cache.');
                }
            }
        } catch (e) {
            reportError(new Error('Export failed'), {
                scope: 'useExportData',
                action: 'export',
                metadata: { cause: e instanceof Error ? e.message : String(e) },
            });
            Alert.alert('Error', 'Failed to export data.');
        }
    };

    return { handleExportData };
}
