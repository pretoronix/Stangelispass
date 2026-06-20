import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useOptimisticError } from "@/hooks/useOptimisticError";

describe("useOptimisticError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(Date, "now").mockReturnValue(123);
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore?.();
    (Date.now as unknown as jest.Mock).mockRestore?.();
  });

  it("adds error and shows alert without retry", () => {
    const { result } = renderHook(() => useOptimisticError());

    act(() => {
      result.current.addError("Boom");
    });

    expect(result.current.errors).toEqual([{ message: "Boom", timestamp: 123 }]);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Update Failed",
      expect.stringContaining("Boom"),
      expect.any(Array),
    );
  });

  it("prepends retry button when provided", () => {
    const { result } = renderHook(() => useOptimisticError());
    const retry = jest.fn();

    act(() => {
      result.current.addError("Boom", { retry });
    });

    const buttons = (Alert.alert as jest.Mock).mock.calls[0]?.[2];
    expect(buttons[0]).toMatchObject({ text: "Retry" });
    expect(buttons[1]).toMatchObject({ text: "OK" });
    buttons[0].onPress();
    expect(retry).toHaveBeenCalled();
  });

  it("clears errors", () => {
    const { result } = renderHook(() => useOptimisticError());

    act(() => {
      result.current.addError("Boom");
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual([]);
  });
});

