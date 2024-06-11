import { useWeb3Modal, useWeb3ModalAccount } from "@web3modal/ethers/react";

import { Button } from "@components/ui/button";

export function ConnectButton() {

  const { open } = useWeb3Modal();
  const { isConnected } = useWeb3ModalAccount();

  return (
    <>
      {
        isConnected ?
          <w3m-account-button />
          :
          <Button onClick={() => open({ view: 'Connect' })}>Connect Wallet</Button>
      }
    </>
  );
}