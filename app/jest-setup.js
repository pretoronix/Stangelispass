import '@testing-library/jest-native/extend-expect';

// Essential React Native mocks for Jest (this file runs after the test framework is installed)
import 'react-native-gesture-handler/jestSetup';

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
