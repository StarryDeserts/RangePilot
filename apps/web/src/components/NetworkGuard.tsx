type NetworkGuardProps = {
  isConnected: boolean;
  isTestnet: boolean;
};

export function NetworkGuard({ isConnected, isTestnet }: NetworkGuardProps) {
  if (!isConnected) {
    return (
      <section className="notice">
        Connect a browser wallet to continue. This scaffold never asks for sensitive credentials.
      </section>
    );
  }

  if (!isTestnet) {
    return (
      <section className="warning">
        Switch to Sui Testnet before using create or deposit actions.
      </section>
    );
  }

  return (
    <section className="success">
      Connected to the Sui Testnet wallet flow.
    </section>
  );
}
