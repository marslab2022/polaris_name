import React from 'react';
import { Button, Dropdown, Input, Message } from 'rsuite';
import { calcPrice, getDomainNames, isWellFormattedAddress } from '../lib/api';
import { PageLoading } from './PageLoading/PageLoading';
import { RegisterSteps } from './RegisterSteps';

const centerStyle = {
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center',
  margin: '2rem'
};

export const Register = (props) => {
  const [tip, setTip] = React.useState();
  const [disabled, setDisabled] = React.useState(false);
  const [domain, setDomain] = React.useState('page');
  const [name, setName] = React.useState('');
  const [domainNameList, setDomainNameList] = React.useState();
  const [showSteps, setShowSteps] = React.useState(false);
  
  const fetchDomainNames = async () => {
    const domainNamesRet = await getDomainNames();
    console.log(domainNamesRet);
    if (domainNamesRet.status === false) {
      return domainNamesRet;
    }
    setDomainNameList(domainNamesRet.result);
    return {status: true, result: 'Fetch info secceeded!'};
  };

  const onInputChange = async (name) => {
    setName(name);

    if (Object.keys(domainNameList[domain]).includes(name)) {
      setTip({status: false, result: `${name}.${domain} has already been taken!`});
      setDisabled(true);
      return;
    }
    if (!(/^[a-z0-9_-]{1,32}$/.test(name))) {
      setTip({status: false, result: `${name} should only includes 0-9, a-z, '_', '-' charactors and be less than 33!`});
      setDisabled(true);
      return;
    }
    setDisabled(false);
    setTip({status: true, result: `${name}.${domain} is available! Price: ${calcPrice(name)} $PNT.`});
  }

  const onClickRegister = async () => {
    await setShowSteps(false);
    setShowSteps(true);
  };

  if (domainNameList === undefined) {
    return (
      <PageLoading 
        submitTask={fetchDomainNames}
      />
    );
  }

  return (
    <>
      <div style={centerStyle}>
        <div style={{display:'inline-block'}}>
          <Input
            onChange={onInputChange}
            style={{ width: 300 }}
          />
        </div>
        &nbsp;&nbsp;&nbsp;
        <div style={{display:'inline-block'}}>
          <Dropdown title={'.'+domain} trigger="click" onSelect={setDomain}>
            {Object.keys(domainNameList).map(v=><Dropdown.Item eventKey={v}>.{v}</Dropdown.Item>)}
          </Dropdown>
        </div>
      </div>
      <div style={centerStyle}>
        {
          tip &&
          <Message type={tip.status ? 'success' : 'error'}>
            {tip.result}
          </Message>
        }
      </div>
      <div style={centerStyle}>
        <Button
          disabled={disabled}
          onClick={onClickRegister}
          appearance='primary'
        >
          Register
        </Button>
      </div>
      
      <RegisterSteps 
        domain={domain}
        name={name}
        showModal={showSteps}
      />
    </>
  );
};