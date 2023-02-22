import * as type from '../../types/types';

export const getAttributes = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const result: type.getAttributesResult = {attributes: state.attributes};

  return { result };
};
