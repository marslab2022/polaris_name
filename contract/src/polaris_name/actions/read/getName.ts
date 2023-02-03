import * as type from '../../types/types';
import { checkOwner, contractAssert } from '../common';

export const getName = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.getNameParam = <type.getNameParam>action.input.params;
  const tx: string = param.tx;

  const info = state.targetNameMap[tx];
  if (info === undefined) {
    const result: type.getNameResult = undefined;
    return { result };
  }

  const result: type.getNameResult = state.targetNameMap[tx];

  return { result };
};
