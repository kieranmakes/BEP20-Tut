// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Stakable {

  uint256 internal rewardPerHour = 1000;

  constructor() {
    stakeholders.push();
  }

  struct Stake{
    address user;
    uint256 amount;
    uint256 since;
    uint256 claimable;
  }

  struct Stakeholder {
    address user;
    Stake[] address_stakes;
  }

  struct StakingSummary {
    uint256 total_amount;
    Stake[] stakes;
  }

  // array of all stakeholders
  Stakeholder[] internal stakeholders;
  // 'stakes' contains the indexs of 'stakeholders' for the accounts that have a stake
  mapping (address => uint256) internal stakes;
  event Staked(address indexed user, uint256 amount, uint256 index, uint256 timestamp);


  // @notice _addStakeholder takes care of adding a stakeholder to the stakeholders array
  function _addStakeholder(address staker) internal returns (uint256){
    stakeholders.push();
    uint256 userIndex = stakeholders.length - 1;
    stakeholders[userIndex].user = staker;
    stakes[staker] = userIndex;
    return userIndex;
  }

  function _stake(uint256 _amount) internal {
    require(_amount > 0, "Cannot Stake nothing");
    uint256 index = stakes[msg.sender];
    uint256 timestamp = block.timestamp;
    if (index == 0){
      index = _addStakeholder(msg.sender);
    }
    stakeholders[index].address_stakes.push(Stake(msg.sender, _amount, timestamp, 0));
    emit Staked(msg.sender, _amount, index, timestamp);
  }

  function calculateStakeReward(Stake memory _current_stake) internal view returns (uint256){
    // first calculate how long the stake has been active
    // use current seconds since epoch 
    // the output will be duration in seconds
    // reward users 0.1% per Hour so thats 0.1% per 3600 seconds
    return (((block.timestamp - _current_stake.since) / 1 hours)
      * _current_stake.amount) / rewardPerHour;
  }

  function _withdrawStake (uint256 amount, uint256 index) internal returns (uint256) {
    // get user_index for Stake[]
    uint256 user_index = stakes[msg.sender];
    Stake memory current_stake = stakeholders[user_index].address_stakes[index];
    require(current_stake.amount >= amount, "Staking: Cannot withdraw more than you have staked");

    // calculate available reward
    uint256 reward = calculateStakeReward(current_stake);
    current_stake.amount = current_stake.amount - amount;
    if (current_stake.amount == 0) {
      delete stakeholders[user_index].address_stakes[index];
    } else {
      // set new values
      stakeholders[user_index].address_stakes[index].amount = current_stake.amount;
      // reset timer of stake
      stakeholders[user_index].address_stakes[index].since = block.timestamp;
    }
    return amount+reward;
  }

  function hasStake (address _staker) public view returns (StakingSummary memory) {
    // totalStakeAmount is used to count total staked amount of the address
    uint256 totalStakeAmount;
    StakingSummary memory summary = StakingSummary(0, stakeholders[stakes[_staker]].address_stakes);
    for (uint256 s = 0; s < summary.stakes.length; s+=1){
      uint256 availableReward = calculateStakeReward(summary.stakes[s]);
      summary.stakes[s].claimable = availableReward;
      totalStakeAmount = totalStakeAmount + summary.stakes[s].amount;
    }
    summary.total_amount = totalStakeAmount;
    return summary;
  }

}
