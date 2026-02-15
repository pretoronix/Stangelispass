import '@testing-library/jest-native/extend-expect';
import { cleanup } from '@testing-library/react-native';

// Essential React Native mocks for Jest (this file runs after the test framework is installed)
import 'react-native-gesture-handler/jestSetup';

// Mock vector icons to avoid internal state updates in tests.
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialIcons: () => null,
  FontAwesome: () => null,
  AntDesign: () => null,
}));

// Mock react-query async storage persister to avoid timers and open handles.
jest.mock('@tanstack/query-async-storage-persister', () => ({
  createAsyncStoragePersister: () => ({
    persistClient: jest.fn(),
    restoreClient: jest.fn(),
    removeClient: jest.fn(),
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    replace: jest.fn(),
    release: jest.fn(),
  })),
}), { virtual: true });

// Silence logger output in tests while keeping payloads usable for assertions.
jest.mock('@/utils/logger', () => {
  const buildPayload = (level, message, context) => ({
    ts: new Date().toISOString(),
    level,
    message,
    scope: context.scope,
    action: context.action,
    eventId: context.eventId || null,
    userId: context.userId || null,
    metadata: context.metadata || {},
  });

  const emit = (level, message, context) => buildPayload(level, message, context);

  const logInfo = jest.fn((message, context) => emit('info', message, context));
  const logWarn = jest.fn((message, context) => emit('warn', message, context));
  const logError = jest.fn((message, context) => emit('error', message, context));
  const logExpected = jest.fn((message, scope) => `[${scope}] ${message} (expected)`);
  const reportError = jest.fn((error, context = {}) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = err.message || 'error';
    return logError(message, {
      scope: context.scope || 'app',
      action: context.action || 'error',
      eventId: context.eventId || null,
      userId: context.userId || null,
      metadata: {
        message: err.message,
        stack: err.stack,
        ...(context.metadata || {}),
      },
    });
  });

  return {
    logInfo,
    logWarn,
    logError,
    logExpected,
    reportError,
  };
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// FlatList/VirtualizedList can schedule internal timers that trigger "not wrapped in act(...)" warnings
// and keep Jest open. This lightweight mock renders items synchronously.
jest.mock('react-native/Libraries/Lists/VirtualizedList', () => {
  const React = require('react');

  const VirtualizedList = React.forwardRef((props) => {
    const { data, renderItem, children } = props || {};
    // Avoid importing `react-native` here (it can recurse during module init).
    return React.createElement(
      React.Fragment,
      null,
      Array.isArray(data) && typeof renderItem === 'function'
        ? data.map((item, index) => renderItem({ item, index }))
        : null,
      children
    );
  });

  VirtualizedList.displayName = 'VirtualizedList';

  return VirtualizedList;
});

afterEach(() => {
  cleanup();
  if (jest.isMockFunction(globalThis.setTimeout)) {
    jest.clearAllTimers();
  }
});
