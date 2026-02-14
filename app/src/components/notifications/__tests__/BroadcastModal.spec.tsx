import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
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
        const { getByPlaceholderText, getByTestId } = render(
            <BroadcastModal
                visible={true}
                eventId="event-123"
                senderId="user-123"
                eventName="Test Event"
                onClose={jest.fn()}
            />
        );

        expect(getByPlaceholderText('Type your message...')).toBeTruthy();
        expect(getByTestId('broadcast-send-button')).toBeTruthy();
        expect(getByTestId('broadcast-cancel-button')).toBeTruthy();
    });

    it('updates character counter as user types', async () => {
        const { getByPlaceholderText, getByText } = render(
            <BroadcastModal
                visible={true}
                eventId="event-123"
                senderId="user-123"
                eventName="Test Event"
                onClose={jest.fn()}
            />
        );

        const input = getByPlaceholderText('Type your message...');
        await act(async () => {
            fireEvent.changeText(input, 'Hello everyone!');
        });

        // Check for "X characters left" instead of "X / 100"
        expect(getByText('85 characters left')).toBeTruthy();
    });

    it('disables send button when message is empty', () => {
        const { getByTestId } = render(
            <BroadcastModal
                visible={true}
                eventId="event-123"
                senderId="user-123"
                eventName="Test Event"
                onClose={jest.fn()}
            />
        );

        const sendButton = getByTestId('broadcast-send-button');
        expect(sendButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('enables send button when message is valid', async () => {
        const { getByPlaceholderText, getByTestId } = render(
            <BroadcastModal
                visible={true}
                eventId="event-123"
                senderId="user-123"
                eventName="Test Event"
                onClose={jest.fn()}
            />
        );

        const input = getByPlaceholderText('Type your message...');
        await act(async () => {
            fireEvent.changeText(input, 'Valid message');
        });

        const sendButton = getByTestId('broadcast-send-button');
        expect(sendButton.props.accessibilityState?.disabled).toBe(false);
    });
});
