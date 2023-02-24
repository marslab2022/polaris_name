import React from 'react';
import { Modal, ButtonToolbar, Button, RadioGroup, Radio, Placeholder, Input } from 'rsuite';
import { getTarget, link, unlink } from '../lib/api';
import { SubmitButton } from './SubmitButton/SubmitButton';

const styles = {
  radioGroupLabel: {
    padding: '8px 12px',
    display: 'inline-block',
    verticalAlign: 'middle'
  }
};

export const EditName = (props) => {
  const [open, setOpen] = React.useState(false);
  const [currentTarget, setCurrentTarget] = React.useState();
  const handleClose = () => setOpen(false);

  React.useEffect(async ()=>{
    const target = await getTarget(props.domain, props.name);
    if (!target.status) return;
    setCurrentTarget(target.result);
  }, []);

  React.useEffect(()=>{
    setOpen(props.showModal);
  }, [props.showModal]);

  const renderPlaceHolder = () => {
    switch (props.domain) {
      case 'page':
        return 'transaction ID of your page';
      case 'ar':
        return 'Arweave wallet address';
      default:
        return 'transaction ID';
    }
  };

  const OnSetTarget = async () => {
    var ret;
    if (currentTarget === '' || currentTarget === undefined || currentTarget === null) {
      ret = await unlink(props.domain, props.name);
    } else {
      ret = await link(props.domain, props.name, currentTarget);
    }

    if (ret.status) {
      handleClose();
    }

    return ret;
  };

  return (
    <>
      <Modal backdrop={true} open={open} onClose={handleClose}>
        <Modal.Header>
          <Modal.Title>Edit {`${props.name}.${props.domain}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Input 
            placeholder={`Enter the ${renderPlaceHolder()} or leave blank to reset`} 
            value={currentTarget}
            onChange={setCurrentTarget}
          />
        </Modal.Body>
        <Modal.Footer>
          <SubmitButton 
            buttonText='Ok'
            submitTask={OnSetTarget}
            defaultType={true}
          />
          <Button onClick={handleClose} appearance="subtle">
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};