import { ConnectButton } from "@mysten/dapp-kit";
import { useSuiWallet } from "../hooks/useSuiWallet";
import { shortId } from "../lib/format";

export function WalletStatus() {
  const wallet = useSuiWallet();

  return (
    <section className="walletPanel">
      <div className="walletConnect">
        <ConnectButton connectText="Connect wallet" />
      </div>
      <dl className="compactDetails">
        <div>
          <dt>Status</dt>
          <dd>{wallet.connectionStatus}</dd>
        </div>
        <div>
          <dt>Wallet</dt>
          <dd>{wallet.walletName ?? "Not connected"}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd className="mono" title={wallet.address ?? undefined}>
            {shortId(wallet.address)}
          </dd>
        </div>
        <div>
          <dt>App network</dt>
          <dd>{wallet.activeNetwork}</dd>
        </div>
        <div>
          <dt>Testnet support</dt>
          <dd>{wallet.walletSupportsTestnet ? "Ready" : "Unavailable"}</dd>
        </div>
      </dl>
    </section>
  );
}
