import React from 'react';
import { ButtonGroup, Button, Whisper, Popover, Dropdown, IconButton, Input, Tooltip } from 'rsuite';
import ArrowDownIcon from '@rsuite/icons/ArrowDown';
import QuestionIcon from '@rsuite/icons/legacy/QuestionCircle2';
import { getDomainNames } from '../lib/api';
import { PageLoading } from './PageLoading/PageLoading';
import { BurnName } from './BurnName';
import { EditName } from './EditName';

const centerStyle = {
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center',
  margin: '2rem'
};

const options = ['Edit Name', 'Burn Name'];


export const Manage = (props) => {
  const [domain, setDomain] = React.useState('page');
  const [name, setName] = React.useState('');
  const [domainNameList, setDomainNameList] = React.useState();
  const [action, setAction] = React.useState(0);
  const [showBurnName, setShowBurnName] = React.useState(false);
  const [showEditName, setShowEditName] = React.useState(false);

  const fetchDomainNames = async () => {
    const domainNamesRet = await getDomainNames();
    console.log(domainNamesRet);
    if (domainNamesRet.status === false) {
      return domainNamesRet;
    }
    setDomainNameList(domainNamesRet.result);
    return {status: true, result: 'Fetch info secceeded!'};
  };

  const onClickButton = async () => {
    switch (action) {
      case 0:
        await setShowEditName(false);
        setShowEditName(true);
        break;
      case 1:
        await setShowBurnName(false);
        setShowBurnName(true);
      default:
        break;
    }
  }

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
            onChange={setName}
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
        <ButtonGroup>
          <Button appearance="primary" onClick={onClickButton}>{options[action]}</Button>
          <Whisper
            placement="bottomEnd"
            trigger="click"
            speaker={({ onClose, left, top, className }, ref) => {
              const handleSelect = eventKey => {
                onClose();
                setAction(eventKey);
              };
              return (
                <Popover ref={ref} className={className} style={{ left, top }} full>
                  <Dropdown.Menu onSelect={handleSelect}>
                    {options.map((item, index) => (
                      <Dropdown.Item key={index} eventKey={index}>
                        {item}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Popover>
              );
            }}
          >
            <IconButton appearance="primary" icon={<ArrowDownIcon />} />
          </Whisper>
        </ButtonGroup>
        &nbsp;&nbsp;&nbsp;
        <Whisper 
          speaker={
            <Tooltip>{
              action === 0 ? 
              'Edit Name: Set/Reset target wallet(transaction, token, nft ...) address.' :
              'Burn Name: Will burn the Polaris name and refund Polaris Name Token($PNT).'
            }</Tooltip>
          }
          placement="auto"
          trigger="click"
        >
          <QuestionIcon />
        </Whisper>
      </div>
      <BurnName 
        showModal={showBurnName}
        domain={domain}
        name={name}
      />
      <EditName 
        showModal={showEditName}
        domain={domain}
        name={name}
      />
    </>
  );
};