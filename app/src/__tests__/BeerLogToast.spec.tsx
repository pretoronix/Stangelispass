import React from "react";
import { render } from "@testing-library/react-native";
import { BeerLogToast } from "@/components/ui/BeerLogToast";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("BeerLogToast", () => {
  it("renders message and subtitle when visible", () => {
    const { getByText } = render(
      <BeerLogToast visible={true} message="Beer logged!" subtitle="Cheers" />,
    );

    expect(getByText("Beer logged!")).toBeTruthy();
    expect(getByText("Cheers")).toBeTruthy();
  });

  it("renders nothing when not visible", () => {
    const { queryByText } = render(
      <BeerLogToast visible={false} message="Beer logged!" />,
    );

    expect(queryByText("Beer logged!")).toBeNull();
  });
});
