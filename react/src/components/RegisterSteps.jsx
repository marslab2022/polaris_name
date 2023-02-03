import React from 'react';
import { Message, Steps, Modal, Button } from 'rsuite';
import { deployNFT, mint } from '../lib/api';
import { SubmitButton } from './SubmitButton/SubmitButton';

const centerStyle = {
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center',
  margin: '3rem'
};

export const RegisterSteps = (props) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [nftAddress, setNftAddress] = React.useState();
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);

  React.useEffect(()=>{
    setOpen(props.showModal);
  }, [props.showModal]);

  const renderMint = () => {
    const onMint = async () => {
      const deployNFTRet = await deployNFT(props.domain, props.name);
      if (deployNFTRet.status === false) {
        return deployNFTRet;
      }
      setNftAddress(deployNFTRet.result);
      setCurrentStep(1);
      return {status: true, result: 'Atomic NFT deploy to Arweave network succeeded!'};
    };

    return (
      <>
        <SubmitButton 
          buttonText='Mint Atomic NFT'
          submitTask={onMint}
        />
      </>
    );
  };

  const renderBind = () => {
    const onBind = async () => {
      const bindRet = await mint(nftAddress, props.name);
      if (bindRet.status === false) {
        return bindRet;
      }
      setCurrentStep(2);
      return {status: true, result: 'Bind to Polaris succeeded!'};
    };
    
    return (
      <>
        <SubmitButton 
          buttonText='Bind To Polaris'
          submitTask={onBind}
        />
      </>
    );
  };

  const renderFinish = () => {
    return (
      <>
        <Message type='success'>
          Now you can head to [Manage] tab to manage your Polaris name.
        </Message>
      </>
    );
  };

  return (
    <>
      <Modal backdrop={true} open={open} onClose={handleClose}>
        <Modal.Header>
          <Modal.Title>Register {`${props.name}.${props.domain}`}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Steps current={currentStep} small style={centerStyle}>
            <Steps.Item title='Mint NFT' />
            <Steps.Item title='Bind to Polaris' />
            <Steps.Item title='Finish' />
          </Steps>
          { currentStep === 0 && renderMint() }
          { currentStep === 1 && renderBind() }
          { currentStep === 2 && renderFinish() }
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} appearance="subtle">
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};