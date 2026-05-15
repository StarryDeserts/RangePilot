import { WalletSetupPage } from "./pages/WalletSetupPage";
import { ManagerPage } from "./pages/ManagerPage";
import { useSuiWallet } from "./hooks/useSuiWallet";
import "./styles.css";

export function App() {
  const wallet = useSuiWallet();

  return wallet.isConnected ? <ManagerPage /> : <WalletSetupPage />;
}
