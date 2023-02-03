import React from 'react';
import { Container, Content, Footer, Header, Radio, RadioGroup, Divider } from 'rsuite';
import BackIcon from '@rsuite/icons/legacy/Left';
import { Register } from './Register';
import { Manage } from './Manage';

const radioType = {fontSize: '1.2rem', color: 'white'};

export const My = (props) => {
  const [tab, setTab] = React.useState('register');

  React.useEffect(async () => {
  }, []);

  const renderTab = () => {
    switch (tab) {
      case 'register':
        return (<Register />);
      case 'manage':
        return (<Manage />);
      default:
        return ('Error');
    }
  }

  return (
    <Container>
      <Header>
        <span onClick={()=>{window.location.href=`#`}} style={{cursor: 'pointer'}}>
          {React.cloneElement(<BackIcon />, {
            style: {
              fontSize: '1.5rem',
            }
          })}
        </span>
        &nbsp;&nbsp;&nbsp;&nbsp;
        My
      </Header>
      <Container>
        <Content>
          <RadioGroup 
            inline 
            name='type'
            appearance='picker'
            defaultValue='register'
            onChange={setTab}
            style={{borderWidth: 0, margin: '1rem', justifyContent: 'center', alignItems: 'center', display: 'flex'}}
          >
            <Radio value='register'><p style={radioType}>Register</p></Radio>
            <Radio value='manage'><p style={radioType}>Manage</p></Radio>
          </RadioGroup>
          {renderTab()}
        </Content>
      </Container>
      <Footer><p style={{textAlign: 'center',  fontSize: '1rem'}}>©️ 2023 mARsLab</p></Footer>
    </Container>
  );
};