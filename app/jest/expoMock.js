// Minimal mock for `expo` to satisfy Jest imports during unit tests.
// Extend as needed for additional expo APIs used in tests.

module.exports = {
  // Stub any top-level properties that tests might access.
  registerRootComponent: () => {},
  // Provide a no-op installGlobal to avoid runtime errors.
  __ExpoInstallGlobal: {
    get __ExpoImportMetaRegistry() {
      return {};
    },
  },
};
