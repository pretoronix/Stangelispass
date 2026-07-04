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
      Text: ({ children }: any) => React.createElement("Text", null, children),
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

  test("calls onPress when pressed", async () => {
    const { Button } = loadButtonForOS("ios");
    const onPress = jest.fn();

    const { getByTestId } = await render(
      <Button title="Test" onPress={onPress} testID="btn" />,
    );
    await fireEvent.press(getByTestId("btn"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("does not trigger haptics on android", async () => {
    const { Button, Haptics } = loadButtonForOS("android");

    const { getByTestId } = await render(
      <Button title="Test" onPress={() => {}} testID="btn" />,
    );
    await fireEvent.press(getByTestId("btn"));

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test("triggers heavy haptics on ios", async () => {
    const { Button, Haptics } = loadButtonForOS("ios");

    const { getByTestId } = await render(
      <Button title="Test" onPress={() => {}} testID="btn" />,
    );
    await fireEvent.press(getByTestId("btn"));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Heavy,
    );
  });
});
