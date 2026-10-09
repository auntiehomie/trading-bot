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

describe('Escrow Withdrawal Flow — Integration Tests', () => {
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

  it('renders withdraw form with correct available balance', () => {
    setBalance(parseEth('3.5'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    expect(screen.getByText('Withdraw Funds')).toBeInTheDocument();
    expect(screen.getByText(/Available:/)).toHaveTextContent('3.5000 ETH');
  });

  it('disables withdraw button when amount exceeds escrow balance', () => {
    setBalance(parseEth('2.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '5.0' } });
    expect(screen.getByText('Withdraw ETH')).toBeDisabled();
  });

  it('disables withdraw button when amount is zero or empty', () => {
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    expect(screen.getByText('Withdraw ETH')).toBeDisabled();
  });

  it('disables withdraw button when amount is negative', () => {
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '-1.0' } });
    expect(screen.getByText('Withdraw ETH')).toBeDisabled();
  });

  it('enables withdraw button for valid amount within balance', () => {
    setBalance(parseEth('5.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '1.5' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  it('calls writeContract on valid withdraw', () => {
    const writeContract = vi.fn();
    mockUseWriteContract.mockReturnValue({ writeContract, data: undefined, isPending: false });
    setBalance(parseEth('5.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '2.0' } });
    fireEvent.click(screen.getByText('Withdraw ETH'));
    expect(writeContract).toHaveBeenCalled();
  });

  it('shows loading state during withdraw transaction', () => {
    mockUseWriteContract.mockReturnValue({
      writeContract: vi.fn(),
      data: '0xtxhash',
      isPending: true,
    });
    mockUseWaitForTx.mockReturnValue({ isLoading: true, isSuccess: false });
    setBalance(parseEth('5.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const confirming = screen.getAllByText('Confirming...');
    expect(confirming.length).toBeGreaterThanOrEqual(1);
  });

  it('disables both deposit and withdraw when not owner', () => {
    mockIsEscrowOwnedByUser.mockReturnValue(false);
    mockUseReadContract.mockReturnValue({
      data: '0x9999999999999999999999999999999999999999',
      isLoading: false,
      isError: false,
    });
    setBalance(parseEth('5.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Deposit ETH')).toBeDisabled();
    expect(screen.getByText('Withdraw ETH')).toBeDisabled();
  });

  it('handles full balance withdrawal (withdraw all)', () => {
    setBalance(parseEth('3.0'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '3.0' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  it('handles very small withdrawal amounts (dust)', () => {
    setBalance(parseEth('0.01'), parseEth('10.0'));
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    const inputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(inputs[1], { target: { value: '0.001' } });
    expect(screen.getByText('Withdraw ETH')).not.toBeDisabled();
  });

  it('shows escrow address and Arbiscan link', () => {
    render(<EscrowOnboarding escrowAddress={ESCROW_ADDR} />);
    expect(screen.getByText(ESCROW_ADDR)).toBeInTheDocument();
    expect(screen.getByText('View on Arbiscan ↗')).toHaveAttribute(
      'href',
      `https://sepolia.arbiscan.io/address/${ESCROW_ADDR}`,
    );
  });
});
