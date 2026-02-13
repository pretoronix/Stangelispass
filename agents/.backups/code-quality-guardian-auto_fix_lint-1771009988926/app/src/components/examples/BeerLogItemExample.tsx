import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OptimisticItem } from '@/components/ui/OptimisticItem';

/**
 * Example component showing how to use OptimisticItem with beer logs
 * This demonstrates the integration pattern for optimistic updates
 */

interface BeerLogItemProps {
    beer: {
        id: string;
        user_id: string;
        created_at: string;
        user?: {
            name?: string;
        } | null;
    };
}

export function BeerLogItemExample({ beer }: BeerLogItemProps) {
    // Detect optimistic items by temporary ID
    const isOptimistic = beer.id.startsWith('temp-');
    
    return (
        <OptimisticItem isOptimistic={isOptimistic} style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.userName}>
                    {beer.user?.name || 'Unknown User'}
                </Text>
                <Text style={styles.timestamp}>
                    {new Date(beer.created_at).toLocaleTimeString()}
                </Text>
                
                {/* Show pending indicator for optimistic items */}
                {isOptimistic && (
                    <Text style={styles.pending}>⏳ Saving...</Text>
                )}
            </View>
        </OptimisticItem>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
        marginVertical: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
    },
    pending: {
        fontSize: 12,
        color: '#4CAF50',
        fontStyle: 'italic',
        marginLeft: 8,
    },
});
