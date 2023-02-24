import * as type from '../../types/types';
import { contractAssert, isAddress } from '../common';

export const mint = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.mintParam = <type.mintParam>action.input.params;
  const nftAddress: string = param.nftAddress;

  contractAssert(
    isAddress(nftAddress),
    'nftAddress is not valid!'
  );
  contractAssert(
    !state.nftSet.hasOwnProperty(nftAddress),
    'nftAddress has already been added to polaris contract!'
  );
  
  const tx = await SmartWeave.unsafeClient.transactions.get(nftAddress);

  // check srcTxId validity
  let SrcTxId: string;
  tx.get('tags').forEach(tag => {
    let key = tag.get('name', {decode: true, string: true});
    if (key === 'Contract-Src') {
      SrcTxId = tag.get('value', {decode: true, string: true});
    }
  });
  contractAssert(
    SrcTxId && isAddress(SrcTxId),
    'Cannot find valid srcTxId in contract Tx content!'
  );
  contractAssert(
    SrcTxId === state.nftSrcTxId,
    `Polaris name nft should be minted with sourceTx: ${state.nftSrcTxId}`
  );

  // check nft content validity
  const dataSize = Number(tx.get('data_size'));
  contractAssert(
    dataSize < 100,
    'Polaris name nft content oversize!'
  );
  const nftContent = await SmartWeave.unsafeClient.transactions.getData(nftAddress, {decode: true, string: true});
  const domainName = JSON.parse(nftContent);
  const domain = domainName.domain;
  const name = domainName.name;
  contractAssert(
    typeof(domain) === 'string' && typeof(name) === 'string',
    'Polaris name nft content format error!'
  );

  // check nft current state validity
  const nftState = (await SmartWeave.contracts.readContractState(nftAddress));
  contractAssert(
    nftState.decimals === 0,
    'Polaris name nft state *decimals* should be 0!'
  );
  contractAssert(
    nftState.totalSupply === 1,
    'Polaris name nft state *totalSupply* should be 1!'
  );
  contractAssert(
    typeof(nftState.balances) === 'object',
    'Polaris name nft state *balances* should be object type!'
  );
  const balancesKeys: Array<string> = Object.keys(nftState.balances);
  contractAssert(
    balancesKeys.length === 1,
    'Polaris name nft state *balances* should only contain 1 address!'
  );
  contractAssert(
    nftState.balances[balancesKeys[0]] === 1,
    'Polaris name nft state *owner* balance should be 1!'
  );
  
  // check domain & name field validity
  contractAssert(
    state.nameUserMap[domain] !== undefined,
    'Polaris name nft state *domain* not valid!'
  );
  contractAssert(
    state.nameUserMap[domain][name] === undefined,
    'Polaris name nft state *name* has already been taken!'
  );
  contractAssert(
    validName(name),
    'Polaris name nft state *name* format not valid!'
  );

  const price = calcNamePrice(name);

  // transfer polaris name token to contract
  await SmartWeave.contracts.write(
    state.tokenAddress,
    {
      function: 'transferFrom',
      from: action.caller, 
      to: SmartWeave.contract.id, 
      amount: price
    },
  );

  // add nft address to polaris name contract state
  state.nftSet[nftAddress] = {
    length: name.length,
    domain: domain
  };

  state.nameUserMap[domain][name] = {
    nftAddress: nftAddress,
    target: undefined,
    price: price
  };

  return { state };
};

const calcNamePrice = (name: string): number => {
  const nameLen = name.length;
  if (nameLen >= 10) {
    return 1;
  } else if (nameLen >= 7) {
    return 3;
  } else if (nameLen >= 5) {
    return 5;
  } else if (nameLen === 4) {
    return 7;
  } else if (nameLen === 3) {
    return 10;
  } else if (nameLen === 2) {
    return 15;
  } else {
    return 30;
  }
};

const validName = (name: string) => /^[a-z0-9_-]{1,32}$/.test(name);