import React from "react";
import { render } from "@testing-library/react-native";
import { AddBeerModals } from "@/components/add/AddBeerModals";

// Mock sub-components
jest.mock("@/components/add/AddQrModal", () => ({
  AddQrModal: jest.fn(() => null),
}));
jest.mock("@/components/animations/PourAnimation", () => ({
  PourAnimation: jest.fn(() => null),
}));
jest.mock("@/components/animations/SimplePourFeedback", () => ({
  SimplePourFeedback: jest.fn(() => null),
}));

describe("AddBeerModals", () => {
  const defaultProps = {
    showQR: false,
    closeQrModal: jest.fn(),
    selectedUser: { id: "u1", name: "User 1" },
    activeEvent: { id: "e1", name: "Event 1" },
    stampId: undefined,
    qrMode: "log" as const,
    handleShareQr: jest.fn(),
    shareLoading: false,
    qrRef: { current: null },
    qrViewRef: { current: null },
    useFullAnimation: true,
    showAnimation: false,
    handleAnimationComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders AddQrModal with correct props", () => {
    const { AddQrModal } = require("@/components/add/AddQrModal");
    render(<AddBeerModals {...defaultProps} showQR={true} />);
    expect(AddQrModal.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        visible: true,
        selectedUser: defaultProps.selectedUser,
        eventName: "Event 1",
        eventId: "e1",
        mode: "log",
      }),
    );
  });

  it("renders PourAnimation when useFullAnimation is true", () => {
    const { PourAnimation } = require("@/components/animations/PourAnimation");
    render(
      <AddBeerModals
        {...defaultProps}
        showAnimation={true}
        useFullAnimation={true}
      />,
    );
    expect(PourAnimation.mock.calls[0][0]).toEqual(
      expect.objectContaining({ visible: true }),
    );
  });

  it("renders SimplePourFeedback when useFullAnimation is false", () => {
    const {
      SimplePourFeedback,
    } = require("@/components/animations/SimplePourFeedback");
    render(
      <AddBeerModals
        {...defaultProps}
        showAnimation={true}
        useFullAnimation={false}
      />,
    );
    expect(SimplePourFeedback.mock.calls[0][0]).toEqual(
      expect.objectContaining({ visible: true }),
    );
  });

  it("does not trigger animations when showAnimation is false", () => {
    const { PourAnimation } = require("@/components/animations/PourAnimation");
    const {
      SimplePourFeedback,
    } = require("@/components/animations/SimplePourFeedback");

    render(<AddBeerModals {...defaultProps} showAnimation={false} />);

    expect(PourAnimation.mock.calls[0][0]).toEqual(
      expect.objectContaining({ visible: false }),
    );
    expect(SimplePourFeedback).not.toHaveBeenCalled();
  });
});
