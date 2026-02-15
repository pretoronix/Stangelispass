import React from "react";
import { render } from "@testing-library/react-native";
import { PromoCodeSection } from "@/components/settings/PromoCodeSection";
import type { PromoCode } from "@/services/promoCodes";

const baseProps = {
  isAdmin: true,
  currentUser: { id: "u1", name: "Admin", is_admin: true } as any,
  codes: [] as PromoCode[],
  loading: false,
  generating: false,
  redeeming: false,
  redeemCode: "",
  setRedeemCode: jest.fn(),
  onGenerateCode: jest.fn(),
  onRedeemCode: jest.fn(),
  onRefresh: jest.fn(),
};

describe("PromoCodeSection", () => {
  it("shows admin controls and code list", () => {
    const codes: PromoCode[] = [
      {
        id: "c1",
        code: "DAYPASS1",
        type: "event_day",
        created_at: new Date().toISOString(),
      },
      {
        id: "c2",
        code: "WEEKEND1",
        type: "event_weekend",
        redeemed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const { getByText } = render(
      <PromoCodeSection {...baseProps} codes={codes} />,
    );

    expect(getByText(/Generate Day Pass Code/i)).toBeTruthy();
    expect(getByText(/Generate Weekend Pass Code/i)).toBeTruthy();
    expect(getByText("DAYPASS1")).toBeTruthy();
    expect(getByText("WEEKEND1")).toBeTruthy();
    expect(getByText(/Redeemed/i)).toBeTruthy();
  });

  it("shows redeem area for non-admins and hides admin controls", () => {
    const { queryByText, getByText } = render(
      <PromoCodeSection {...baseProps} isAdmin={false} />,
    );

    expect(getByText(/Redeem Promo Code/i)).toBeTruthy();
    expect(getByText(/Redeem Code/i)).toBeTruthy();
    expect(queryByText(/Generate Day Pass Code/i)).toBeNull();
    expect(queryByText(/Generate Weekend Pass Code/i)).toBeNull();
  });

  it("shows empty state when no codes exist", () => {
    const { getByText } = render(
      <PromoCodeSection {...baseProps} codes={[]} />,
    );

    expect(getByText(/No promo codes generated yet/i)).toBeTruthy();
  });
});
