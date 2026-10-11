# SafeERC20 Wrapper Patterns for Escrow Contract

## Research Document — 2026-10-11

## Problem

The current `Escrow.sol` contract uses a raw `token.call(abi.encodeWithSignature("transfer(address,uint256)", target, amount))` pattern for ERC20 token transfers in the `trade()` function. This has several known issues:

1. **No return value validation**: Some ERC20 tokens (e.g., USDT) don't return a boolean from `transfer()`, which can cause silent failures.
2. **No allowance handling**: The contract doesn't call `approve()` before `transferFrom()`-style operations.
3. **No reentrancy protection**: The `trade()` function could be vulnerable to reentrancy via malicious token callbacks.

## Recommended Pattern: OpenZeppelin SafeERC20

### 1. Import SafeERC20

```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
```

### 2. Use `safeTransfer` and `safeTransferFrom`

```solidity
using SafeERC20 for IERC20;

function trade(address token, address target, uint256 amount, bytes calldata data) external onlyOwnerOrOperator {
    if (token == address(0)) {
        (bool success, ) = payable(target).call{value: amount}("");
        require(success, "ETH trade failed");
    } else {
        IERC20(token).safeTransfer(target, amount);
    }
    emit TradeExecuted(token, target, amount, data);
}
```

### 3. Add ReentrancyGuard

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is Ownable, ReentrancyGuard {
    // ...
    function trade(address token, address target, uint256 amount, bytes calldata data) 
        external 
        onlyOwnerOrOperator 
        nonReentrant 
    {
        // ...
    }
    
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        // ...
    }
}
```

### 4. Add ERC20 Withdrawal Support

The current `withdraw()` only handles ETH. Add a separate function for ERC20 tokens:

```solidity
function withdrawToken(address token, uint256 amount) external onlyOwner nonReentrant {
    IERC20(token).safeTransfer(msg.sender, amount);
    emit Withdrawn(msg.sender, amount);
}
```

### 5. Validate Returned Values

`SafeERC20` handles this automatically by:
- Checking the return value for tokens that return a boolean
- Reverting on empty return data for tokens that don't return a boolean (like USDT)
- Reverting on `false` return values

## Boundary Definitions

### Owner
- Can withdraw ETH and ERC20 tokens
- Can set operator
- Can transfer ownership

### Operator
- Can call `trade()` but cannot withdraw
- Cannot change ownership or set new operator

### Pause/Emergency
Consider adding:
- `Pausable` trait for emergency stops
- `emergencyWithdraw()` that bypasses normal checks but requires a timelock

## Testing Requirements

Before funding the contract with real tokens:

1. **Unit tests**: Test with mock tokens that return `true`, return nothing, return `false`, and revert
2. **Invariant tests**: Verify ownership invariants hold after any sequence of operations
3. **Fuzz tests**: Fuzz input amounts, token addresses, and target addresses
4. **Malicious token tests**: Test with a token that attempts reentrancy via callbacks
5. **Integration tests**: Test with real token implementations (USDT, USDC, WETH) on a fork

## Migration Path

1. Deploy new `EscrowFactory` that creates `EscrowV2` contracts with SafeERC20
2. Add a `migrate()` function to move funds from old escrows to new ones
3. Deprecate old factory (but keep it for existing escrows)
4. All new escrows use the V2 factory

## References

- [OpenZeppelin SafeERC20 docs](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#SafeERC20)
- [OpenZeppelin ReentrancyGuard docs](https://docs.openzeppelin.com/contracts/5.x/api/utils#ReentrancyGuard)
- [EIP-20: Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [USDT non-standard transfer issue](https://github.com/d-xo/weird-erc20/blob/master/src/Token.sol)
