// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Escrow
 * @notice Minimal personal escrow for the TradingHomie bot.
 *         Each user holds their own balance; funds can be withdrawn at any time.
 */
contract Escrow {
    /// @notice Contract deployer.
    address public immutable owner;

    /// @notice ETH balance held per user.
    mapping(address => uint256) private _balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    error ZeroAmount();
    error InsufficientBalance();

    constructor() {
        owner = msg.sender;
    }

    /// @notice Accept plain ETH transfers and credit them to the sender.
    receive() external payable {
        _deposit(msg.sender, msg.value);
    }

    /// @notice Deposit ETH into the caller's escrow balance.
    function deposit() external payable {
        _deposit(msg.sender, msg.value);
    }

    /// @notice Withdraw `amount` wei from the caller's escrow balance.
    function withdraw(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        uint256 balance = _balances[msg.sender];
        if (amount > balance) revert InsufficientBalance();

        _balances[msg.sender] = balance - amount;
        (bool ok, ) = payable(msg.sender).call{ value: amount }("");
        require(ok, "Escrow: transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Return the caller's escrow balance in wei.
    function getBalance() external view returns (uint256) {
        return _balances[msg.sender];
    }

    /// @notice Return any user's escrow balance in wei.
    function getBalance(address user) external view returns (uint256) {
        return _balances[user];
    }

    function _deposit(address user, uint256 amount) private {
        if (amount == 0) revert ZeroAmount();
        _balances[user] += amount;
        emit Deposited(user, amount);
    }
}
