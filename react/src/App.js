import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { 
  connectContract, 
} from './lib/api';
import 'rsuite/dist/rsuite.css';
import './App.css';
import { Home } from './components/Home';
import { sleep } from 'warp-contracts';
import { My } from './components/My';
import { LinkJumper } from './components/LinkJumper';

const App = () => {
  const [isContractConnected, setIsContractConnected] = React.useState(false);
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);

  React.useEffect(async ()=>{
    await connectContract();
    await sleep(3000);
    setIsContractConnected(true);
  }, []);

  if (!isContractConnected) {
    return (
      <div className='darkRow'>
        Loading Contract ...
      </div>
    );
  }
  return (
    <div id="app">
      <div id="content">
        <Navigation setIsWalletConnected={setIsWalletConnected}/>
        <main>
          <Routes>
            <Route path="/" name="" element={<HomeFrame />} />
            <Route path="/my" element={<MyFrame walletConnect={isWalletConnected}/>} />
            <Route path="/:domain/:name" element={<LinkJumper />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const HomeFrame = (props) => {
  return (
    <>
      <Home />
    </>
  );
};

const MyFrame = (props) => {
  return (
    <>
      <My walletConnect={props.walletConnect}/>
    </>
  );
};

export default App;