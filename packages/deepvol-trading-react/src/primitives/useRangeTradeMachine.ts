import type { DeepVolTradeMachine } from "../core/types";
import { usePrimitiveTradeMachine, type UsePrimitiveTradeMachineParams } from "./usePrimitiveTradeMachine";

export function useRangeTradeMachine(params: UsePrimitiveTradeMachineParams = {}): DeepVolTradeMachine {
  return usePrimitiveTradeMachine("RANGE", params);
}
