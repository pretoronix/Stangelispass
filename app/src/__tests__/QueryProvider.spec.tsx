import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { QueryProvider } from "@/providers/QueryProvider";
import { Text } from "react-native";
import { reportError } from "@/utils/logger";

let capturedPersistOptions: any = null;

jest.mock("@tanstack/react-query-persist-client", () => ({
  PersistQueryClientProvider: ({ children, persistOptions }: any) => {
    capturedPersistOptions = persistOptions;
    return children;
  },
}));

jest.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => null,
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock Expo Constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: "1.0.0",
    },
  },
}));

describe("QueryProvider", () => {
  const CURRENT_KEY = "STANGELISPASS_QUERY_CACHE_1.0.0_v1";

  beforeEach(() => {
    capturedPersistOptions = null;
    jest.clearAllMocks();
  });

  it("should render children", async () => {
    const { getByText } = render(
      <QueryProvider>
        <Text>Test Child</Text>
      </QueryProvider>,
    );
    await act(async () => {});
    await waitFor(() => {
      expect(getByText("Test Child")).toBeTruthy();
    });
  });

  it("should provide query client context", async () => {
    // Simply verify it renders without crashing
    const result = render(
      <QueryProvider>
        <Text>Query Provider Test</Text>
      </QueryProvider>,
    );

    await act(async () => {});
    await waitFor(() => {
      expect(result.getByText("Query Provider Test")).toBeTruthy();
    });
  });

  it("clears old cache versions on mount", async () => {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default ||
      require("@react-native-async-storage/async-storage");
    AsyncStorage.getAllKeys.mockResolvedValueOnce([
      CURRENT_KEY,
      "STANGELISPASS_QUERY_CACHE_0.9.0_v1",
    ]);

    render(
      <QueryProvider>
        <Text>Cache</Text>
      </QueryProvider>,
    );

    await waitFor(() => {
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        "STANGELISPASS_QUERY_CACHE_0.9.0_v1",
      ]);
    });
  });

  it("does not clear cache when no old keys exist", async () => {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default ||
      require("@react-native-async-storage/async-storage");
    AsyncStorage.getAllKeys.mockResolvedValueOnce([CURRENT_KEY]);

    render(
      <QueryProvider>
        <Text>Noop</Text>
      </QueryProvider>,
    );

    await act(async () => {});
    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
  });

  it("reports errors when clearing old cache fails", async () => {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default ||
      require("@react-native-async-storage/async-storage");
    AsyncStorage.getAllKeys.mockRejectedValueOnce("fail");

    render(
      <QueryProvider>
        <Text>Err</Text>
      </QueryProvider>,
    );

    await waitFor(() => {
      expect(reportError).toHaveBeenCalled();
    });
  });

  it("configures shouldDehydrateQuery to skip sensitive keys and require success", async () => {
    render(
      <QueryProvider>
        <Text>Persist</Text>
      </QueryProvider>,
    );

    expect(capturedPersistOptions).toBeTruthy();
    const shouldDehydrateQuery =
      capturedPersistOptions.dehydrateOptions?.shouldDehydrateQuery;
    expect(typeof shouldDehydrateQuery).toBe("function");

    expect(
      shouldDehydrateQuery({
        queryKey: ["device-token"],
        state: { status: "success" },
      }),
    ).toBe(false);
    expect(
      shouldDehydrateQuery({ queryKey: ["foo"], state: { status: "loading" } }),
    ).toBe(false);
    expect(
      shouldDehydrateQuery({ queryKey: ["foo"], state: { status: "success" } }),
    ).toBe(true);
  });
});
