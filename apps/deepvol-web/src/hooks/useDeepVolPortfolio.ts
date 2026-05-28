import { usePortfolioRecords } from "@rangepilot/deepvol-trading-react";

export type { DeepVolPortfolioReceipt } from "@rangepilot/deepvol-trading-react";

export function useDeepVolPortfolio() {
  const portfolio = usePortfolioRecords();

  return {
    receipts: portfolio.receipts,
    isLoading: portfolio.isLoading,
    isError: portfolio.isError,
    error: portfolio.error,
    hasLocalReceipts: portfolio.hasLocalReceipts,
  };
}
