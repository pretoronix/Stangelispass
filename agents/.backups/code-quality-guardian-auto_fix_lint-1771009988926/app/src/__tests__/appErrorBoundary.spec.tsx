import React from 'react';
import { render } from '@testing-library/react-native';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { reportError } from '@/utils/logger';

jest.mock('@/utils/logger', () => ({
    reportError: jest.fn(),
}));

describe('AppErrorBoundary', () => {
    test('renders fallback UI when a child throws', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const Crash = () => {
            throw new Error('boom');
        };

        const { getByText } = render(
            <AppErrorBoundary>
                <Crash />
            </AppErrorBoundary>
        );

        expect(getByText('Something went wrong')).toBeTruthy();
        expect(getByText('boom')).toBeTruthy();
        expect(reportError).toHaveBeenCalledTimes(1);
        expect(reportError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                metadata: expect.objectContaining({
                    componentStack: expect.any(String),
                }),
            })
        );
        errorSpy.mockRestore();
    });
});
