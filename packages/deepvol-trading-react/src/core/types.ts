export type DeepVolTradingProduct = "MOVE" | "UP" | "DOWN" | "RANGE";

export type DeepVolMachineStatus =
  | "idle"
  | "blocked"
  | "ready"
  | "quoting"
  | "preflighting"
  | "awaiting_wallet"
  | "submitted"
  | "confirmed"
  | "failed";

export type DeepVolMachineStepStatus = "pending" | "active" | "passed" | "blocked" | "failed";

export type DeepVolMachineStep = {
  id: string;
  label: string;
  status: DeepVolMachineStepStatus;
  detail?: string;
};

export type DeepVolMachineAction = {
  label: string;
  disabled: boolean;
  run: () => void | Promise<void>;
};

export type DeepVolTradeMachine<
  TDiagnostics extends Record<string, unknown> = Record<string, unknown>,
  TResult extends Record<string, unknown> = Record<string, unknown>,
> = {
  product: DeepVolTradingProduct;
  status: DeepVolMachineStatus;
  steps: DeepVolMachineStep[];
  blockers: string[];
  actions: Record<string, DeepVolMachineAction>;
  diagnostics: TDiagnostics;
  result: TResult | null;
};
