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
    console.log(getTargetRet);
    if (getTargetRet.status === false || !isWellFormattedAddress(getTargetRet.result)) {
      return {status: false, result: `${name}.${domain} not registered or link not set!`};
    }
    
    switch (domain) {
      case 'page':
        window.location.href = `https://www.arweave.net/${getTargetRet.result}`;
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