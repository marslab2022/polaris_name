export interface attributeInterface {
  name: string;
  type: 'number' | 'boolean' | 'enum';
  enums?: string[]; // valid if type === 'enum'
}

export interface newDomainParam {
  domain: string;
}

export interface mintParam {
  nftAddress: string;
}

export interface linkToParam {
  domain: string;
  name: string;
  target: string;
}

export interface unlinkParam {
  domain: string;
  name: string;
}

export type declareParam = unlinkParam;

export type getTargetParam = unlinkParam;

export type getOwnerParam = unlinkParam;

export type burnParam = unlinkParam;

export interface getNameParam {
  tx: string;
}

export interface getTargetResult {
  target: string;
}

export type getNameResult = unlinkParam | undefined;

export interface getDomainNamesResult {
  [domain: string]: {
    [name: string]: {
      target: string | undefined;
    }
  }
}

export interface getOwnerResult {
  wallet: string;
}

export interface getNFTSetResult {
  [address: string]: Object; // address->attributes
}

export interface getAttributesResult {
  attributes: attributeInterface[];
}

// common interfaces

export interface Action {
  input: Input;
  caller: string;
}

export interface Input {
  function: Function;
  params: Params;
}

export interface State {
  owner: string;
  name: string;
  description: string;
  nftSrcTxId: string;
  nftSet: {
    [address: string]: Object; // address->attributes
  };
  attributes: attributeInterface[];
  tokenAddress: string;
  nameUserMap: {
    [domain: string]: {
      [name: string]: {
        nftAddress: string;
        target: string | undefined;
        price: number;
      }
    }
  };
  targetNameMap: {
    [tx: string]: {
      domain: string;
      name: string;
    }
  };
}

export type Function = 
    'newDomain' |
    'mint' | 
    'burn' | 
    'linkTo' |
    'unlink'|
    'declare' |
    'getTarget' |
    'getName' |
    'getDomainNames' |
    'getOwnerResult' |
    'getOwner' |
    'getNFTSet' |
    'getAttributes';

export type Params = 
  newDomainParam |
  mintParam |
  burnParam |
  linkToParam |
  unlinkParam |
  declareParam |
  getTargetParam |
  getNameParam |
  getOwnerParam;

export type Result = 
  getTargetResult |
  getNameResult |
  getDomainNamesResult |
  getOwnerResult |
  getAttributesResult |
  getNFTSetResult;
    
export type ContractResult = { state: State } | { result: Result };
