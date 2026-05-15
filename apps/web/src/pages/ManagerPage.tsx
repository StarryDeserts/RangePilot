import { DusdcBalanceCard } from "../components/DusdcBalanceCard";
import { NetworkGuard } from "../components/NetworkGuard";
import { PredictManagerCard } from "../components/PredictManagerCard";
import { WalletStatus } from "../components/WalletStatus";
import { useSuiWallet } from "../hooks/useSuiWallet";

export function ManagerPage() {
  const wallet = useSuiWallet();

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">RangePilot Phase 1B</p>
        <h1>Predict Account setup</h1>
        <p>
          Create/load a PredictManager and prepare DUSDC deposits without range minting or automatic transactions.
        </p>
      </section>
      <NetworkGuard isConnected={wallet.isConnected} isTestnet={wallet.isTestnet} />
      <div className="grid">
        <WalletStatus />
        <DusdcBalanceCard address={wallet.address} />
        <PredictManagerCard address={wallet.address} isTestnet={wallet.isTestnet} />
      </div>
    </main>
  );
}
