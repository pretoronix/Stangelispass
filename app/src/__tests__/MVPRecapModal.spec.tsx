import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import {
  MVPRecapModal,
  MVPRecapData,
} from "@/components/features/MVPRecapModal";
import * as Haptics from "expo-haptics";
import { copy } from "@/ui/copy";

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: {
    Success: "success",
  },
  ImpactFeedbackStyle: {
    Medium: "medium",
  },
}));
jest.mock("expo-blur", () => ({
  BlurView: ({ children }: any) => children,
}));
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children,
}));

describe("MVPRecapModal", () => {
  const mockEventData: MVPRecapData = {
    eventName: "Friday Night",
    winner: {
      id: "user1",
      name: "John Doe",
      beerCount: 10,
    },
    participants: [
      { id: "user1", name: "John Doe", beerCount: 10 },
      { id: "user2", name: "Jane Smith", beerCount: 8 },
      { id: "user3", name: "Bob Johnson", beerCount: 6 },
    ],
    endedAt: new Date("2024-02-11"),
  };

  const mockOnClose = jest.fn();
  const mockOnShare = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when not visible", async () => {
    const { queryByText } = await render(
      <MVPRecapModal
        visible={false}
        onClose={mockOnClose}
        eventData={mockEventData}
        onShare={mockOnShare}
      />,
    );

    expect(queryByText("Brewmaster of the Night")).toBeNull();
  });

  it("should render when visible", async () => {
    const { getByText, getAllByText } = await render(
      <MVPRecapModal
        visible={true}
        onClose={mockOnClose}
        eventData={mockEventData}
        onShare={mockOnShare}
      />,
    );

    expect(getByText(/Brewmaster of the Night/)).toBeTruthy();
    expect(getAllByText("John Doe").length).toBeGreaterThan(0);
    expect(getByText("10 beers")).toBeTruthy();
    expect(getByText("Friday Night")).toBeTruthy();
  });

  it("should trigger haptic feedback when shown", async () => {
    await render(
      <MVPRecapModal
        visible={true}
        onClose={mockOnClose}
        eventData={mockEventData}
        onShare={mockOnShare}
      />,
    );

    await act(async () => {});
    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success,
      );
    });
  });

  it("should display top participants", async () => {
    const { getAllByText, getByText } = await render(
      <MVPRecapModal
        visible={true}
        onClose={mockOnClose}
        eventData={mockEventData}
        onShare={mockOnShare}
      />,
    );

    expect(getAllByText("John Doe").length).toBeGreaterThan(0);
    expect(getByText("Jane Smith")).toBeTruthy();
    expect(getByText("Bob Johnson")).toBeTruthy();
  });

  it("should call onShare when share button is pressed", async () => {
    const { getByText } = await render(
      <MVPRecapModal
        visible={true}
        onClose={mockOnClose}
        eventData={mockEventData}
        onShare={mockOnShare}
      />,
    );

    const shareButton = getByText(copy.common.share);
    await act(async () => {
      await fireEvent.press(shareButton);
    });

    expect(mockOnShare).toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it("should call onClose when close button is pressed", async () => {
    const { getByText } = await render(
      <MVPRecapModal
        visible={true}
        onClose={mockOnClose}
        eventData={mockEventData}
        onShare={mockOnShare}
      />,
    );

    const closeButton = getByText(copy.common.close);
    await act(async () => {
      await fireEvent.press(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });

  it("should display formatted date", async () => {
    const { getByText } = await render(
      <MVPRecapModal
        visible={true}
        onClose={mockOnClose}
        eventData={mockEventData}
        onShare={mockOnShare}
      />,
    );

    // Date formatting may vary by locale, so just check it exists
    const dateText = getByText(/2\/11\/2024|11\/2\/2024|2024/);
    expect(dateText).toBeTruthy();
  });

  it("should limit participants to top 5", async () => {
    const manyParticipants = Array.from({ length: 10 }, (_, i) => ({
      id: `user${i}`,
      name: `User ${i}`,
      beerCount: 10 - i,
    }));

    const { queryByText } = await render(
      <MVPRecapModal
        visible={true}
        onClose={mockOnClose}
        eventData={{
          ...mockEventData,
          participants: manyParticipants,
        }}
        onShare={mockOnShare}
      />,
    );

    // First 5 should be visible
    expect(queryByText("User 0")).toBeTruthy();
    expect(queryByText("User 4")).toBeTruthy();

    // 6th and beyond should not be visible
    expect(queryByText("User 5")).toBeNull();
    expect(queryByText("User 9")).toBeNull();
  });
});
