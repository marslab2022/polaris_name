import * as type from '../../types/types';
import { checkOwner, contractAssert } from '../common';

export const getOWner = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.getOwnerParam = <type.getOwnerParam>action.input.params;
  const domain: string = param.domain;
  const name: string = param.name;

  const nftAddress = state.nameUserMap[domain][name].nftAddress;

  const nftState = (await SmartWeave.contracts.readContractState(nftAddress));
  const owner = Object.keys(nftState.balances)[0];
  const result: type.getOwnerResult = {wallet: owner};

  return { result };
};
