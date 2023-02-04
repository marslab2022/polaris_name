import React from 'react';
import { useParams } from "react-router-dom";
import { getTarget, isWellFormattedAddress } from '../lib/api';
import { PageLoading } from './PageLoading/PageLoading';

export const LinkJumper = (props) => {
  const params = useParams();
  
  const jump = async () => {
    const domain = params.domain;
    const name = params.name;
    console.log('jumper: ', domain, name);

    const getTargetRet = await getTarget(domain, name);
    const target = getTargetRet.result.target;
    if (getTargetRet.status === false || !isWellFormattedAddress(target)) {
      return {status: false, result: `${name}.${domain} not registered or link not set!`};
    }
    
    switch (domain) {
      case 'page':
        window.location.href = `https://www.arweave.net/${target}`;
        break;
      case 'wallet':
        window.location.href = `https://viewblock.io/arweave/address/${target}`;
        break;
      case 'token':
        window.location.href = `https://arweave.net/_tfx0j4nhCwRDYmgU6XryFDceF52ncPKVivot5ijwdQ/#/${target}`;
        break;
      default:
        return {status: false, result: `Dedicated page for domain '${domain}' not implemented yet!`};
    }

    return {status: true, result: `Redirecting to ${name}.${domain} ...`};
  };

  return (
    <PageLoading 
      submitTask={jump}
    />
  );
};