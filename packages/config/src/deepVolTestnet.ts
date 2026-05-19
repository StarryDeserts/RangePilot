import type { DeepVolTestnetConfig } from "@rangepilot/types/deepVol";

export const DEEPVOL_TESTNET = {
  network: "testnet",
  packageId: null,
  protocolVaultId: null,
  adminCapId: null,
  defaultCreateFeeBps: 30,
  maxCreateFeeBps: 100,
  primaryMarket: "BTC",
  receiptCustody: "non_custodial",
} as const satisfies DeepVolTestnetConfig;
