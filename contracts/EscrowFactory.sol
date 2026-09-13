// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Escrow.sol";

contract EscrowFactory {
    mapping(address => address) public userEscrows;
    address[] public allEscrows;

    event EscrowCreated(address indexed user, address escrowAddress);

    function getEscrow(address user) external view returns (address) {
        return userEscrows[user];
    }

    function createEscrow() external returns (address) {
        require(userEscrows[msg.sender] == address(0), "Escrow already exists");
        bytes32 salt = keccak256(abi.encodePacked(msg.sender));
        Escrow escrow = new Escrow{salt: salt}();
        userEscrows[msg.sender] = address(escrow);
        allEscrows.push(address(escrow));
        emit EscrowCreated(msg.sender, address(escrow));
        return address(escrow);
    }

    function hasEscrow(address user) external view returns (bool) {
        return userEscrows[user] != address(0);
    }
}