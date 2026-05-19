import type { ReactNode } from "react";
import { WalletStatus } from "./WalletStatus";
import { useSuiWallet } from "../hooks/useSuiWallet";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/markets", label: "Markets" },
  { href: "/buy/btc-move", label: "Buy BTC MOVE" },
  { href: "/portfolio", label: "Portfolio" },
] as const;

export function AppShell({ children }: AppShellProps) {
  const wallet = useSuiWallet();

  return (
    <div className="appShell">
      <header className="topNav">
        <a className="brand" href="/markets" aria-label="DeepVol markets">
          <span className="brandMark">DV</span>
          <span>
            <strong>DeepVol</strong>
            <small>BTC MOVE on Sui Testnet</small>
          </span>
        </a>
        <nav className="navLinks" aria-label="DeepVol navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <WalletStatus />
      </header>

      <main className="shellMain">
        {!wallet.isConnected && (
          <section className="noticeBanner">
            Connect a Sui wallet to inspect wallet-specific quotes, fee coins, and receipt readback.
          </section>
        )}
        {wallet.isConnected && !wallet.isTestnet && (
          <section className="warningBanner">
            Switch to Sui Testnet before DeepVol can prepare a BTC MOVE wallet transaction.
          </section>
        )}
        {children}
      </main>
    </div>
  );
}
