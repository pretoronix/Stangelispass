import { renderHook } from "@testing-library/react-native";
import {
  useEventPermissions,
  useHasEventAdminRights,
} from "@/hooks/useEventPermissions";

const mockUseEventMembership = jest.fn();

jest.mock("@/hooks/useEventsQuery", () => ({
  useEventMembership: (...args: any[]) => mockUseEventMembership(...args),
}));

describe("useEventPermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns default permissions when eventId or userId missing", () => {
    mockUseEventMembership.mockReturnValue({ data: null, isLoading: false });

    const { result } = renderHook(() => useEventPermissions(null, "u1", false));
    expect(result.current.role).toBeNull();
    expect(result.current.missingTable).toBe(false);
    expect(result.current.permissions.canManageEvent).toBe(false);

    const { result: result2 } = renderHook(() =>
      useEventPermissions("e1", undefined, true),
    );
    expect(result2.current.permissions.canManageEvent).toBe(true);
  });

  it("computes permissions from membership role", () => {
    mockUseEventMembership.mockReturnValue({
      data: { membership: { role: "admin" }, missingTable: false },
      isLoading: false,
    });

    const { result } = renderHook(() => useEventPermissions("e1", "u1", false));
    expect(result.current.role).toBe("admin");
    expect(result.current.permissions.canManageEvent).toBe(true);
  });

  it("handles missing membership table by using role+global admin fallback", () => {
    mockUseEventMembership.mockReturnValue({
      data: { membership: { role: null }, missingTable: true },
      isLoading: false,
    });

    const { result } = renderHook(() => useEventPermissions("e1", "u1", true));
    expect(result.current.missingTable).toBe(true);
    expect(result.current.permissions.canManageLogs).toBe(true);
  });
});

describe("useHasEventAdminRights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when permissions include admin rights", () => {
    mockUseEventMembership.mockReturnValue({
      data: { membership: { role: "member" }, missingTable: false },
      isLoading: false,
    });
    const { result } = renderHook(() =>
      useHasEventAdminRights("e1", "u1", true),
    );
    expect(result.current).toBe(true);
  });

  it("returns false when not admin and no event role privileges", () => {
    mockUseEventMembership.mockReturnValue({
      data: { membership: { role: "member" }, missingTable: false },
      isLoading: false,
    });
    const { result } = renderHook(() =>
      useHasEventAdminRights("e1", "u1", false),
    );
    expect(result.current).toBe(false);
  });
});
