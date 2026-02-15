import { logExpected } from "@/utils/logger";

export const logMissingTable = (table: string, action: string) => {
  logExpected(`table \`${table}\` not found. ${action}.`, "beers");
};
