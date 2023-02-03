import * as type from '../../types/types';
import { checkOwner, contractAssert, isAddress } from '../common';

export const unlink = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.unlinkParam = <type.unlinkParam>action.input.params;
  const domain: string = param.domain;
  const name: string = param.name;
  const info = state.nameUserMap[domain][name];

  contractAssert(
    await checkOwner(info.nftAddress, action.caller),
    'You can only reset target for a name belongs to you!'
  );

  delete state.targetNameMap[info.target];
  state.nameUserMap[domain][name].target = undefined;

  return { state };
};