import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { BroadcastModal } from '../BroadcastModal';
import { useSendBroadcast } from '@/hooks/useNotificationsQuery';

// Mock dependencies
jest.mock('@/hooks/useNotificationsQuery');
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
}));

const mockMutate = jest.fn();
const mockUseSendBroadcast = useSendBroadcast as jest.MockedFunction<typeof useSendBroadcast>;

describe('BroadcastModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSendBroadcast.mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as any);
        jest.spyOn(Alert, 'alert');
    });

    it('renders correctly when visible', () => {
        const { getByText, getByPlaceholderText } = render(
            <BroadcastModal
                visible={true}
                eventId="event-123"
                onClose={jest.fn()}
            />
        );

        expect(getByText('Send Broadcast')).toBeTruthy();
        expect(getByPlaceholderText('Type your message...')).toBeTruthy();
        expect(getByText('0 / 100')).toBeTruthy();
    });

    it('updates character counter as user types', () => {
        const { getByPlaceholderText, getByText } = render(
            <BroadcastModal
                visible={true}
                eventId="event-123"
                onClose={jest.fn()}
            />
        );

        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Hello everyone!');

        expect(getByText('15 / 100')).toBeTruthy();
    });

    it('disables send button when message is empty', () => {
        const { getByText } = render(
            <BroadcastModal
                visible={true}
                eventId="event-123"
                onClose={jest.fn()}
            />
        );

        const sendButton = getByText('Send');
        expect(sendButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('enables send button when message is valid', () => {
        const { getByPlaceholderText, getByText } = render(
            <BroadcastModal
                visible={true}
                eventId="event-123"
                onClose={jest.fn()}
            />
        );

        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, 'Valid message');

        const sendButton = getByText('Send');
        expect(sendButton.props.accessibilityState?.disabled).toBe(false);
    });
});
