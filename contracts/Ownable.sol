// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Ownable {
    address owner;
    
    modifier onlyOwner {
        require(msg.sender == owner);
        _;//run the function
    }
    
      constructor()  {
        owner = msg.sender;
    }
}