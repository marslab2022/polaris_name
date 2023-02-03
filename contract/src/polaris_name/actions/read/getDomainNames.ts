import * as type from '../../types/types';
import { checkOwner, contractAssert } from '../common';

export const getDomainNames = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const result: type.getDomainNamesResult = state.nameUserMap;

  return { result };
};
