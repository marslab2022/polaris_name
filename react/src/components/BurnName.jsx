import React from 'react';
import { Modal, ButtonToolbar, Button, RadioGroup, Radio, Placeholder } from 'rsuite';
import { burn } from '../lib/api';
import { SubmitButton } from './SubmitButton/SubmitButton';

const styles = {
  radioGroupLabel: {
    padding: '8px 12px',
    display: 'inline-block',
    verticalAlign: 'middle'
  }
};

export const BurnName = (props) => {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);

  React.useEffect(()=>{
    setOpen(props.showModal);
  }, [props.showModal]);

  const OnBurnName = async () => {
    const ret = await burn(props.domain, props.name);

    if (ret.status) {
      handleClose();
    }

    return ret;
  };

  return (
    <>
      <Modal backdrop={true} open={open} onClose={handleClose}>
        <Modal.Header>
          <Modal.Title>Burn Name Confirmation</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Please confirm burning '{`${props.name}.${props.domain}`}' !
        </Modal.Body>
        <Modal.Footer>
          <SubmitButton 
            buttonText='Ok'
            submitTask={OnBurnName}
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