import { NetworkGuard } from "../components/NetworkGuard";
import { WalletStatus } from "../components/WalletStatus";
import { useSuiWallet } from "../hooks/useSuiWallet";

export function WalletSetupPage() {
  const wallet = useSuiWallet();

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">RangePilot Phase 1B</p>
        <h1>Connect a Sui Testnet wallet</h1>
        <p>
          This scaffold reads DUSDC coins, prepares a Predict Account create flow, and blocks unconfirmed deposit bindings until they are validated.
        </p>
      </section>
      <NetworkGuard isConnected={wallet.isConnected} isTestnet={wallet.isTestnet} />
      <WalletStatus />
    </main>
  );
}
