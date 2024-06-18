// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { FunctionsClient } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import { FunctionsRequest } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

abstract contract ResultsConsumer is FunctionsClient {
  using FunctionsRequest for FunctionsRequest.Request;

  /// @notice The gas limit for the sports API request callback
  uint32 private constant GAS_LIMIT = 250000;

  // The source code for API request
  string private source;
  // The secrets used in the API request
  bytes private secrets;
  // The subscription id for the Chainlink function
  uint64 private subscriptionId;
  // The ID of the Chainlink oracle network;
  bytes32 public donId;

  mapping(bytes32 => PendingRequest) private pending;

  struct PendingRequest {
    uint256 sportId;
    uint256 externalId;
  }

  event RequestedResult(uint256 sportId, uint256 externalId, bytes32 requestId);
  event ResultReceived(bytes32 requestId, bytes response);
  event RequestFailed(bytes response);  
  event NoPendingRequest();

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

  /// @notice Requests a sports result
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @return requestId The Chainlink Functions request ID
  function _requestResult(uint256 sportId, uint256 externalId) internal returns (bytes32 requestId) {
    // Prepare the arguments for the Chainlink Functions request
    string[] memory args = new string[](2);
    args[0] = Strings.toString(sportId);
    args[1] = Strings.toString(externalId);
    // Send the Chainlink Functions request
    requestId = _sendRequest(args);

    // Store the request and the associated data for the callback
    pending[requestId] = PendingRequest({sportId: sportId, externalId: externalId});
    emit RequestedResult(sportId, externalId, requestId);
  }

  /// @notice Sends a Chainlink Functions request
  /// @param args The arguments for the Chainlink Functions request
  /// @return requestId The Chainlink Functions request ID
  function _sendRequest(string[] memory args) internal returns (bytes32 requestId) {
    FunctionsRequest.Request memory request;
    request.initializeRequest(FunctionsRequest.Location.Inline, FunctionsRequest.CodeLanguage.JavaScript, source);
    if (secrets.length > 0) {
      request.addSecretsReference(secrets);
    }
    if (args.length > 0) request.setArgs(args);

    requestId = _sendRequest(request.encodeCBOR(), subscriptionId, GAS_LIMIT, donId);
  }

  /// @notice Processes the result of a sports API request
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @param response The response from the Chainlink Functions request
  /// @dev This function must be implemented by the child contract
  function _processResult(uint256 sportId, uint256 externalId, bytes memory response) internal virtual;

  /// @notice Receives the response to a Chainlink Functions request
  /// @param requestId The Chainlink Functions request ID
  /// @param response The response from the Chainlink Functions request
  /// @param err The error from the Chainlink Functions request
  /// @dev This function is called by the oracle
  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    PendingRequest memory request = pending[requestId];
    // Check if there is a sent request
    if (request.sportId == 0) {
      emit NoPendingRequest();
      return;
    }
    delete pending[requestId];
    // Check if the Functions script failed
    if (err.length > 0) {
      emit RequestFailed(err);
      return;
    }
    emit ResultReceived(requestId, response);

    // Call the child contract to process the result
    _processResult(request.sportId, request.externalId, response);
  }
}