const DevToken = artifacts.require("DevToken");

const BigNumber = require("bignumber.js");
require("chai").use(require("chai-as-promised")).should();

contract("DevToken", async (accounts) => {
  let devToken;

  before(async () => {
    devToken = await DevToken.deployed();
  });

  it("initial supply", async () => {
    let supply = await devToken.totalSupply();
    assert.equal(
      supply.toString(),
      "50000000000000000000000",
      "Initial supply was not the same as in the migration"
    );
  });

  it("minting", async () => {
    let initial_balance = await devToken.balanceOf(accounts[1]);

    assert.equal(
      initial_balance.toNumber(),
      0,
      "Initial balance for accounts[1] should be 0 "
    );

    let totalSupply = await devToken.totalSupply();
    totalSupply = new BigNumber(totalSupply.toString());
    await devToken.mint(accounts[1], 100);
    let after_balance = await devToken.balanceOf(accounts[1]);
    let after_supply = await devToken.totalSupply();
    after_supply = new BigNumber(after_supply.toString());

    // assert accounts[1] balance and totalSupply have increased by 100
    assert.equal(
      after_balance.toString(),
      "100",
      "balance after minting should be 100"
    );
    assert.equal(
      after_supply.toString(),
      totalSupply.plus(100).toString(),
      "totalSupply after should be 100 greater than before minting"
    );

    try {
      // mint with address 0
      await devToken.mint("0x0000000000000000000000000000000000000000", 100);
    } catch (error) {
      assert.equal(
        error.reason,
        "Cannot mint to zero address",
        "Failed to stop minting zero address"
      );
    }
  });

  it("burning", async () => {
    // accounts[1] should have 100 tokens
    let initial_balance = await devToken.balanceOf(accounts[1]);
    initial_balance = new BigNumber(initial_balance.toString());

    // burn to 0 address
    try {
      await devToken.burn("0x0000000000000000000000000000000000000000", 100);
    } catch (error) {
      assert.equal(
        error.reason,
        "Cannot burn from zero address",
        "Failed to stop burning from zero address"
      );
    }

    let totalSupply = await devToken.totalSupply();
    totalSupply = new BigNumber(totalSupply.toString());
    try {
      await devToken.burn(accounts[1], initial_balance.plus(-50).toNumber());
    } catch (error) {
      assert.fail(error);
    }

    let balance = await devToken.balanceOf(accounts[1]);
    balance = new BigNumber(balance.toString());
    assert.equal(
      balance.toString(),
      initial_balance.plus(-50).toString(),
      "Total supply not properly reduced"
    );

    let newSupply = await devToken.totalSupply();
    newSupply = new BigNumber(newSupply.toString());
    assert.equal(
      newSupply.toString(),
      totalSupply.plus(-50).toString(),
      "Total supply not properly reduced"
    );
  });

  it("transfer tokens", async () => {
    let initial_balance = await devToken.balanceOf(accounts[1]);
    initial_balance = new BigNumber(initial_balance.toString());
    // transfer 100 tokens from address[0] to address[1]
    await devToken.transfer(accounts[1], 100);
    let after_balance = await devToken.balanceOf(accounts[1]);
    after_balance = new BigNumber(after_balance.toString());
    assert.equal(
      after_balance.toString(),
      initial_balance.plus(100),
      "Balance should have increased in accounts[1]"
    );

    let account2_initial_balance = await devToken.balanceOf(accounts[2]);
    account2_initial_balance = new BigNumber(
      account2_initial_balance.toString()
    );
    await devToken.transfer(accounts[2], 20, { from: accounts[1] });
    let account2_after_balance = await devToken.balanceOf(accounts[2]);
    account2_after_balance = new BigNumber(account2_after_balance.toString());

    let account1_after_balance = await devToken.balanceOf(accounts[1]);
    account1_after_balance = new BigNumber(account1_after_balance.toString());
    assert.equal(
      account1_after_balance.toString(),
      after_balance.plus(-20).toString(),
      "should have reduced account 1 by 20"
    );
    assert.equal(
      account2_after_balance.toString(),
      account2_initial_balance.plus(20).toString(),
      "Should have transferred 20 tokens to account[2] from account[1]"
    );

    // try transferring too much
    try {
      await devToken.transfer(accounts[2], 2000000000000, {
        from: accounts[1],
      });
    } catch (error) {
      assert.equal(
        error.reason,
        "Cannot transfer more than your account balance"
      );
    }
  });

  it("allow account some allowance", async () => {
    try {
      await devToken.approve("0x0000000000000000000000000000000000000000", 100);
    } catch (error) {
      assert.equal(
        error.reason,
        "DevToken: Approve cannot be to zero address",
        "Should be able to approve zero address"
      );
    }

    try {
      // Give accounts[1] access to 100 tokens on zero account
      await devToken.approve(accounts[1], 100);
    } catch (error) {
      assert.fail(error); // should not fail
    }

    let allowance = await devToken.allowance(accounts[0], accounts[1]);
    allowance = new BigNumber(allowance.toString());
    assert.equal(
      allowance.toString(),
      "100",
      "Allowance was not correctly allocated"
    );
  });

  it("transferring with allowance", async () => {
    try {
      await devToken.transferFrom(accounts[0], accounts[2], 200, {
        from: accounts[1],
      });
    } catch (error) {
      assert.equal(
        error.reason,
        "DevToken: You cannot spend that much on this account",
        "Failed to detect overspending"
      );
    }
    let init_allowance = await devToken.allowance(accounts[0], accounts[1]);
    init_allowance = new BigNumber(init_allowance.toString());
    try {
      await devToken.transferFrom(accounts[0], accounts[2], 50, {
        from: accounts[1],
      });
    } catch (error) {
      assert.fail(error);
    }
    let allowance = await devToken.allowance(accounts[0], accounts[1]);
    allowance = new BigNumber(allowance.toString());
    assert.equal(
      allowance.toString(),
      "50",
      "The allowance should have decreased"
    );
  });
});
