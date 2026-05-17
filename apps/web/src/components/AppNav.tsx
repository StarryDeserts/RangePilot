import { ConnectButton } from "@mysten/dapp-kit";

export function AppNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="appNav" aria-label="RangePilot scaffold navigation">
      <a className="appBrand" href="/trade">RangePilot</a>
      <div className="navLinks">
        <a className={isActive(currentPath, "/trade") ? "active" : undefined} href="/trade">Trade</a>
        <a className={isActive(currentPath, "/portfolio") ? "active" : undefined} href="/portfolio">Portfolio</a>
      </div>
      <ConnectButton connectText="Connect wallet" />
    </nav>
  );
}

function isActive(currentPath: string, path: string) {
  if (path === "/trade") {
    return currentPath === "/" || currentPath === "/trade";
  }

  return currentPath === path;
}
