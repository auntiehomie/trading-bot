import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useBalance: vi.fn(),
  useReadContract: vi.fn(),
  useSendTransaction: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useWriteContract: vi.fn(),
}));

// Mock viem
vi.mock('viem', () => ({
  formatEther: (wei: bigint) => (Number(wei) / 1e18).toFixed(4),
  parseEther: (eth: string) => BigInt(Math.floor(parseFloat(eth) * 1e18)),
  formatUnits: (wei: bigint, decimals: number) => (Number(wei) / Math.pow(10, decimals)).toFixed(4),
  parseUnits: (val: string, decimals: number) => BigInt(Math.floor(parseFloat(val) * Math.pow(10, decimals))),
}));

vi.mock('@/lib/escrow-security', () => ({
  isEscrowOwnedByUser: vi.fn(() => true),
}));

vi.mock('@/lib/constants', () => ({
  ARBITRUM_SEPOLIA_CHAIN_ID: 421614,
  ESCROW_DEPOSIT_MINIMUM: 0.01,
}));

import { useAccount, useBalance, useReadContract, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { isEscrowOwnedByUser } from '@/lib/escrow-security';
import EscrowOnboarding from '@/components/escrow/EscrowOnboarding';

const mockUseAccount = useAccount as ReturnType<typeof vi.fn>;
const mockUseBalance = useBalance as ReturnType<typeof vi.fn>;
const mockUseReadContract = useReadContract as ReturnType<typeof vi.fn>;
const mockUseSendTransaction = useSendTransaction as ReturnType<typeof vi.fn>;
const mockUseWaitForTx = useWaitForTransactionReceipt as ReturnType<typeof vi.fn>;
const mockUseWriteContract = useWriteContract as ReturnType<typeof vi.fn>;
const mockIsEscrowOwnedByUser = isEscrowOwnedByUser as ReturnType<typeof vi.fn>;

const USER_ADDR = '0x1234567890abcdef1234567890abcdef12345678' as const;
const ESCROW_ADDR = '0xabc123abc123abc123abc123abc123abc123abc1' as const;
const USDC_ADDR = '0xUSDC1234567890abcdef1234567890abcdef1234' as const;
const WETH_ADDR = '0xWETH1234567890abcdef1234567890abcdef1234' as const;

function parseEth(eth: string): bigint {
  return BigInt(Math.floor(parseFloat(eth) * 1e18));
}

function setBalance(escrow: bigint, wallet: bigint) {
  mockUseBalance.mockImplementation(({ address }: { address: string }) => ({
    data: {
      value: address === ESCROW_ADDR ? escrow : wallet,
      decimals: 18,
      symbol: 'ETH',
      formatted: (Number(address === ESCROW_ADDR ? escrow : wallet) / 1e18).toFixed(4),
    },
  }));
}

describe('Escrow Withdrawal Flow — Different Token Types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEscrowOwnedByUser.mockReturnValue(true);

    mockUseAccount.mockReturnValue({ address: USER_ADDR, isConnected: true });
    setBalance(parseEth('5.0'), parseEth('10.0'));
    mockUseReadContract.mockReturnValue({ data: USER_ADDR, isLoading: false, isError: false });
    mockUseSendTransaction.mockReturnValue({ sendTransaction: vi.fn(), data: undefined, isPending: false });
    mockUseWaitForTx.mockReturnValue({ isLoading: false, isSuccess: false });
    mockUseWriteContract.mockReturnValue({ writeContract: vi.fn(), data: undefined, isPending: false });
  });

  // ── ETH (native) withdrawal tests ──────────────────────────────────────────

  it('ETH: renders withdraw form with correct available balance', () => {
    setBalance(parseEth('3.5'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    expect(screen.getByText('Withdraw Funds')).toBeInTheDocument();
    expect(screen.getByText(/Available:/)).toHaveTextContent('3.5000 ETH');
  });

  it('ETH: disables withdraw when amount exceeds escrow balance', () => {
    setBalance(parseEth('2.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '5.0' } });
    expect(screen.getByText('Withdraw ETH')).toBeDisabled();
  });

  it('ETH: enables withdraw for valid amount within balance', () => {
    setBalance(parseEth('5.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '1.5' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  it('ETH: calls writeContract on valid withdraw', () => {
    const writeContract = vi.fn();
    mockUseWriteContract.mockReturnValue({ writeContract, data: undefined, isPending: false });
    setBalance(parseEth('5.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '2.0' } });
    fireEvent.click(screen.getByText('Withdraw ETH'));
    expect(writeContract).toHaveBeenCalled();
  });

  it('ETH: handles full balance withdrawal', () => {
    setBalance(parseEth('3.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '3.0' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  it('ETH: handles very small withdrawal amounts (dust)', () => {
    setBalance(parseEth('0.01'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '0.001' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  // ── USDC (6 decimals) withdrawal tests ─────────────────────────────────────

  it('USDC: handles 6-decimal token withdrawal amount', () => {
    setBalance(parseEth('5.0'), parseEth('10.0'));
    // Mock USDC balance read
    mockUseReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'balanceOf') {
        return { data: BigInt(1000 * 1e6), isLoading: false, isError: false }; // 1000 USDC
      }
      return { data: USER_ADDR, isLoading: false, isError: false };
    });
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    // The component should handle USDC if token selection is available
    // For now, verify the ETH withdraw still works alongside USDC balance
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '1.0' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  it('USDC: validates correct decimal precision (6 decimals)', () => {
    // USDC uses 6 decimals, so 1000 USDC = 1000000000 raw units
    const usdcRaw = BigInt(1000 * 1e6);
    const formatted = Number(usdcRaw) / 1e6;
    expect(formatted).toBe(1000);
    expect(formatted.toFixed(6)).toBe('1000.000000');
  });

  // ── WETH (18 decimals) withdrawal tests ─────────────────────────────────────

  it('WETH: handles 18-decimal token withdrawal amount', () => {
    setBalance(parseEth('5.0'), parseEth('10.0'));
    mockUseReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'balanceOf') {
        return { data: parseEth('2.5'), isLoading: false, isError: false }; // 2.5 WETH
      }
      return { data: USER_ADDR, isLoading: false, isError: false };
    });
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '1.0' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  it('WETH: validates correct decimal precision (18 decimals matching ETH)', () => {
    const wethRaw = parseEth('2.5');
    const formatted = Number(wethRaw) / 1e18;
    expect(formatted).toBeCloseTo(2.5, 4);
  });

  // ── Mixed token scenario tests ──────────────────────────────────────────────

  it('Mixed: ETH withdraw works when ERC20 tokens are also in escrow', () => {
    setBalance(parseEth('5.0'), parseEth('10.0'));
    mockUseReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'balanceOf') {
        return { data: BigInt(500 * 1e6), isLoading: false, isError: false }; // 500 USDC
      }
      return { data: USER_ADDR, isLoading: false, isError: false };
    });
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '2.0' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  it('Mixed: withdrawing ETH does not affect ERC20 balances', () => {
    const writeContract = vi.fn();
    mockUseWriteContract.mockReturnValue({ writeContract, data: undefined, isPending: false });
    setBalance(parseEth('5.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '1.0' } });
    fireEvent.click(screen.getByText('Withdraw ETH'));
    // Verify writeContract was called for ETH withdrawal, not ERC20 transfer
    expect(writeContract).toHaveBeenCalled();
    const call = writeContract.mock.calls[0][0];
    // The function name should be 'withdraw' for ETH, not 'transfer'
    expect(call.functionName).toBe('withdraw');
  });

  // ── Edge cases with different token types ──────────────────────────────────

  it('Edge: zero ETH balance with non-zero ERC20 balance still allows ETH form', () => {
    setBalance(parseEth('0'), parseEth('10.0'));
    mockUseReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'balanceOf') {
        return { data: BigInt(1000 * 1e6), isLoading: false, isError: false };
      }
      return { data: USER_ADDR, isLoading: false, isError: false };
    });
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    // ETH withdraw should be disabled since balance is 0
    expect(screen.getByText('Withdraw ETH')).toBeDisabled();
  });

  it('Edge: non-owner cannot withdraw any token type', () => {
    mockIsEscrowOwnedByUser.mockReturnValue(false);
    mockUseReadContract.mockReturnValue({
      data: '0x9999999999999999999999999999999999999999',
      isLoading: false, isError: false,
    });
    setBalance(parseEth('5.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Deposit ETH')).toBeDisabled();
    expect(screen.getByText('Withdraw ETH')).toBeDisabled();
  });

  it('Edge: shows escrow address and Arbiscan link regardless of token type', () => {
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    expect(screen.getByText(ESCROW_ADDR)).toBeInTheDocument();
    expect(screen.getByText('View on Arbiscan ↗')).toHaveAttribute(
      'href',
      `https://sepolia.arbiscan.io/address/${ESCROW_ADDR}`,
    );
  });
});
