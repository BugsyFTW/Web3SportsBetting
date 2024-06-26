import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

import { SportPrediction__factory, SportPrediction, LinkTokenTestHelper__factory, LinkTokenTestHelper, MockFunctionsOracle__factory, MockFunctionsOracle } from "../typechain-types";

const Result = {
  None: 0,
  Home: 1,
  Away: 2,
}

describe("SportPrediction Unit Test", async function () {

  const externalId = 1;
  const startTimeDelay = 100
  const result = Result.Home;
  const wager = ethers.parseEther("0.1");
  const resolveDelay = 5 * 60;
  const delay = startTimeDelay + resolveDelay;

  let owner: Signer;
  let latestBlockTime;
  let startTime: number;

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

    it("should not be able to predict a resolved game", async () => {
      await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });
      await resolveGame(sportPrediction, mockFunctionsOracle, externalId, result, delay)

      await expect(
        sportPrediction.predict(externalId, result, { value: wager })
      ).to.be.revertedWithCustomError(sportPrediction, "GameIsResolved");
    });

    it("should not be able to predict a game that already started", async () => {
      await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });
      await time.increase(100);
      await expect(
        sportPrediction.predict(externalId, result, { value: wager })
      ).to.be.revertedWithCustomError(sportPrediction, "GameAlreadyStarted");
    });

    it("should revert if result isn't Home or Away", async () => {
      await expect(
        sportPrediction.registerAndPredict(externalId, startTime, Result.None, { value: wager })
      ).to.be.revertedWithCustomError(sportPrediction, "InvalidResult");
    });

    it("should revert if value is 0", async () => {
      await expect(
        sportPrediction.registerAndPredict(externalId, startTime, result, { value: 0 })
      ).to.be.revertedWithCustomError(sportPrediction, "InsufficientValue");
    });

    it("should register a prediction", async () => {
      await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });

      const userPredictions = await sportPrediction.getActivePredictions(owner.getAddress());
      expect(userPredictions.length).to.equal(1);
      expect(userPredictions[0].result).to.equal(result);
      expect(userPredictions[0].ammount).to.equal(wager);
      expect(userPredictions[0].claimed).to.equal(false);

      const game = await sportPrediction.getGame(externalId);
      expect(game.homeWagerAmount).to.equal(wager);
    });

    it("should check if prediction is correct", async () => {
      await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });
      await sportPrediction.predict(externalId, Result.Away, { value: wager });

      await resolveGame(sportPrediction, mockFunctionsOracle, externalId, result, delay);

      expect(await sportPrediction.isPredictionCorrect(owner.getAddress(), externalId, 0)).to.equal(true);
      expect(await sportPrediction.isPredictionCorrect(owner.getAddress(), externalId, 1)).to.equal(false);
    });

    it("should get past predictions when game is resolved", async () => {
      await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });
      await resolveGame(sportPrediction, mockFunctionsOracle, externalId, result, delay);

      const pastPredictions = await sportPrediction.getPastPredictions(owner.getAddress());
      expect(pastPredictions.length).to.equal(1);
      expect(pastPredictions[0].result).to.equal(result);
      expect(pastPredictions[0].ammount).to.equal(wager);
      expect(pastPredictions[0].claimed).to.equal(false);
    });

    it("should emit Predicted event", async () => {
      await expect(
        sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager })
      ).to.be.emit(sportPrediction, "Predicted");
    });
  });

  describe("Automation", () => {
    describe("checkUpkeep", () => {
      it("should return false if there are no active games to resolve", async () => {
        const [upkeepNeeded, performData] = await sportPrediction.checkUpkeep(ethers.ZeroHash);
        
        expect(upkeepNeeded).to.equal(false);
        expect(performData).to.equal("0x");
      });
      
      it("should return true if there are games to be resolved", async () => {
        await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });
  
        await time.increase(delay);
  
        const [upkeepNeeded, performData] = await sportPrediction.checkUpkeep(ethers.ZeroHash);
        
        expect(upkeepNeeded).to.equal(true);
        expect(performData).to.equal(ethers.zeroPadValue(ethers.hexlify(new Uint8Array([externalId])), 32));
      });
    });

    describe("performUpkeep", () => {
      it("should request game from oracle", async () => {
        await sportPrediction.registerAndPredict(externalId, startTime, result, { value: wager });

        await time.increase(delay);
        const performData = ethers.zeroPadValue(ethers.hexlify(new Uint8Array([externalId])), 32);
        
        await expect(
          sportPrediction.performUpkeep(performData)
        ).to.emit(sportPrediction, "RequestedResult").withArgs(externalId, ethers.ZeroHash);
      });
    });
  });
});

async function resolveGame(contract: SportPrediction, oracleContract: MockFunctionsOracle, externalId: number, result: number, delay: number) {
  await time.increase(delay);

  const performanceData = ethers.zeroPadValue(ethers.hexlify(new Uint8Array([externalId])), 32);
  await contract.performUpkeep(performanceData);

  const client = contract.getAddress();
  const requestId = ethers.ZeroHash;
  const data = ethers.zeroPadValue(ethers.hexlify(new Uint8Array([result])), 32);

  return oracleContract.fulfillRequest(client, requestId, data);
}