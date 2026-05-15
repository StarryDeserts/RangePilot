import type { DusdcBalance } from "@rangepilot/types/deepbookPredict";
import { useDusdcBalance } from "../hooks/useDusdcBalance";

export function DusdcBalanceCard({ address }: { address: string | null }) {
  const balanceQuery = useDusdcBalance(address);

  return (
    <section className="card">
      <h2>DUSDC wallet balance</h2>
      {!address && <p>Connect a wallet to read DUSDC coins.</p>}
      {balanceQuery.isLoading && <p>Loading DUSDC coins…</p>}
      {balanceQuery.error && <p className="error">{balanceQuery.error.message}</p>}
      {balanceQuery.data && <DusdcBalanceDetails balance={balanceQuery.data} />}
    </section>
  );
}

function DusdcBalanceDetails({ balance }: { balance: DusdcBalance }) {
  const displayBalance = formatAtomicUnits(balance.totalAtomic, balance.decimals);

  return (
    <>
      <dl className="details">
        <dt>Coin type</dt>
        <dd className="mono breakAll">{balance.coinType}</dd>
        <dt>Decimals</dt>
        <dd>{balance.decimals}</dd>
        <dt>Total atomic</dt>
        <dd className="mono">{balance.totalAtomic}</dd>
        <dt>Display</dt>
        <dd>{displayBalance} DUSDC</dd>
        <dt>Coin objects</dt>
        <dd>{balance.coins.length}</dd>
      </dl>
      {balance.totalAtomic === "0" && (
        <p className="noticeInline">
          DUSDC balance is zero. Use the Testnet DUSDC faucet or funding path before testing deposits.
        </p>
      )}
    </>
  );
}

export function formatAtomicUnits(amountAtomic: string, decimals: number) {
  const amount = BigInt(amountAtomic);
  const scale = 10n ** BigInt(decimals);
  const whole = amount / scale;
  const fraction = (amount % scale).toString().padStart(decimals, "0");
  const trimmedFraction = fraction.replace(/0+$/, "");

  return trimmedFraction ? `${whole.toString()}.${trimmedFraction}` : whole.toString();
}
