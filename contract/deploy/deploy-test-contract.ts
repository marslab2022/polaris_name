import fs from 'fs';
import path from 'path';
import { addFunds } from '../utils/_helpers';
import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';

const warp = WarpFactory.forLocal(1984);
const arweave = warp.arweave;
LoggerFactory.INST.logLevel('error');

(async () => {
  console.log('running...');

  const walletJwk = await arweave.wallets.generate();
  await addFunds(arweave, walletJwk);
  const walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
  
  // deploy PNT token
  const wrcSrc = fs.readFileSync(path.join(__dirname, '../pkg/wrc20/erc20-contract_bg.wasm'));

  const pntInit = {
    symbol: 'PNT',
    name: 'Polaris Name Token',
    decimals: 0,
    totalSupply: 1000000000,
    balances: {
      [walletAddress]: 1000000000,
    },
    allowances: {},
    owner: walletAddress
  };

  const pntTxId = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(pntInit),
    src: wrcSrc,
    wasmSrcCodeDir: path.join(__dirname, '../src/wrc20/wrc-20_fixed_supply'),
    wasmGlueCode: path.join(__dirname, '../pkg/wrc20/erc20-contract.js'),
  })).contractTxId;

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
  const nftSrcTxId = nftTx.srcTxId;

  // deploy Polaris name contract
  const contractSrc = fs.readFileSync(path.join(__dirname, '../dist/contract.js'), 'utf8');
  const initFromFile = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../dist/polaris_name/initial-state.json'), 'utf8')
  );
  const contractInit = {
    ...initFromFile,
    owner: walletAddress,
    nftSrcTxId: nftSrcTxId,
    tokenAddress: pntTxId,
  };

  const contractTxId = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(contractInit),
    src: contractSrc,
  })).contractTxId;
  
  console.log('wallet address: ', walletAddress);
  console.log('polaris txid: ', contractTxId);
  console.log('PNT txid: ', pntTxId);
  console.log('NFT src txid: ', nftSrcTxId);
  fs.writeFileSync(path.join(__dirname, 'key-file-for-test.json'), JSON.stringify(walletJwk));
  fs.writeFileSync(path.join(__dirname, 'polaris-txid-for-test.json'), contractTxId);
  fs.writeFileSync(path.join(__dirname, 'pnt-txid-for-test.json'), pntTxId);
  fs.writeFileSync(path.join(__dirname, 'nft-srcid-for-test.json'), nftSrcTxId);
})();
