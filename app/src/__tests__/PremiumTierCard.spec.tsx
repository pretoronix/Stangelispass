import React from "react";
import { render } from "@testing-library/react-native";
import { PremiumTierCard } from "@/components/settings/PremiumTierCard";
import { IAP_ENABLED } from "@/services/iap";
import { copy } from "@/ui/copy";

describe("PremiumTierCard", () => {
  it("renders credit counts and purchase buttons when purchases are enabled", async () => {
    const { getByText } = await render(
      <PremiumTierCard
        subscriptionTier="pilsner"
        lifetimePass={false}
        freeCredits={1}
        dayCredits={2}
        weekendCredits={3}
        purchasesEnabled
        onBuyDayPass={jest.fn()}
        onBuyWeekendPass={jest.fn()}
        onBuyLifetime={jest.fn()}
      />,
    );

    expect(getByText(copy.settings.freeEvents)).toBeTruthy();
    expect(getByText(copy.settings.dayPasses)).toBeTruthy();
    expect(getByText(copy.settings.weekendPasses)).toBeTruthy();
    expect(getByText("1")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText(copy.settings.buySingleEvent)).toBeTruthy();
    expect(getByText(copy.settings.buyWeekendUnlimited)).toBeTruthy();
    expect(getByText(/Supporter/i)).toBeTruthy();
  });

  it("hides purchase buttons for lifetime users", async () => {
    const { queryByText, getByText } = await render(
      <PremiumTierCard
        subscriptionTier="lifetime"
        lifetimePass={true}
        freeCredits={0}
        dayCredits={0}
        weekendCredits={0}
        purchasesEnabled
        onBuyDayPass={jest.fn()}
        onBuyWeekendPass={jest.fn()}
        onBuyLifetime={jest.fn()}
      />,
    );

    expect(getByText("Supporter (Lifetime)")).toBeTruthy();
    expect(queryByText(/Buy Single Event/i)).toBeNull();
    expect(queryByText(/Buy Weekend Unlimited/i)).toBeNull();
  });

  it("hides purchase buttons but keeps credit counts when purchases are disabled", async () => {
    const { queryByText, getByText } = await render(
      <PremiumTierCard
        subscriptionTier="pilsner"
        lifetimePass={false}
        freeCredits={1}
        dayCredits={2}
        weekendCredits={3}
        purchasesEnabled={false}
        onBuyDayPass={jest.fn()}
        onBuyWeekendPass={jest.fn()}
        onBuyLifetime={jest.fn()}
      />,
    );

    expect(getByText(copy.settings.freeEvents)).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(queryByText(/Buy Single Event/i)).toBeNull();
    expect(queryByText(/Buy Weekend Unlimited/i)).toBeNull();
    expect(queryByText(/Become a Supporter/i)).toBeNull();
    expect(queryByText(/CHF/i)).toBeNull();
  });

  it("defaults to hiding purchase buttons (IAP is off for v1.0)", async () => {
    expect(IAP_ENABLED).toBe(false);

    const { queryByText } = await render(
      <PremiumTierCard
        subscriptionTier="pilsner"
        lifetimePass={false}
        onBuyDayPass={jest.fn()}
        onBuyWeekendPass={jest.fn()}
        onBuyLifetime={jest.fn()}
      />,
    );

    expect(queryByText(/Buy Single Event/i)).toBeNull();
    expect(queryByText(/Buy Weekend Unlimited/i)).toBeNull();
    expect(queryByText(/Become a Supporter/i)).toBeNull();
  });
});
