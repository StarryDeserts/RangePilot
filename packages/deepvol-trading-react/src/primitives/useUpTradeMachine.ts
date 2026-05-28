import type { DeepVolTradeMachine } from "../core/types";
import { usePrimitiveTradeMachine, type UsePrimitiveTradeMachineParams } from "./usePrimitiveTradeMachine";

export function useUpTradeMachine(params: UsePrimitiveTradeMachineParams = {}): DeepVolTradeMachine {
  return usePrimitiveTradeMachine("UP", params);
}
