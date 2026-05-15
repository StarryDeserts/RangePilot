export class DeepBookPredictUnconfirmedBindingError extends Error {
  readonly code = "DEEPBOOK_PREDICT_UNCONFIRMED_BINDING";

  constructor(message: string) {
    super(message);
    this.name = "DeepBookPredictUnconfirmedBindingError";
  }
}

export class DeepBookPredictCoinSelectionError extends Error {
  readonly code = "DEEPBOOK_PREDICT_COIN_SELECTION";

  constructor(message: string) {
    super(message);
    this.name = "DeepBookPredictCoinSelectionError";
  }
}

export function translateDeepBookPredictError(error: unknown): string {
  if (error instanceof DeepBookPredictUnconfirmedBindingError) {
    return error.message;
  }

  if (error instanceof DeepBookPredictCoinSelectionError) {
    return error.message;
  }

  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("reject") ||
    lowerMessage.includes("declin") ||
    lowerMessage.includes("denied") ||
    lowerMessage.includes("cancel")
  ) {
    return "Wallet confirmation was rejected or cancelled.";
  }

  if (lowerMessage.includes("insufficient") && lowerMessage.includes("dusdc")) {
    return "Insufficient DUSDC balance for this deposit.";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("chain")) {
    return "Wallet must be connected to Sui Testnet for this scaffold.";
  }

  if (lowerMessage.includes("moveabort") || lowerMessage.includes("move abort")) {
    return "Sui Move execution failed. Confirm the PredictManager, DUSDC coin, and entrypoint bindings before retrying.";
  }

  return message || "DeepBook Predict operation failed.";
}
