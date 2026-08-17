import React from "react";
import { render } from "@testing-library/react-native";
import { PromoCodeSection } from "@/components/settings/PromoCodeSection";
import type { PromoCode } from "@/services/promoCodes";
import { copy } from "@/ui/copy";

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
  it("shows admin controls and code list", async () => {
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

    const { getByText } = await render(
      <PromoCodeSection {...baseProps} codes={codes} />,
    );

    expect(getByText(copy.settings.generateDayPassCode)).toBeTruthy();
    expect(getByText(copy.settings.generateWeekendPassCode)).toBeTruthy();
    expect(getByText("DAYPASS1")).toBeTruthy();
    expect(getByText("WEEKEND1")).toBeTruthy();
    expect(getByText(copy.settings.codeRedeemed)).toBeTruthy();
  });

  it("shows redeem area for non-admins and hides admin controls", async () => {
    const { queryByText, getByText } = await render(
      <PromoCodeSection {...baseProps} isAdmin={false} />,
    );

    expect(getByText(copy.settings.redeemPromoCode)).toBeTruthy();
    expect(getByText(copy.settings.redeemCodeLabel)).toBeTruthy();
    expect(queryByText(copy.settings.generateDayPassCode)).toBeNull();
    expect(queryByText(copy.settings.generateWeekendPassCode)).toBeNull();
  });

  it("shows empty state when no codes exist", async () => {
    const { getByText } = await render(
      <PromoCodeSection {...baseProps} codes={[]} />,
    );

    expect(getByText(copy.settings.noPromoCodesYet)).toBeTruthy();
  });
});
