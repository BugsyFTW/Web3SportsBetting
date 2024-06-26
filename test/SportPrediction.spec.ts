import { ethers } from "hardhat";
import { BigNumberish } from "ethers";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

import { SportPrediction__factory, SportPrediction, LinkTokenTestHelper__factory, LinkTokenTestHelper, MockFunctionsOracle__factory, MockFunctionsOracle } from "../typechain-types";

describe("SportPrediction Unit Test", async function () {

  const externalId = 1;
  const startTimeDelay = 100
  const result = 1;
  const wager = ethers.parseEther("0.1");

  let owner;
  let latestBlockTime;
  let startTime: BigNumberish;

  let sportPrediction: SportPrediction;
  let mockFunctionsOracle: MockFunctionsOracle;
  let linkToken: LinkTokenTestHelper;

  let sportPredictionFactory: SportPrediction__factory;
  let mockFunctionsOracleFactory: MockFunctionsOracle__factory;
  let linkTokenFactory: LinkTokenTestHelper__factory;

  before(async function () {
    [owner] = await ethers.getSigners()

    sportPredictionFactory = await ethers.getContractFactory("SportPrediction");
    mockFunctionsOracleFactory = await ethers.getContractFactory("MockFunctionsOracle");
    linkTokenFactory = await ethers.getContractFactory("LinkTokenTestHelper");
  });

  beforeEach(async function () {

    mockFunctionsOracle = await mockFunctionsOracleFactory.deploy();
    linkToken = await linkTokenFactory.deploy();

    sportPrediction = await sportPredictionFactory.deploy({
      oracle: mockFunctionsOracle.getAddress(),
      donId: ethers.zeroPadBytes(ethers.hexlify("0x123456"), 32),
      subscriptionId: 123,
      secrets: ethers.ZeroHash,
      source: "...",
    });

    await linkToken.transfer(sportPrediction.getAddress(), ethers.parseEther("100"));

    latestBlockTime = await time.latest();
    startTime = latestBlockTime + startTimeDelay;
  });

  describe("Register", () => {
    it("should not be able to register games twice", async () => {
      await sportPrediction.registerAndPredict(externalId, startTime, result, {
        value: wager
      });
      await expect(
        sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager })
      ).to.be.revertedWithCustomError(sportPrediction, "GameAlreadyRegistered");
    });

    it("should not be able to register game with start time in the past", async () => {
      await expect(
        sportPrediction.registerAndPredict(externalId, 0, result, { value: wager })
      ).to.be.revertedWithCustomError(sportPrediction, "TimestampInPast");
    });
    
    it("should register game", async () => {
      await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });

      const game = await sportPrediction.getGame(externalId);
      expect(game.externalId).to.equal(externalId);
      expect(game.timestamp).to.equal(startTime)
      expect(game.homeWagerAmount).to.equal(wager)
      expect(game.awayWagerAmount).to.equal(0)
      expect(game.resolved).to.equal(false)
      expect(game.result).to.equal(0)
    });

    it("should add game to active games", async () => {
      await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });

      const activeGames = await sportPrediction.getActiveGames();
      expect(activeGames.length).to.equal(1);
    });

    it("should emit GameRegistered event", async () => {
      await expect(
        sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager })
      ).to.emit(sportPrediction, "GameRegistered");
    });
  });

  describe("Predict", () => {
    it("should not be able to predict on a registered game", async () => {
      await expect(
        sportPrediction.predict(0, result)
      ).to.be.revertedWithCustomError(sportPrediction, "GameNotRegistered");
    });
  });
});