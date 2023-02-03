import React from 'react';
import { AutoComplete, Dropdown } from 'rsuite';
import { getDomainNames, isWellFormattedAddress } from '../lib/api';
import { PageLoading } from './PageLoading/PageLoading';
import { SubmitButton } from './SubmitButton/SubmitButton';
import HomePageLogo from './HomepageLogo.png';

const centerStyle = {
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center',
  margin: '2rem'
};

export const Home = (props) => {
  const [domain, setDomain] = React.useState('page');
  const [name, setName] = React.useState('');
  const [domainNameList, setDomainNameList] = React.useState();
  
  const fetchDomainNames = async () => {
    const domainNamesRet = await getDomainNames();
    console.log(domainNamesRet);
    if (domainNamesRet.status === false) {
      return domainNamesRet;
    }
    setDomainNameList(domainNamesRet.result);
    return {status: true, result: 'Fetch info secceeded!'};
  };

  const onClickEnter = async () => {
    if (!isWellFormattedAddress(domainNameList[domain][name])) {
      return {status: false, result: `${name}.${domain} not registered or link not set!`};
    }

    window.location.href = `/#/${domain}/${name}`;
    return {status: true, result: `Redirecting to ${name}.${domain} ...`};
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
        <img 
          style={{height: 60}}
          src={HomePageLogo} 
          alt={<p style={{fontSize: '3rem', color: 'white', fontFamily: 'Georgia'}}>Pøl<span style={{color: 'red'}}>@</span>ris</p>}
        />
      </div>
      <div style={centerStyle}>
        <div style={{display:'inline-block'}}>
          <AutoComplete
            data={Object.keys(domainNameList[domain])}
            onChange={setName}
            style={{ width: 300 }}
            renderMenuItem={item => {return (<div>{item}</div>);}}
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
        <SubmitButton 
          buttonText='Enter'
          submitTask={onClickEnter}
        />
      </div>
    </>
  );
};