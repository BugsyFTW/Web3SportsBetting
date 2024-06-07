// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { FunctionsClient } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import { FunctionsRequest } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

abstract contract ResultsConsumer is FunctionsClient {
  using FunctionsRequest for FunctionsRequest.Request;

  // The source code for API request
  string private source;
  // The secrets used in the API request
  bytes private secrets;
  // The subscription id for the Chainlink function
  uint64 private subscriptionId;
  // The ID of the Chainlink oracle network;
  bytes32 public donId;

  constructor(
    address _oracle,
    bytes32 _donId,
    uint64 _subscriptionId,
    string memory _source,
    bytes memory _secrets
  ) FunctionsClient(_oracle) {
    donId = _donId;
    subscriptionId = _subscriptionId;
    source = _source;
    secrets = _secrets;
  }

  // TODO

  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {}
}