# SafeERC20 Wrapper Patterns — Research & Recommendations

## Background

The Trading Bot escrow contract currently uses raw IERC20 `transfer` and `approve` calls for deposit/withdrawal operations. The security sweep (TB-03) identified that raw ERC20 token calls can silently fail with certain non-standard tokens (e.g., USDT which returns `void` instead of `bool`, or tokens that don't return any value at all). This document researches recommended SafeERC20 wrapper patterns and provides implementation guidance.

## Why SafeERC20?

### Problem with Raw IERC20

1. **Non-standard return values**: USDT (Tether) returns `void` instead of `bool` for `transfer`/`approve`. Raw `require(token.transfer(...))` will revert.
2. **Silent failures**: Some tokens return `false` instead of reverting on failure. Raw calls won't catch this.
3. **No revert on bad call**: If a token call fails silently, funds can be lost without the contract knowing.

### SafeERC20 Solution

OpenZeppelin's `SafeERC20` library wraps IERC20 calls with:
- `safeTransfer()`: Checks return value, supports non-standard tokens
- `safeTransferFrom()`: Same for `transferFrom`
- `safeApprove()`: Handles non-standard `approve` behavior
- `safeIncreaseAllowance()` / `safeDecreaseAllowance()`: Atomic allowance changes

## Recommended Patterns

### 1. Basic SafeERC20 Usage (OpenZeppelin)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EscrowWithSafeERC20 is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    address public owner;

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero deposit");
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(msg.sender == owner, "Not owner");
        require(amount <= paymentToken.balanceOf(address(this)), "Insufficient balance");
        paymentToken.safeTransfer(msg.sender, amount);
    }
}
```

### 2. Multi-Token Support

For escrows that may handle multiple token types:

```solidity
using SafeERC20 for IERC20;

mapping(address => uint256) public balances;

function deposit(address token, uint256 amount) external nonReentrant {
    require(amount > 0, "Zero deposit");
    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    balances[token] += amount;
}

function withdraw(address token, uint256 amount) external nonReentrant {
    require(msg.sender == owner, "Not owner");
    require(balances[token] >= amount, "Insufficient balance");
    balances[token] -= amount;
    IERC20(token).safeTransfer(msg.sender, amount);
}
```

### 3. Return Value Validation

If not using SafeERC20, manually validate return values:

```solidity
function _safeTransfer(IERC20 token, address to, uint256 amount) internal {
    (bool success, bytes memory data) = address(token).call(
        abi.encodeWithSelector(token.transfer.selector, to, amount)
    );
    require(
        success && (data.length == 0 || abi.decode(data, (bool))),
        "SafeERC20: transfer failed"
    );
}
```

### 4. Emergency Pause Pattern

```solidity
bool public paused;

modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

function emergencyPause() external onlyOwner {
    paused = true;
}

function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
    // Only callable by owner, only when paused
    IERC20(token).safeTransfer(owner, amount);
}
```

## Target/Operator/Pause/Emergency Boundaries

Per TB-03, the following boundaries should be defined:

| Role | Capability | Implementation |
|------|-----------|----------------|
| **Owner** | Withdraw, pause, emergency withdraw, set operator | `onlyOwner` modifier |
| **Operator** | Execute trades from escrow (cannot withdraw) | `onlyOperator` modifier, settable by owner |
| **Paused** | No deposits, no withdrawals, no trades | `whenNotPaused` modifier |
| **Emergency** | Owner can withdraw all funds when paused | `emergencyWithdraw()` function |

## Testing Requirements (per TB-03)

1. **Unit tests**: Each function with valid/invalid inputs
2. **Invariant tests**: Ownership always correct, balances always reconcile
3. **Fuzz tests**: Random amounts, random token types
4. **Malicious token tests**: Token that returns false, token that returns void, token that reverts, token with high decimals

## Migration Plan

1. Add `@openzeppelin/contracts` dependency (if not already present)
2. Import `SafeERC20` and apply `using SafeERC20 for IERC20` in escrow contract
3. Replace all `token.transfer()` with `token.safeTransfer()`
4. Replace all `token.transferFrom()` with `token.safeTransferFrom()`
5. Replace all `token.approve()` with `token.safeApprove()`
6. Add `ReentrancyGuard` if not already present
7. Add `Pausable` from OpenZeppelin
8. Add operator role with setter
9. Add emergency withdraw function
10. Write comprehensive tests (unit, invariant, fuzz, malicious token)
11. Obtain independent review before funding

## References

- [OpenZeppelin SafeERC20](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#SafeERC20)
- [OpenZeppelin ReentrancyGuard](https://docs.openzeppelin.com/contracts/5.x/api/utils#ReentrancyGuard)
- [OpenZeppelin Pausable](https://docs.openzeppelin.com/contracts/5.x/api/utils#Pausable)
- [Solidity by Example — Escrow](https://solidity-by-example.org/app/escrow/)
- [Consensys Best Practices — Token Integration](https://consensys.github.io/smart-contract-best-practices/defi/tokens/)

---

*Created: 2026-10-09 — Backlog Processing Run*
*Status: Research document — implementation requires Amanda's approval per TB-03*
