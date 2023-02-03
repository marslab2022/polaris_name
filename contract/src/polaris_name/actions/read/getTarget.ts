import * as type from '../../types/types';

export const getTarget = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.getTargetParam = <type.getTargetParam>action.input.params;
  const domain: string = param.domain;
  const name: string = param.name;
  let result: type.getTargetResult = {target: state.nameUserMap[domain][name].target};

  return { result };
};
