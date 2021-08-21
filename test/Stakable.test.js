const helper = require("./helpers/truffleTestHelpers");
const DevToken = artifacts.require("DevToken");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");
require("chai").use(require("chai-as-promised")).should();

contract("Stakable", async (accounts) => {
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
    truffleAssert.eventEmitted(
      stakeID,
      "Staked",
      (ev) => {
        let amount = new BigNumber(ev.amount.toString());
        let index = new BigNumber(ev.index.toString());
        assert.equal(
          stake_amount.toString(),
          amount.toString(),
          "Stake amount in the event was not correct"
        );
        assert.equal(index.toString(), "2", "Stake index was not correct");
        return true;
      },
      "Stake event should have triggered"
    );
  });

  it("withdraw 50 from a stake", async () => {
    let owner = accounts[0];
    let withdraw_amount = 50;
    // try withdrawing 50 from first stake
    await devToken.withdrawStake(withdraw_amount, 0, { from: owner });
    // Grab a new summary to see if the total amount has changed
    let summary = await devToken.hasStake(owner);
    let total_amount = new BigNumber(summary.total_amount.toString());
    assert.equal(
      total_amount.toString(),
      (200 - withdraw_amount).toString(),
      "The total staking amount should be 150"
    );
    // Iterate all stakes and verify their amount aswell
    let stake_amount = summary.stakes[0].amount;
    assert.equal(
      stake_amount,
      100 - withdraw_amount,
      "Wrong Amount in the first stake after withdrawl"
    );
  });

  it("remove stake if empty", async () => {
    let owner = accounts[0];
    let withdraw_amount = 50;
    await devToken.withdrawStake(withdraw_amount, 0, { from: owner });
    let summary = await devToken.hasStake(owner);
    // console.log(summary);
    assert.equal(
      summary.stakes[0].user,
      "0x0000000000000000000000000000000000000000",
      "Failed to remove stake when it was empty"
    );
  });

  it("cannot withdraw bigger amount than the stake", async () => {
    let owner = accounts[0];
    // try withdrawing 200 from first stake
    try {
      await devToken.withdrawStake(200, 0, { from: owner });
    } catch (error) {
      assert.equal(
        error.reason,
        "Staking: Cannot withdraw more than you have staked",
        "Failed to notice withdrawl from stake that was larger than available"
      );
    }
  });

  it("calculate rewards", async () => {
    let owner = accounts[0];
    const newBlock = await helper.advanceTimeAndBlock(3600 * 20);
    let summary = await devToken.hasStake(owner);

    let stake = summary.stakes[1];
    let claimable = new BigNumber(stake.claimable.toString());
    assert.equal(
      claimable.toString(),
      100 * 0.02,
      "reward should be 2 after staking for 20 hours with 100 tokens staked"
    );
    await devToken.stake(1000, { from: owner });
    await helper.advanceTimeAndBlock(3600 * 20);

    summary = await devToken.hasStake(owner);

    stake = summary.stakes[1];
    claimable = new BigNumber(stake.claimable.toString());
    let newStake = summary.stakes[2];
    let newClaimable = new BigNumber(newStake.claimable.toString());
    assert.equal(
      claimable.toString(),
      (100 * 0.04).toString(),
      "Reward should be 4 after staking for 40 hours"
    );
    assert.equal(
      newClaimable.toString(),
      (1000 * 0.02).toString(),
      "Reward should be 20 after staking 20 hours"
    );
  });

  it("reward stakes", async () => {
    let staker = accounts[3];
    await devToken.mint(accounts[3], 1000);
    let initial_balance = await devToken.balanceOf(staker);
    // make a stake of 200, fast forward 20 hours, claim reward,
    // amount should be initial balance + 4
    await devToken.stake(200, { from: staker });
    await helper.advanceTimeAndBlock(3600 * 20);

    let stakeSummary = await devToken.hasStake(staker);
    let stake = stakeSummary.stakes[0];
    // Withdraw 100 from stake at index 0;
    await devToken.withdrawStake(100, 0, { from: staker });
    // after balance should be 104
    let after_balance = await devToken.balanceOf(staker);
    let expected = 1000 - 200 + 100 + Number(stake.claimable);

    assert.equal(
      after_balance.toNumber(),
      expected,
      "Failed to withdraw the stake correctly"
    );

    // withdrawing the remaining 100 should not return any rewards
    // as the timer should have reset
    try {
      await devToken.withdrawStake(100, 0, { from: staker });
    } catch (e) {
      assert.fail(e);
    }

    let second_balance = await devToken.balanceOf(staker);
    assert.equal(
      second_balance.toNumber(),
      after_balance.toNumber() + 100,
      "Failed to reset timer second withdrawl reward"
    );
  });
});
