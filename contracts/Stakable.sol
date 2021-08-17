// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Stakable {
  constructor() {
    stakeholders.push();
  }

  struct Stake{
    address user;
    uint256 amount;
    uint256 since;
  }

  struct Stakeholder {
    address user;
    Stake[] address_stakes;
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
    stakeholders[index].address_stakes.push(Stake(msg.sender, _amount, timestamp));
    emit Staked(msg.sender, _amount, index, timestamp);
  }


}
