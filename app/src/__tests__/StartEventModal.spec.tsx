import React from "react";
import { render } from "@testing-library/react-native";
import { StartEventModal } from "@/components/settings/StartEventModal";
import { copy } from "@/ui/copy";

jest.mock("@/utils/eventPricing", () => ({
  getEventPricingType: () => "day",
  getEventPriceCHF: () => 10,
}));

describe("StartEventModal", () => {
  it("renders pass type buttons and pricing hint", async () => {
    const { getByText } = await render(
      <StartEventModal
        visible={true}
        eventName="Friday Beers"
        passType="day"
        onChangeEventName={jest.fn()}
        onChangePassType={jest.fn()}
        onCancel={jest.fn()}
        onStart={jest.fn()}
      />,
    );

    expect(getByText(copy.settings.passTypeDay)).toBeTruthy();
    expect(getByText(copy.settings.passTypeWeek)).toBeTruthy();
    expect(getByText(/CHF 10.00 \(day\)/i)).toBeTruthy();
  });
});
