import { unlink } from './actions/write/unlink';
import { burn } from './actions/write/burn';
import { linkTo } from './actions/write/linkTo';
import { mint } from './actions/write/mint';
import { newDomain } from './actions/write/newDomain';
import { getName } from './actions/read/getName';
import { getTarget } from './actions/read/getTarget';
import * as type from './types/types';
import { getDomainNames } from './actions/read/getDomainNames';
import { getOWner } from './actions/read/getOwner';
import { getNFTSet } from './actions/read/getNFTSet';
import { getAttributes } from './actions/read/getAttributes';

declare const ContractError;

export async function handle(state: type.State, action: type.Action): Promise<type.ContractResult> {
  const func = action.input.function;

  switch (func) {
    case 'burn':
      return await burn(state, action);
    case 'linkTo':
      return await linkTo(state, action);
    case 'mint':
      return await mint(state, action);
    case 'newDomain':
      return await newDomain(state, action);
    case 'unlink':
      return await unlink(state, action);
    case 'getName':
      return await getName(state, action);
    case 'getTarget':
      return await getTarget(state, action);
    case 'getDomainNames':
      return await getDomainNames(state, action);
    case 'getOwner':
      return await getOWner(state, action);
    case 'getNFTSet':
      return await getNFTSet(state, action);
    case 'getAttributes':
      return await getAttributes(state, action);
    default:
      throw new ContractError(`No function supplied or function not recognised: "${func}"`);
  }
}
