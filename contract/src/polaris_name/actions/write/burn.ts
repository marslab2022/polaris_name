import * as type from '../../types/types';
import { checkOwner, contractAssert, isAddress } from '../common';

export const burn = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.burnParam = <type.burnParam>action.input.params;
  const domain: string = param.domain;
  const name: string = param.name;
  const info = state.nameUserMap[domain][name];

  const nftAddress = info.nftAddress;
  contractAssert(
    await checkOwner(nftAddress, action.caller),
    'You can only burn name belongs to you!'
  );

  // refund user
  const price = info.price;

  await SmartWeave.contracts.write(
    state.tokenAddress,
    {
      function: 'transfer',
      to: action.caller, 
      amount: price
    },
  );

  // burn name
  state.nftSet = state.nftSet.filter(addr=>addr!==nftAddress);
  delete state.nameUserMap[domain][name];
  delete state.targetNameMap[info.target];

  return { state };
};