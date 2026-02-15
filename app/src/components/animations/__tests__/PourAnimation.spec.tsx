import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PourAnimation } from '@/components/animations/PourAnimation';
import { SimplePourFeedback } from '@/components/animations/SimplePourFeedback';
import * as Haptics from 'expo-haptics';

// Mock dependencies
jest.mock('lottie-react-native', () => {
    const React = require('react');
    const MockLottieView = React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            play: jest.fn(),
            reset: jest.fn(),
        }));
        return null; // LottieView doesn't render in tests
    });
    MockLottieView.displayName = 'LottieView';
    return MockLottieView;
});

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    notificationAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
    NotificationFeedbackType: {
        Success: 'success',
        Warning: 'warning',
        Error: 'error',
    },
}));

jest.mock('expo-blur', () => ({
    BlurView: 'BlurView',
}));

jest.mock('@/utils/deviceInfo', () => ({
    hasNativeHaptics: jest.fn(() => Promise.resolve(true)),
    isSimulator: jest.fn(() => false),
}));

describe('PourAnimation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('does not render when not visible', () => {
        const onComplete = jest.fn();
        const { queryByTestId } = render(
            <PourAnimation visible={false} onComplete={onComplete} />
        );
        
        expect(queryByTestId('pour-animation')).toBeNull();
    });

    it('triggers haptic feedback when visible', () => {
        const onComplete = jest.fn();
        render(<PourAnimation visible={true} onComplete={onComplete} />);
        
        // Fast-forward to first haptic
        jest.advanceTimersByTime(50);
        
        // Should trigger initial light haptics
        expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it('calls onComplete after animation duration', async () => {
        const onComplete = jest.fn();
        render(<PourAnimation visible={true} onComplete={onComplete} />);
        
        // Animation should complete after ~2800ms
        jest.advanceTimersByTime(3000);
        
        await waitFor(() => {
            expect(onComplete).toHaveBeenCalled();
        });
    });

    it('triggers success haptic at the end', () => {
        const onComplete = jest.fn();
        render(<PourAnimation visible={true} onComplete={onComplete} />);
        
        // Fast-forward to success haptic (2500ms)
        jest.advanceTimersByTime(2500);
        
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
            Haptics.NotificationFeedbackType.Success
        );
    });

    it('cleans up timers on unmount', () => {
        const onComplete = jest.fn();
        const { unmount } = render(
            <PourAnimation visible={true} onComplete={onComplete} />
        );
        
        unmount();
        
        // Advance timers - onComplete should not be called
        jest.advanceTimersByTime(3000);
        expect(onComplete).not.toHaveBeenCalled();
    });
});

describe('SimplePourFeedback', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('does not render when not visible', () => {
        const onComplete = jest.fn();
        const { queryByText } = render(
            <SimplePourFeedback visible={false} onComplete={onComplete} />
        );
        
        expect(queryByText(/Beer Logged!/i)).toBeNull();
    });

    it('triggers success haptic when visible', async () => {
        const onComplete = jest.fn();
        render(<SimplePourFeedback visible={true} onComplete={onComplete} />);

        await waitFor(() => {
            expect(Haptics.notificationAsync).toHaveBeenCalledWith(
                Haptics.NotificationFeedbackType.Success
            );
        });
    });

    it('calls onComplete after short duration', () => {
        const onComplete = jest.fn();
        render(<SimplePourFeedback visible={true} onComplete={onComplete} />);
        
        // Simple feedback: 1200ms delay + 300ms fade = 1500ms total
        jest.advanceTimersByTime(1600);
        
        expect(onComplete).toHaveBeenCalled();
    });

    it('renders beer emoji and message when visible', () => {
        const onComplete = jest.fn();
        const { getByText } = render(
            <SimplePourFeedback visible={true} onComplete={onComplete} />
        );
        
        expect(getByText('Beer Logged!')).toBeTruthy();
    });
});
