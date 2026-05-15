import { ConnectButton } from "@mysten/dapp-kit";
import { useSuiWallet } from "../hooks/useSuiWallet";

export function WalletStatus() {
  const wallet = useSuiWallet();

  return (
    <section className="card">
      <div className="cardHeader">
        <h2>Wallet</h2>
        <ConnectButton connectText="Connect wallet" />
      </div>
      <dl className="details">
        <dt>Status</dt>
        <dd>{wallet.connectionStatus}</dd>
        <dt>Wallet</dt>
        <dd>{wallet.walletName ?? "Not connected"}</dd>
        <dt>Address</dt>
        <dd className="mono">{wallet.address ?? "Not connected"}</dd>
        <dt>App network</dt>
        <dd>{wallet.activeNetwork}</dd>
        <dt>Wallet supports Testnet</dt>
        <dd>{wallet.walletSupportsTestnet ? "Yes" : "No"}</dd>
      </dl>
    </section>
  );
}
