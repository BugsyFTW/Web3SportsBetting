import { ThemeProvider } from "@components/theme-provider";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";

import { Navbar } from "./components/navbar"; "@components/navbar";
import { GameList } from "@components/game-list";

const projectId = '557a8ff268dfaf2fc232c9bb81c11e47';

// 2. Set chains
/*const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
} */

const arbitrumSepolia = {
  chainId: 421614,
  name: 'Arbitrum Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia-explorer.arbitrum.io',
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc'
}

// 3. Create a metadata object
const metadata = {
  name: 'Web3SportsBetting',
  description: 'Web3Modal Example',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,
});

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [arbitrumSepolia],
  projectId,
});

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="wb3sptsbt">
      <Navbar />
      <GameList matchday={1} />
    </ThemeProvider>
  );
}

export default App;
