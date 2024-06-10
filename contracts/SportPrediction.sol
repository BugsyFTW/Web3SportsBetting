// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ResultsConsumer } from "./ResultsConsumer.sol";

/// Configuration parameters for initializing the contract
struct Config {
    address oracle; // The address of the Chainlink Function oracle
    uint64 subscriptionId; // The ID of the Chainlink Functions subscription
    bytes32 donId; // The ID of the Chainlink oracle network
    bytes secrets; // The secrets for the Chainlink Functions request
    string source; // The source code for the Chainlink Functions request
}

contract SportPrediction is ResultsConsumer {

  // Mapping of the game ID's to game data
  mapping(uint256 => Game) private games;
  // Mapping of the user addresses to game ID's to predictions
  mapping(address => mapping(uint256 => Prediction[])) private predictions;

  // List of game ID's that have not been resolved
  uint256[] private activeGames;
  // List of game ID's that have been resolved
  uint256[] private resolvedGames;

  struct Game {
    uint256 sportId;
    uint256 externalId; // The ID of the game from the external api: Might need to change the type
    uint256 timestamp; // The timestamp of the game start time
    uint256 homeWagerAmmount; // The total ammount of tokens wagared on the home team;
    uint256 awayWagerAmmout; // The total ammount of tokens wagared on the away team;
    bool resolved; // Wether or no the game has finished and the result has been set
    Result result;
  }

  struct Prediction {
    uint256 gameId; // The ID of the game
    Result result; // The predicted result
    uint256 ammount; // the ammount of tokens wagered
    bool claimed; // Weather or not the winning have been claimed
  }

  enum Result {
    None, // The game has not been resolved or the result is a draw
    Home,
    Away
  }

  event Predicted(address indexed user, uint256 indexed gameId, Result result, uint256 amount);
  event GameRegistered(uint256 indexed gameId);

  error GameNotRegistered();
  error GameIsResolved();
  error GameAlreadyStarted();
  error InvalidResult();
  error GameAlreadyRegistered();
  error TimestampInPast();

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

  /// Predict the result of a game with native tokens
  /// gameId The ID of the game
  /// result The predicted result
  /// The game must be registered, not resolved, and not started
  function predict(uint256 gameId, Result result) public payable {
    Game memory game = games[gameId];
    uint256 wagerAmount = msg.value;

    if (game.externalId == 0) revert GameNotRegistered();
    if (game.resolved) revert GameIsResolved();
    if (game.timestamp < block.timestamp) revert GameAlreadyStarted();

    if (result == Result.Home) games[gameId].homeWagerAmmount += wagerAmount;
    else if (result == Result.Away) games[gameId].awayWagerAmmout += wagerAmount;
    else revert InvalidResult();

    predictions[msg.sender][gameId].push(Prediction(gameId, result, wagerAmount, false));
    emit Predicted(msg.sender, gameId, result, wagerAmount);
  }

  function _registerGame(uint256 sportId, uint256 externalId, uint256 timestamp) internal returns(uint256 gameId) {
    gameId = getGameId(sportId, externalId);

    //Check if game can be registered
    if (games[gameId].externalId != 0) revert GameAlreadyRegistered();
    if (timestamp < block.timestamp) revert TimestampInPast();

    games[gameId] = Game(sportId, externalId, timestamp, 0, 0, false, Result.None);
    activeGames.push(gameId);

    emit GameRegistered(gameId);
  }

  /// Get the ID of a game used in the contract
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @return gameId The ID of the game used in the contract
  /// The game ID is a unique number combining of the sport ID and the external ID
  function getGameId(uint256 sportId, uint256 externalId) public pure returns(uint256) {
    return (sportId << 128) | externalId;
  }
}
