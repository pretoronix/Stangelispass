import React from "react";
import { render, waitFor } from "@testing-library/react-native";

const mockGetBeerCountByUser = jest.fn(async () => [
  { userId: "u1", name: "Alice", count: 2 },
]);
const mockEq = jest.fn().mockReturnThis();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ eventId: "e1" }),
}));

jest.mock("@/services/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: mockEq,
      maybeSingle: jest.fn(async () => ({
        data: { id: "e1", name: "Friday Round" },
        error: null,
      })),
    })),
  },
  getBeerCountByUser: mockGetBeerCountByUser,
}));

jest.mock("@/components/features/LeaderboardItem", () => ({
  LeaderboardItem: () => null,
}));

const PublicLeaderboardScreen = require("@/app/leaderboard/[eventId]").default;

describe("PublicLeaderboardScreen", () => {
  it("loads leaderboard using eventId from route params", async () => {
    render(<PublicLeaderboardScreen />);

    await waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith("id", "e1");
    });
  });
});
