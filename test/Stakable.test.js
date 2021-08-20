const DevToken = artifacts.require("DevToken");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");
require("chai").use(require("chai-as-promised")).should();

contract("DevToken", async (accounts) => {
  let devToken;
  before(async () => {
    devToken = await DevToken.deployed();
  });
  it("Staking 100x2", async () => {
    // Stake 100 is used to stake 100 tokens twice and see that stake is added correctly
    // and money burned
    let owner = accounts[0];
    let stake_amount = 100;
    await devToken.mint(accounts[1], 1000);
    let balance = await devToken.balanceOf(owner);
    let stakeID = await devToken.stake(stake_amount, { from: owner });

    // Assert on the emmited event using truffleAssert
    // This will capture the event and inside the event callback we can
    // use assert on the values returned
    truffleAssert.eventEmitted(
      stakeID,
      "Staked",
      (ev) => {
        let amount = new BigNumber(ev.amount.toString());
        let index = new BigNumber(ev.index.toString());

        assert.equal(
          amount.toString(),
          stake_amount.toString(),
          "Stake amount in event was not correct"
        );
        assert.equal(index.toString(), "1", "Stake index was not correct");
        return true;
      },
      "Stake event should have triggered"
    );

    // stake again
    stakeID = await devToken.stake(stake_amount, { from: owner });
    truffleAssert.eventEmitted(stakeID, "Staked", (ev) => {
      let amount = new BigNumber(ev.amount.toString());
      let index = new BigNumber(ev.index.toString());
      assert.equal(
        amount.toString(),
        stake_amount.toString(),
        "Stake amount in event was not correct"
      );
      assert.equal(index.toString(), "1", "Stake index was not correct");
      return true;
    });
  });

  it("cannot stake more than owning", async () => {
    try {
      await devToken.stake(1000000000, { from: accounts[2] });
    } catch (error) {
      assert.equal(error.reason, "DevToken: Cannot stake more than you own");
    }
  });

  it("new stakeholder should have increased index", async () => {
    let stake_amount = 100;
    stakeID = await devToken.stake(stake_amount, { from: accounts[1] });
    truffleAssert.eventEmitted(stakeID, "Staked", (ev) => {
      let amount = new BigNumber(ev.amount.toString());
      let index = new BigNumber(ev.index.toString());
      assert.equal(
        stake_amount.toString(),
        amount.toString(),
        "Stake amount in the event was not correct"
      );
      assert.equal(index.toString(), "2", "Stake index was not correct");
    });
  });
});
