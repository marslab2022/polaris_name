declare const ContractError;

export const isAddress = (addr: string) => /[a-z0-9_-]{43}/i.test(addr);

export const contractAssert = (expression: boolean, message: string) => {
  if (!expression) {
    throw new ContractError(`Contract assertion failed: ${message}`);
  }
}

export const checkOwner = async (nftAddress: string, owner: string) => {
  contractAssert(
    isAddress(nftAddress),
    'Nft address is not valid!'
  );
  contractAssert(
    isAddress(owner),
    'Owner address is not valid!'
  );

  const nftState = (await SmartWeave.contracts.readContractState(nftAddress));
  return nftState.balances[owner] === 1;
}