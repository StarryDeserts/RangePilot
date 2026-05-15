import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { getDusdcBalance } from "@rangepilot/sdk/deepbookPredict";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";

export function useDusdcBalance(address: string | null) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["dusdc-balance", address],
    queryFn: () => getDusdcBalance(client, address!, DEEPBOOK_PREDICT_TESTNET),
    enabled: Boolean(address),
    staleTime: 10_000,
  });
}
