import * as type from '../../types/types';
import { checkOwner, contractAssert, isAddress } from '../common';

export const linkTo = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.linkToParam = <type.linkToParam>action.input.params;
  const domain: string = param.domain;
  const name: string = param.name;
  const target: string = param.target;
  const info = state.nameUserMap[domain][name];

  contractAssert(
    validTarget(target),
    'Target format error!'
  );
  contractAssert(
    await checkOwner(info.nftAddress, action.caller),
    'You can only set target for a name belongs to you!'
  );

  state.nameUserMap[domain][name].target = target;
  state.targetNameMap[target] = {domain, name};

  return { state };
};

const validTarget = (name: string) => /^[a-z0-9_-]{1,64}$/i.test(name);