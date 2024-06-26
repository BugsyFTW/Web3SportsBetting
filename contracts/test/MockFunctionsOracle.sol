// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IFunctionsClient } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsClient.sol";

contract MockFunctionsOracle {

  function sendRequest(uint64, bytes calldata, uint16, uint32, bytes32) external pure returns (bytes32) {
    return bytes32(0);
  }

  function fulfillRequest(address client, bytes32 requestId, bytes calldata data) external {
    IFunctionsClient(client).handleOracleFulfillment(requestId, data, "");
  }
}