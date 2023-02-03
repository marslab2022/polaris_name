import fs from 'fs';
import ArLocal from 'arlocal';
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import path from 'path';
import { addFunds, mineBlock } from '../utils/_helpers';
import {
  Warp,
  WarpFactory,
  LoggerFactory,
  Contract,
} from 'warp-contracts';

describe('Testing Polaris Module', () => {
  console.log = function() {};

  let arweave: Arweave;
  let arlocal: ArLocal;
  let warp: Warp;

  let walletJwk: JWKInterface;
  let walletAddress: string;
  let customWalletJwk: JWKInterface;
  let customWalletAddress: string;

  let contractSrc: string;
  let contractInit: Object;
  let contractTxId: string;
  let nftSrcTxId: string;

  let userContract: Contract;
  let customContract: Contract;

  let pntInit: Object;
  let pntTxId: string;

  let userPnt: Contract;
  let customPnt: Contract;
  

  beforeAll(async () => {
    arlocal = new ArLocal(1821);
    await arlocal.start();

    LoggerFactory.INST.logLevel('error');

    warp = WarpFactory.forLocal(1821);
    arweave = warp.arweave;
  });

  afterAll(async () => {
    await arlocal.stop();
  });

  async function Initialize() {
    walletJwk = await arweave.wallets.generate();
    await addFunds(arweave, walletJwk);
    walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
    await mineBlocks(1);

    customWalletJwk = await arweave.wallets.generate();
    await addFunds(arweave, customWalletJwk);
    customWalletAddress = await arweave.wallets.jwkToAddress(customWalletJwk);
    await mineBlocks(1);

    // deploy Polaris template nft
    const nftSrc = fs.readFileSync(path.join(__dirname, '../pkg/atomic_nft/atomic-nft-contract_bg.wasm'));

    const nftTx = await warp.createContract.deploy({
      wallet: walletJwk,
      initState: JSON.stringify({}),
      src: nftSrc,
      wasmSrcCodeDir: path.join(__dirname, '../src/atomic_nft'),
      wasmGlueCode: path.join(__dirname, '../pkg/atomic_nft/atomic-nft-contract.js'),
      data: { 'Content-Type': 'text/json', body: 'undefined' }
    });
    nftSrcTxId = nftTx.srcTxId;

    // deploy Polaris name token
    const wrcSrc = fs.readFileSync(path.join(__dirname, '../pkg/wrc20/erc20-contract_bg.wasm'));

    pntInit = {
      symbol: 'PNT',
      name: 'Polaris Name Token',
      decimals: 2,
      totalSupply: 20000,
      balances: {
        [walletAddress]: 10000,
        [customWalletAddress]: 10000
      },
      allowances: {},
      settings: null,
      owner: walletAddress,
      canEvolve: true,
      evolve: '',
    };

    const pntTxInfo = (await warp.createContract.deploy({
      wallet: walletJwk,
      initState: JSON.stringify(pntInit),
      src: wrcSrc,
      wasmSrcCodeDir: path.join(__dirname, '../src/wrc20'),
      wasmGlueCode: path.join(__dirname, '../pkg/wrc20/erc20-contract.js'),
    }));
    pntTxId = pntTxInfo.contractTxId;

    userPnt = warp.contract(pntTxId);
    userPnt.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(walletJwk);
    customPnt = warp.contract(pntTxId);
    customPnt.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(customWalletJwk);
  
    await mineBlocks(1);

    // deploy Polaris name contract
    contractSrc = fs.readFileSync(path.join(__dirname, '../dist/contract.js'), 'utf8');
    const initFromFile = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../dist/polaris_name/initial-state.json'), 'utf8')
    );
    contractInit = {
      ...initFromFile,
      owner: walletAddress,
      nftSrcTxId: nftSrcTxId,
      tokenAddress: pntTxId,
    };

    contractTxId = (await warp.createContract.deploy({
      wallet: walletJwk,
      initState: JSON.stringify(contractInit),
      src: contractSrc,
    })).contractTxId;
    userContract = warp.contract(contractTxId);
    userContract.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(walletJwk);
    customContract = warp.contract(contractTxId);
    customContract.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(customWalletJwk);
    await mineBlocks(1);
  }

  async function mineBlocks(times: number) {
    for (var i = 0; i < times; i ++) {
      await mineBlock(arweave);
    }
  }

  async function mint(domain: string, name: string) {
    let initialState = {
      description: 'Polaris name atomic-nft',
      symbol: 'PNA',
      name: 'Polaris Name Atomic NFT token',
      decimals: 0,
      totalSupply: 1,
      balances: {
        [walletAddress]: 1,
      },
      allowances: {},
      owner: walletAddress
    };
  
    const tx = await warp.createContract.deployFromSourceTx({
      wallet: walletJwk,
      srcTxId: nftSrcTxId,
      initState: JSON.stringify(initialState),
      data: { 'Content-Type': 'text/json', body: JSON.stringify({domain, name}) },
      tags: [{
        name: 'collectible',
        value: contractTxId
      }]
    });

    mineBlocks(1);

    await userPnt.writeInteraction({
      function: 'approve',
      spender: contractTxId,
      amount: 30
    })

    await userContract.writeInteraction({
      function: 'mint',
      params: {
        nftAddress: tx.contractTxId
      }
    });

    mineBlocks(1);

    return tx.contractTxId;
  }

  async function burn(domain: string, name: string) {
    await userContract.writeInteraction({
      function: 'burn',
      params: {
        domain,
        name
      }
    });
  }

  it('test deploy contract', async () => {
    await Initialize();
    expect(contractTxId.length).toEqual(43);
    expect(pntTxId.length).toEqual(43);
    expect(await (await userContract.readState()).cachedValue.state).toEqual(contractInit);
    expect(await (await customContract.readState()).cachedValue.state).toEqual(contractInit);
    
    expect((await userPnt.readState()).cachedValue.state).toEqual(pntInit);
    expect((await customPnt.readState()).cachedValue.state).toEqual(pntInit);
  });

  it('test function - mint', async () => {
    await Initialize();
    const txId = await mint('page', 'polaris');
    expect((await userContract.readState()).cachedValue.state['nftSet'][0]).toEqual(txId);
    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({
      polaris:{
        nftAddress:txId,
        price:3
      }
    });
    expect(txId.length).toEqual(43);
  });

  it('test function - mint - invalid domain', async () => {
    await Initialize();
    const txId = await mint('invalid', 'polaris');
    expect((await userContract.readState()).cachedValue.state['nftSet'].length).toEqual(0);
  });

  it('test function - mint - invalid name', async () => {
    await Initialize();
    await mint('page', '!nvalid');
    await mint('page', 'INVALID');
    await mint('page', '');
    await mint('page', contractTxId.toLowerCase());
    expect((await userContract.readState()).cachedValue.state['nftSet'].length).toEqual(0);
    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({});
  });

  it('test function - burn', async () => {
    await Initialize();
    await mint('page', 'polaris');
    expect((await userPnt.viewState({
      function: 'balanceOf',
      target: walletAddress
    })).result['balance']).toEqual(10000 - 3);
    await burn('page', 'polaris');
    expect((await userContract.readState()).cachedValue.state['nftSet'].length).toEqual(0);
    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({});
    expect((await userPnt.viewState({
      function: 'balanceOf',
      target: walletAddress
    })).result['balance']).toEqual(10000);
  });

  it('test function - burn - owner check', async () => {
    await Initialize();
    const txId = await mint('page', 'polaris');
    await customContract.writeInteraction({
      function: 'burn',
      params: {
        domain: 'page',
        name: 'polaris'
      }
    });
    const nftContract = warp.contract(txId);
    nftContract.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(walletJwk);
    await nftContract.writeInteraction({
      function: 'transfer', to: customWalletAddress, amount: 1 
    });
    await burn('page', 'polaris');
    expect((await userContract.readState()).cachedValue.state['nftSet'][0]).toEqual(txId);
    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({
      polaris:{
        nftAddress:txId,
        price:3
      }
    });
    expect((await userPnt.viewState({
      function: 'balanceOf',
      target: walletAddress
    })).result['balance']).toEqual(10000 - 3);
  });

  it('test function - linkTo', async () => {
    await Initialize();
    const txId = await mint('page', 'polaris');
    await userContract.writeInteraction({
      function: 'linkTo',
      params: {
        domain: 'page',
        name: 'polaris',
        target: contractTxId
      }
    });

    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({
      polaris:{
        nftAddress:txId,
        price:3,
        target: contractTxId
      }
    });
    expect((await userContract.viewState({
      function: 'getTarget',
      params: {
        domain: 'page',
        name: 'polaris'
      }
    })).result['target']).toEqual(contractTxId);
    expect((await userContract.viewState({
      function: 'getName',
      params: {
        tx: contractTxId
      }
    })).result).toEqual({domain: 'page', name: 'polaris'});
  });

  it('test function - linkTo - invalid target', async () => {
    await Initialize();
    const txId = await mint('page', 'polaris');
    await userContract.writeInteraction({
      function: 'linkTo',
      params: {
        domain: 'page',
        name: 'polaris',
        target: 'invalid target'
      }
    });
    await userContract.writeInteraction({
      function: 'linkTo',
      params: {
        domain: 'page',
        name: 'polaris',
        target: 'invalid@target'
      }
    });
    await userContract.writeInteraction({
      function: 'linkTo',
      params: {
        domain: 'page',
        name: 'polaris',
        target: ''
      }
    });

    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({
      polaris:{
        nftAddress:txId,
        price:3
      }
    });
    expect((await userContract.viewState({
      function: 'getName',
      params: {
        tx: contractTxId
      }
    })).result).toEqual(null);
  });

  it('test function - linkTo - invalid name', async () => {
    await Initialize();
    const txId = await mint('page', 'polaris');
    await userContract.writeInteraction({
      function: 'linkTo',
      params: {
        domain: 'page',
        name: 'invalid',
        target: contractTxId
      }
    });

    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({
      polaris:{
        nftAddress:txId,
        price:3
      }
    });
    expect((await userContract.viewState({
      function: 'getName',
      params: {
        tx: contractTxId
      }
    })).result).toEqual(null);
  });

  it('test function - unlink', async () => {
    await Initialize();
    const txId = await mint('page', 'polaris');
    await userContract.writeInteraction({
      function: 'linkTo',
      params: {
        domain: 'page',
        name: 'polaris',
        target: contractTxId
      }
    });
    expect((await userContract.viewState({
      function: 'getName',
      params: {
        tx: contractTxId
      }
    })).result).toEqual({domain: 'page', name: 'polaris'});

    await userContract.writeInteraction({
      function: 'unlink',
      params: {
        domain: 'page',
        name: 'polaris'
      }
    });

    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({
      polaris:{
        nftAddress:txId,
        price:3
      }
    });
    expect((await userContract.viewState({
      function: 'getName',
      params: {
        tx: contractTxId
      }
    })).result).toEqual(null);
  });

  it('test function - unlink - owner check', async () => {
    await Initialize();
    const txId = await mint('page', 'polaris');
    await userContract.writeInteraction({
      function: 'linkTo',
      params: {
        domain: 'page',
        name: 'polaris',
        target: contractTxId
      }
    });
    await customContract.writeInteraction({
      function: 'unlink',
      params: {
        domain: 'page',
        name: 'polaris'
      }
    });

    expect((await userContract.readState()).cachedValue.state['nameUserMap']['page']).toEqual({
      polaris:{
        nftAddress:txId,
        price:3,
        target: contractTxId
      }
    });
    expect((await userContract.viewState({
      function: 'getName',
      params: {
        tx: contractTxId
      }
    })).result).toEqual({domain: 'page', name: 'polaris'});
  });

  it('test function - newDomain', async () => {
    await Initialize();
    await userContract.writeInteraction({
      function: 'newDomain',
      params: {
        domain: 'newdomain'
      }
    });

    expect((await userContract.readState()).cachedValue.state['nameUserMap']['newdomain']).toEqual({});
  });

  it('test function - newDomain - permission check', async () => {
    await Initialize();
    await customContract.writeInteraction({
      function: 'newDomain',
      params: {
        domain: 'newdomain'
      }
    });

    expect((await userContract.readState()).cachedValue.state['nameUserMap']['newdomain']).toEqual(undefined);
  });

});
