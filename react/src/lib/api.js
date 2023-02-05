import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
import { mul, pow } from './math';
import { intelliContract } from './intelliContract';
import { stat } from 'fs';

LoggerFactory.INST.logLevel('error');

// addresses
const nftSrcTxId = 'q2FQDmGclkwiiuAvWOc1cAuUUZ_Px65CB4k5ggoYADs';
const polarisContractAddress = 'GYMOnUEpGlEcbDBU0CFl7kgfv9i5Jw2qC-XR3She0-o';
const ownerWalletAdrress = 'g-HsAODsIOoTG4MgvmeOTmqyA_RKMupujUuok-nrmkg';
export const pntAddress = "wWpwvpGf7-Vmd6AlK4V_mXWu9amr9PpacsNgvp7eNiQ";

// const warp = WarpFactory.forLocal(1984);
// const warp = WarpFactory.forTestnet();
const warp = WarpFactory.forMainnet({
  dbLocation: './cache/warp'+(new Date().getTime()).toString(), 
  inMemory: false
});
const arweave = warp.arweave;
let walletAddress = undefined;
export let isConnectWallet = false;

let polarisContract = undefined;
let pntContract = undefined;

export async function connectWallet(walletJwk) {
  polarisContract.connectWallet(walletJwk);
  pntContract.connectWallet(walletJwk);
  isConnectWallet = true;
  walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
}

export async function connectContract() {
  polarisContract = new intelliContract(warp);
  polarisContract.connectContract(polarisContractAddress);

  pntContract = new intelliContract(warp);
  pntContract.connectContract(pntAddress);

  return {status: true, result: 'Connect contract success!'};
}

export function getWalletAddress() {
  return walletAddress;
}

export function arLessThan(a, b) {
  return arweave.ar.isLessThan(arweave.ar.arToWinston(a), arweave.ar.arToWinston(b));
}

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_-]{43}$/;
  return re.test(input);
}

export async function getBalance(tokenAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }

  if (!isWellFormattedAddress(tokenAddress) && tokenAddress !== 'ar') {
    return {status: false, result: 'Pst address not valid!'};
  }

  let result = "";
  let status = true;
  try {
    if (tokenAddress === 'ar') {
      result = arweave.ar.winstonToAr(await arweave.wallets.getBalance(getWalletAddress()));
    } else {
      result = await (await warp.contract(tokenAddress).viewState({
        function: 'balanceOf',
        target: getWalletAddress(),
      })).result.balance;
    }
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function deployNFT(domain, name) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!minARBalanceCheck('0.01')) {
    return {status: false, result: 'You should have at least 0.01$AR in wallet to pay for network fee!'};
  }

  const initialState = {
    description: `Polaris domain name: ${name}.${domain}`,
    symbol: 'PNA',
    name: 'Polaris Name Atomic-nft',
    decimals: 0,
    totalSupply: 1,
    balances: {
      [walletAddress]: 1,
    },
    allowances: {}
  };

  let status = true;
  let result = '';

  try {
    const tx = await warp.createContract.deployFromSourceTx({
      wallet: 'use_wallet',
      srcTxId: nftSrcTxId,
      initState: JSON.stringify(initialState),
      data: { 'Content-Type': 'text/json', body: JSON.stringify({domain, name}) },
      tags: [{
        name: 'collectible',
        value: polarisContractAddress
      }]
    }, true);
    if (isWellFormattedAddress(tx.contractTxId)) {
      status = true;
      result = tx.contractTxId;
    } else {
      status = false;
      result = 'Deploy Atomic-nft failed!'
    }
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function mint(nftAddress, name) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!pntContract || !polarisContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!isWellFormattedAddress(nftAddress)) {
    return {status: false, result: 'Atomic NFT address not valid!'};
  }
  if (!minARBalanceCheck('0.01')) {
    return {status: false, result: 'You should have at least 0.01$AR in wallet to pay for network fee!'};
  }
  const txRet = await arweave.transactions.getStatus(nftAddress);
  if (txRet.status !== 200) {
    return {status: false, result: 'Please wait for NFT to be mined by Arweave and retry!'};
  }
  const confirmations = txRet.confirmed.number_of_confirmations;
  if (confirmations === undefined || confirmations < 10) {
    return {status: false, result: `Please wait for network confirmation: ${confirmations} / 10`};
  }

  const price = calcPrice(name);

  const balanceRet = await getBalance(pntAddress);
  if (balanceRet.status && balanceRet.result < price) {
    return {status: false, result: 'Insuffient funds of PNT to mint name!'};
  }

  let status = true;
  let result = '';
  try {
    await pntContract.writeInteraction({
      function: 'approve',
      spender: polarisContractAddress,
      amount: price
    });

    await polarisContract.writeInteraction({
      function: 'mint',
      params: {
        nftAddress: nftAddress
      }
    });

    status = true;
    result = 'Mint Polaris name succeeded!';
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function burn(domain, name) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!polarisContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!minARBalanceCheck('0.01')) {
    return {status: false, result: 'You should have at least 0.01$AR in wallet to pay for network fee!'};
  }
  const owner = await getOwner(domain, name);
  if (owner.status === false || owner.result.wallet !== getWalletAddress()) {
    return {status: false, result: `Can only operate names belong to you!`};
  }

  let status = true;
  let result = '';
  try {
    await polarisContract.writeInteraction({
      function: 'burn',
      params: {
        domain,
        name
      }
    });
    status = true;
    result = 'Burn name succeeded!'
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function link(domain, name, target) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!polarisContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!minARBalanceCheck('0.01')) {
    return {status: false, result: 'You should have at least 0.01$AR in wallet to pay for network fee!'};
  }
  if (!isWellFormattedAddress(target)) {
    return {status: false, result: `Target you entered is not valid: ${target}!`};
  }
  const owner = await getOwner(domain, name);
  if (owner.status === false || owner.result.wallet !== getWalletAddress()) {
    return {status: false, result: `Can only operate names belong to you!`};
  }

  let status = true;
  let result = '';
  try {
    await polarisContract.writeInteraction({
      function: 'linkTo',
      params: {
        domain,
        name,
        target
      }
    });

    status = true;
    result = `Set target for ${name}.${domain} succeeded!`;
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function unlink(domain, name) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!polarisContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!minARBalanceCheck('0.01')) {
    return {status: false, result: 'You should have at least 0.01$AR in wallet to pay for network fee!'};
  }
  const owner = await getOwner(domain, name);
  if (owner.status === false || owner.result.wallet !== getWalletAddress()) {
    return {status: false, result: `Can only operate names belong to you!`};
  }

  let status = true;
  let result = '';
  try {
    await polarisContract.writeInteraction({
      function: 'unlink',
      params: {
        domain,
        name
      }
    });

    status = true;
    result = 'Reset link succeeded!';
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function getOwner(domain, name) {
  if (!polarisContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let status = true;
  let result = '';
  try {
    result = (await polarisContract.viewState({
      function: 'getOwner',
      params: {
        domain,
        name
      }
    })).result;
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function getName(tx) {
  if (!polarisContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let status = true;
  let result = '';
  try {
    result = (await polarisContract.viewState({
      function: 'getName',
      params: {
        tx
      }
    })).result;
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function getTarget(domain, name) {
  if (!polarisContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let status = true;
  let result = '';
  try {
    result = (await polarisContract.viewState({
      function: 'getTarget',
      params: {
        domain,
        name
      }
    })).result;
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function getDomainNames() {
  if (!polarisContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let status = true;
  let result = '';
  try {
    result = (await polarisContract.viewState({
      function: 'getDomainNames',
    })).result;
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export const calcPrice = (name) => {
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

async function minARBalanceCheck(threshInAR) {
  const arBalanceRet = await getBalance('ar');
  if (arBalanceRet.status && arLessThan(arBalanceRet.result, threshInAR)) {
    return false;
  }
  return true;
}