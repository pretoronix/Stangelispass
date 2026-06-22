import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAddUser, useUpdateUser, useUsers } from "@/hooks/useUsersQuery";

jest.mock("@/services/users", () => ({
  getUsers: jest.fn(),
  addUser: jest.fn(),
  updateUser: jest.fn(),
}));

const createClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("useUsersQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("useUsers fetches users", async () => {
    const { getUsers } = require("@/services/users");
    getUsers.mockResolvedValueOnce([{ id: "u1", name: "Alice" }]);

    const client = createClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "u1", name: "Alice" }]);
    expect(getUsers).toHaveBeenCalled();
    client.cancelQueries(); client.clear();
  });

  it("useAddUser invalidates users list", async () => {
    const { addUser } = require("@/services/users");
    addUser.mockResolvedValueOnce({ id: "u2", name: "Bob" });

    const client = createClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    client.setQueryData(["users"], [{ id: "u1", name: "Alice" }]);

    const { result } = renderHook(() => useAddUser(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ name: "Bob", isAdmin: false });
    });

    expect(addUser).toHaveBeenCalledWith("Bob", false);
    expect(client.getQueryState(["users"])?.isInvalidated).toBe(true);
    client.cancelQueries(); client.clear();
  });

  it("useUpdateUser invalidates users list and specific user", async () => {
    const { updateUser } = require("@/services/users");
    updateUser.mockResolvedValueOnce({ id: "u1", name: "Alice2" });

    const client = createClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    client.setQueryData(["users"], [{ id: "u1", name: "Alice" }]);
    client.setQueryData(["users", "u1"], { id: "u1", name: "Alice" });

    const { result } = renderHook(() => useUpdateUser(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        userId: "u1",
        updates: { name: "Alice2" },
      });
    });

    expect(updateUser).toHaveBeenCalledWith("u1", { name: "Alice2" });
    expect(client.getQueryState(["users"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["users", "u1"])?.isInvalidated).toBe(true);
    client.cancelQueries(); client.clear();
  });
});
