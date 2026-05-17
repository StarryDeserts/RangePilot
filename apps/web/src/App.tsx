import { useEffect, useState } from "react";
import { AppNav } from "./components/AppNav";
import { TradePage } from "./pages/TradePage";
import { PortfolioPage } from "./pages/PortfolioPage";
import "./styles.css";

export function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const page = path === "/portfolio" ? <PortfolioPage /> : <TradePage />;
  const isKnownPath = path === "/" || path === "/trade" || path === "/portfolio";

  return (
    <>
      <AppNav currentPath={path} />
      {!isKnownPath && (
        <section className="notice routeNotice">
          Unknown route <span className="mono">{path}</span>; showing the trade scaffold.
        </section>
      )}
      {page}
    </>
  );
}
