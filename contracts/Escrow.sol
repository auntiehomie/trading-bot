// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is Ownable {
    address public operator;

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event OperatorSet(address indexed operator);
    event TradeExecuted(address indexed token, address indexed target, uint256 amount, bytes data);

    modifier onlyOwnerOrOperator() {
        require(msg.sender == owner() || msg.sender == operator, "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
        emit OperatorSet(_operator);
    }

    function withdraw(uint256 amount) external onlyOwner {
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawn(msg.sender, amount);
    }

    function trade(address token, address target, uint256 amount, bytes calldata data) external onlyOwnerOrOperator {
        // Allow operator to execute trades from the escrow
        // For ETH: send to target
        // For tokens: approve and call
        if (token == address(0)) {
            (bool success, ) = payable(target).call{value: amount}("");
            require(success, "ETH trade failed");
        } else {
            // ERC20 transfer to target
            (bool success, ) = token.call(abi.encodeWithSignature("transfer(address,uint256)", target, amount));
            require(success, "Token transfer failed");
        }
        emit TradeExecuted(token, target, amount, data);
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}