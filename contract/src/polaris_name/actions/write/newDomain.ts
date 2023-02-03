import * as type from '../../types/types';
import { contractAssert, isAddress } from '../common';

export const newDomain = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.newDomainParam = <type.newDomainParam>action.input.params;
  const domain: string = param.domain;

  contractAssert(
    typeof(domain) === 'string',
    'Domain must be string type!'
  );
  contractAssert(
    action.caller === state.owner,
    'Permission denied!'
  );
  contractAssert(
    !state.nameUserMap.hasOwnProperty(domain),
    'Domain you enter has already exists!'
  );

  state.nameUserMap[domain] = {};

  return { state };
};