import type { DeepVolTradeMachine } from "../core/types";
import { usePrimitiveTradeMachine, type UsePrimitiveTradeMachineParams } from "./usePrimitiveTradeMachine";

export function useDownTradeMachine(params: UsePrimitiveTradeMachineParams = {}): DeepVolTradeMachine {
  return usePrimitiveTradeMachine("DOWN", params);
}
