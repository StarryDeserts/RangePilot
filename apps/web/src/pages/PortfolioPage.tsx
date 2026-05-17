import { NetworkGuard } from "../components/NetworkGuard";
import { PortfolioReadbackCard } from "../components/PortfolioReadbackCard";
import { PredictManagerCard } from "../components/PredictManagerCard";
import { WalletStatus } from "../components/WalletStatus";
import { usePredictManager } from "../hooks/usePredictManager";
import { useSuiWallet } from "../hooks/useSuiWallet";

export function PortfolioPage() {
  const wallet = useSuiWallet();
  const manager = usePredictManager(wallet.address, wallet.isTestnet);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Phase 2A MVP scaffold</p>
        <h1>Portfolio readback</h1>
        <p>
          Minimal direct range_position readback and browser-wallet redeem flow for a known or manually entered RangeKey.
        </p>
      </section>
      <NetworkGuard isConnected={wallet.isConnected} isTestnet={wallet.isTestnet} />
      <div className="grid">
        <WalletStatus />
        <PredictManagerCard address={wallet.address} isTestnet={wallet.isTestnet} manager={manager} />
        <PortfolioReadbackCard address={wallet.address} isTestnet={wallet.isTestnet} managerId={manager.managerId} />
      </div>
    </main>
  );
}
