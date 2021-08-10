const BigNumber = require("bignumber.js");
require("chai").use(require("chai-as-promised")).should();
const Ownable = artifacts.require("DevToken");

contract("Ownable", async (accounts) => {
  let ownable;
  before(async () => {
    ownable = await Ownable.deployed();
  });

  it("transfer ownership", async () => {
    let owner = await ownable.owner();
    assert.equal(owner, accounts[0], "The owner was not properly assigned");
    // Transfer it to accounts[1]
    await ownable.transferOwnership(accounts[1]);
    let new_owner = await ownable.owner();
    assert.equal(
      new_owner,
      accounts[1],
      "The ownership was not transferred correctly"
    );
  });

  it("onlyOwner modifier", async () => {
    ownable = await Ownable.deployed();

    // try executing a Transfer from accounts 2
    try {
      await ownable.transferOwnership(accounts[2], { from: accounts[2] });
    } catch (error) {
      assert.equal(
        error.reason,
        "Ownable: only owner can call this function",
        "Failed to stop non-owner from calling onlyOwner protected function"
      );
    }
  });

  it("renounce ownership", async () => {
    await ownable.renounceOwnership({ from: accounts[1] });
    let owner = await ownable.owner();
    assert.equal(
      owner,
      "0x0000000000000000000000000000000000000000",
      "Renouncing owner was not correctly done"
    );
  });
});
