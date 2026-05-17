import { DusdcBalanceCard } from "../components/DusdcBalanceCard";
import { NetworkGuard } from "../components/NetworkGuard";
import { PredictManagerCard } from "../components/PredictManagerCard";
import { RangeTradeCard } from "../components/RangeTradeCard";
import { WalletStatus } from "../components/WalletStatus";
import { usePredictManager } from "../hooks/usePredictManager";
import { useSuiWallet } from "../hooks/useSuiWallet";

export function TradePage() {
  const wallet = useSuiWallet();
  const manager = usePredictManager(wallet.address, wallet.isTestnet);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Phase 2A MVP scaffold</p>
        <h1>Guided range trading</h1>
        <p>
          Minimal browser-wallet flow for runtime market discovery, quote preview, full mint preflight, and Testnet wallet submission.
        </p>
      </section>
      <NetworkGuard isConnected={wallet.isConnected} isTestnet={wallet.isTestnet} />
      <div className="grid">
        <WalletStatus />
        <DusdcBalanceCard address={wallet.address} />
        <PredictManagerCard address={wallet.address} isTestnet={wallet.isTestnet} manager={manager} />
        <RangeTradeCard address={wallet.address} isTestnet={wallet.isTestnet} managerId={manager.managerId} />
      </div>
    </main>
  );
}
