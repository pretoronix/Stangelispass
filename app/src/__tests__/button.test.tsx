import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "Light", Heavy: "Heavy" },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const loadButtonForOS = (os: "ios" | "android") => {
  jest.resetModules();
  jest.doMock("expo-haptics", () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: { Light: "Light", Heavy: "Heavy" },
  }));
  jest.doMock("react-native", () => {
    const React = require("react");
    return {
      Pressable: ({ onPress, children, disabled, ...rest }: any) =>
        React.createElement(
          "pressable",
          { ...rest, onPress: disabled ? undefined : onPress },
          children,
        ),
      Text: ({ children }: any) => React.createElement("text", null, children),
      StyleSheet: { create: (styles: any) => styles },
      Platform: { OS: os },
    };
  });

  let Button: any;
  let Haptics: any;
  jest.isolateModules(() => {
    Button = require("@/components/ui/Button").Button;
    Haptics = require("expo-haptics");
  });
  return { Button, Haptics };
};

describe("Button", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("calls onPress when pressed", () => {
    const { Button } = loadButtonForOS("ios");
    const onPress = jest.fn();

    const { getByTestId } = render(
      <Button title="Test" onPress={onPress} testID="btn" />,
    );
    fireEvent.press(getByTestId("btn"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("does not trigger haptics on android", () => {
    const { Button, Haptics } = loadButtonForOS("android");

    const { getByTestId } = render(
      <Button title="Test" onPress={() => {}} testID="btn" />,
    );
    fireEvent.press(getByTestId("btn"));

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test("triggers heavy haptics on ios", () => {
    const { Button, Haptics } = loadButtonForOS("ios");

    const { getByTestId } = render(
      <Button title="Test" onPress={() => {}} testID="btn" />,
    );
    fireEvent.press(getByTestId("btn"));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Heavy,
    );
  });
});
