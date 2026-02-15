import React from "react";
import { render } from "@testing-library/react-native";
import { PremiumTierCard } from "@/components/settings/PremiumTierCard";

describe("PremiumTierCard", () => {
  it("renders credit counts and purchase buttons for non-lifetime users", () => {
    const { getByText } = render(
      <PremiumTierCard
        subscriptionTier="pilsner"
        lifetimePass={false}
        freeCredits={1}
        dayCredits={2}
        weekendCredits={3}
        onBuyDayPass={jest.fn()}
        onBuyWeekendPass={jest.fn()}
        onBuyLifetime={jest.fn()}
      />,
    );

    expect(getByText("Free Events")).toBeTruthy();
    expect(getByText("Day Passes")).toBeTruthy();
    expect(getByText("Weekend Passes")).toBeTruthy();
    expect(getByText("1")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText(/Buy Single Event/i)).toBeTruthy();
    expect(getByText(/Buy Weekend Unlimited/i)).toBeTruthy();
    expect(getByText(/Supporter/i)).toBeTruthy();
  });

  it("hides purchase buttons for lifetime users", () => {
    const { queryByText, getByText } = render(
      <PremiumTierCard
        subscriptionTier="lifetime"
        lifetimePass={true}
        freeCredits={0}
        dayCredits={0}
        weekendCredits={0}
        onBuyDayPass={jest.fn()}
        onBuyWeekendPass={jest.fn()}
        onBuyLifetime={jest.fn()}
      />,
    );

    expect(getByText("Supporter (Lifetime)")).toBeTruthy();
    expect(queryByText(/Buy Single Event/i)).toBeNull();
    expect(queryByText(/Buy Weekend Unlimited/i)).toBeNull();
  });
});
