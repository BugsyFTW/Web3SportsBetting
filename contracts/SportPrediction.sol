// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ResultsConsumer } from "./ResultsConsumer.sol";
import { AutomationCompatibleInterface } from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/// Configuration parameters for initializing the contract
struct Config {
    address oracle; // The address of the Chainlink Function oracle
    uint64 subscriptionId; // The ID of the Chainlink Functions subscription
    bytes32 donId; // The ID of the Chainlink oracle network
    bytes secrets; // The secrets for the Chainlink Functions request
    string source; // The source code for the Chainlink Functions request
}

contract SportPrediction is ResultsConsumer, AutomationCompatibleInterface {

  uint256 private constant GAME_RESOLVE_DELAY = 5 minutes;

  // Mapping of the External ID's to game data
  mapping(uint256 => Game) private games;
  // Mapping of the user addresses to External ID's to predictions
  mapping(address => mapping(uint256 => Prediction[])) private predictions;
  // Mapping to store the index of each externalId in the activeGames array.
  mapping(uint256 => uint256) gameIndex;
  // Mapping of External IDs to Chainlink Functions request IDs
  mapping(uint256 => bytes32) private pendingRequests;

  // List of game ID's that have not been resolved
  uint256[] private activeGames;
  // List of game ID's that have been resolved
  uint256[] private resolvedGames;

  struct Game {
    uint256 externalId; // The ID of the game from the external api: Might need to change the type
    uint256 timestamp; // The timestamp of the game start time
    uint256 homeWagerAmount; // The total ammount of tokens wagared on the home team;
    uint256 awayWagerAmount; // The total ammount of tokens wagared on the away team;
    bool resolved; // Wether or no the game has finished and the result has been set
    Result result;
  }

  struct Prediction {
    uint256 externalId; // The ID of the game
    Result result; // The predicted result
    uint256 ammount; // the ammount of tokens wagered
    bool claimed; // Weather or not the winning have been claimed
  }

  enum Result {
    None, // The game has not been resolved or the result is a draw
    Home,
    Away
  }

  event Predicted(address indexed user, uint256 indexed externalId, Result result, uint256 amount);
  event GameRegistered(uint256 indexed externalId);
  event GameResolved(uint256 indexed externalId, Result result);
  event Claimed(address indexed user, uint256 indexed gameId, uint256 amount);

  error GameNotRegistered();
  error GameIsResolved();
  error GameAlreadyStarted();
  error InvalidResult();
  error GameAlreadyRegistered();
  error TimestampInPast();
  error ResolveAlreadyRequested();
  error GameNotReadyToResolve();
  error GameNotResolved();
  error NothingToClaim();

  constructor(
    Config memory config
  )
    ResultsConsumer(
        config.oracle,
        config.donId,
        config.subscriptionId,
        config.source,
        config.secrets
      )
  {}

  /// @notice Predict the result of a game with native tokens
  /// @dev The game must be registered, not resolved, and not started
  function predict(uint256 externalId, Result result) public payable {
    Game memory game = games[externalId];
    uint256 wagerAmount = msg.value;

    if (game.externalId == 0) revert GameNotRegistered();
    if (game.resolved) revert GameIsResolved();
    if (game.timestamp < block.timestamp) revert GameAlreadyStarted();

    if (result == Result.Home) games[externalId].homeWagerAmount += wagerAmount;
    else if (result == Result.Away) games[externalId].awayWagerAmount += wagerAmount;
    else revert InvalidResult();

    predictions[msg.sender][externalId].push(Prediction(externalId, result, wagerAmount, false));
    emit Predicted(msg.sender, externalId, result, wagerAmount);
  }

  /// @notice Register a game and predict the result in one transaction
  function registerAndPredict(uint256 externalId, uint256 timestamp, Result result) external payable {
    _registerGame(externalId, timestamp);
    predict(externalId, result);
  }

  /// @notice Claim the winnings for a match
  /// @dev Works for multiple predictions per user
  function claim(uint256 externalId) external {
    Game memory game = games[externalId];
    address user = msg.sender;

    if (!game.resolved) revert GameNotResolved();

    uint256 totalWinnings = 0;
    Prediction[] memory userPredictions = predictions[user][externalId];
    for (uint256 i = 0; i < userPredictions.length; i++) {
      Prediction memory prediction = userPredictions[i];
      // Skip if prediction has already been claimed
      if (prediction.claimed) continue;
      if (game.result == Result.None) {
        // For a draw, the user gets their tokens back
        totalWinnings += prediction.ammount;
      } else if (game.result == prediction.result) {
        uint256 winnings = calculateWinnings(externalId, prediction.ammount, prediction.result);
        totalWinnings += winnings;
      }
      predictions[user][externalId][i].claimed = true;
    }

    if (totalWinnings == 0) revert NothingToClaim();
    
    payable(user).transfer(totalWinnings);

    emit Claimed(user, externalId, totalWinnings);
  }

  /// --------------------------------------------------------------------------------- INTERNAL ------------------------------------------------------------------------------------  

  /// @notice Register a game in the contract
  function _registerGame(uint256 externalId, uint256 timestamp) internal {
    //Check if game can be registered
    if (games[externalId].externalId != 0) revert GameAlreadyRegistered();
    if (timestamp < block.timestamp) revert TimestampInPast();

    games[externalId] = Game(externalId, timestamp, 0, 0, false, Result.None);
    activeGames.push(externalId);
    gameIndex[externalId] = activeGames.length - 1;

    emit GameRegistered(externalId);
  }

  /// @notice Process the result of a game from an external Football API
  /// @dev Called back from the ResultsConsumer contract when the result is received
  function _processResult(uint256 externalId, bytes memory response) internal override {
    Result result = Result(uint256(bytes32(response)));
    _resolveGame(externalId, result);
  }

  /// @notice Resolve a game with a final result
  function _resolveGame(uint256 externalId, Result result) internal {
    games[externalId].result = result;
    games[externalId].resolved = true;

    resolvedGames.push(externalId);
    _removeFromActiveGames(externalId);
    
    emit GameResolved(externalId, result);
  }

  /// @notice Requests the result of a game from the external Football API
  /// @dev Uses Chainlink Functions via the ResultsConsumer contract
  function _requestResolve(uint256 externalId) internal {
    Game memory game = games[externalId];

    // Checking if game can be resolved
    if (pendingRequests[externalId] != 0) revert ResolveAlreadyRequested();
    if (game.externalId == 0) revert GameNotRegistered();
    if (game.resolved) revert GameIsResolved();
    if (!readyToBeResolved(externalId)) revert GameNotReadyToResolve();

    // Request the result of the game via ResultsConsumer contract
    // Store the Chainlink Functions request ID to prevent duplicate requests
    pendingRequests[externalId] = super._requestResult(game.externalId);
  }

  function _removeFromActiveGames(uint256 externalId) internal {
    uint256 index = gameIndex[externalId];
    uint256 lastGameId = activeGames[activeGames.length - 1];

    // Move the last element to the index of the element to delete
    activeGames[index] = lastGameId;
    gameIndex[lastGameId] = index;

    //Remove the last element
    activeGames.pop();

    //Delete the index entry for the removed element
    delete gameIndex[externalId];
  }

  /// @notice Get the data of a certain game
  function getGame(uint256 externalId) external view returns (Game memory) {
    return games[externalId];
  }

  /// @notice Get the data of the current active games
  function getActiveGames() public view returns(Game[] memory) {
    Game[] memory activeGamesArray = new Game[](activeGames.length);
    for (uint256 i = 0; i < activeGames.length; i++) {
      activeGamesArray[i] = games[activeGames[i]];
    }
    return activeGamesArray;
  }

  /// @notice Get the data of all user predictions for active games
  function getActivePredictions(address user) external view returns (Prediction[] memory) {
    uint256 userTotalPredictions = 0;
    for (uint256 i = 0; i < activeGames.length; i++) {
      userTotalPredictions += predictions[user][activeGames[i]].length;
    }
    uint256 index = 0;
    Prediction[] memory userPredictions = new Prediction[](userTotalPredictions);
    for (uint256 i = 0; i < activeGames.length; i++) {
      Prediction[] memory gamePredictions = predictions[user][activeGames[i]];
      for (uint256 j = 0; j < gamePredictions.length; j++) {
        userPredictions[index] = gamePredictions[j];
        index++;
      }
    }
    return userPredictions;
  }

  function readyToBeResolved(uint256 externalId) public view returns (bool) {
    return games[externalId].timestamp + GAME_RESOLVE_DELAY < block.timestamp;
  }

  function calculateWinnings(uint256 externalId, uint256 wager, Result result) public view returns (uint256) {
    Game memory game = games[externalId];
    uint256 totalWager = game.homeWagerAmount + game.awayWagerAmount;
    uint256 winnings = (wager + totalWager) / (result == Result.Home ? game.homeWagerAmount : game.awayWagerAmount);
    
    return winnings;
  }

  // ---------------------------------- CHAINLINK AUTOMATION -------------------------------------------------

  /// @notice Checks if any games are ready to be resovled
  function checkUpkeep(bytes memory) external view override returns (bool, bytes memory) {
    // Gets all current games that to be resolved
    Game[] memory activeGamesArray = getActiveGames();
    // Check if any game is ready to be resolved and have not already been requested
    for (uint256 i = 0; i < activeGamesArray.length; i++) {
      uint256 externalId = activeGamesArray[i].externalId;
      if (readyToBeResolved(externalId) && pendingRequests[externalId] == 0) {
        // Signal that a game is ready to be resolved to Chainlink Automation
        return (true, abi.encodePacked(externalId));
      }
    }
    return (false, "");
  }
  
  /// @notice Request the result of a game
  function performUpkeep(bytes calldata data) external override {
    uint256 externalId = abi.decode(data, (uint256));
    _requestResolve(externalId);
  }
}
