const { reportError } = jest.requireActual('@/utils/logger');

describe('logger', () => {
    test('reportError returns normalized payload', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => reportError('boom', { scope: 'test', action: 'unit' })).not.toThrow();
        const payload = reportError('boom', { scope: 'test', action: 'unit' });
        expect(payload).toMatchObject({
            level: 'error',
            scope: 'test',
            action: 'unit',
        });
        expect(payload.metadata).toEqual(expect.objectContaining({ message: 'boom' }));
        errorSpy.mockRestore();
    });
});
