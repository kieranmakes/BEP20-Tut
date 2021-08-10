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

  Stakeholder[] internal stakeholders;
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
}
