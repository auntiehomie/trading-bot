import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EscrowPage from '@/app/escrow/page';

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useBalance: vi.fn(),
  useSendTransaction: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
  useChainId: vi.fn(),
  useConnectors: vi.fn(),
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
}));

vi.mock('@/hooks/useEscrow', () => ({
  useEscrow: vi.fn(),
}));

vi.mock('@/components/escrow/CreateEscrow', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="create-escrow">
      {props.createTxHash ? (
        <span data-testid="tx-hash">{props.createTxHash}</span>
      ) : (
        <button data-testid="create-button" onClick={props.onCreateEscrow}>
          Create Escrow Account
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/components/escrow/EscrowOnboarding', () => ({
  default: ({ escrowAddress }: { escrowAddress: string }) => (
    <div data-testid="escrow-onboarding">
      <span data-testid="escrow-addr">{escrowAddress}</span>
      <button>Deposit ETH</button>
      <button>Withdraw ETH</button>
    </div>
  ),
}));

import { useAccount } from 'wagmi';
import { useEscrow } from '@/hooks/useEscrow';

const mockUseAccount = useAccount as ReturnType<typeof vi.fn>;
const mockUseEscrow = useEscrow as ReturnType<typeof vi.fn>;

describe('Escrow Page - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      isDisconnected: true,
    });
    mockUseEscrow.mockReturnValue({
      escrowAddress: undefined,
      hasEscrow: false,
      isLoading: false,
      createEscrow: vi.fn(),
      isCreating: false,
      isWaitingCreation: false,
      isCreationConfirmed: false,
      createTxHash: undefined,
    });
  });

  it('shows connect wallet prompt when disconnected', () => {
    render(<EscrowPage />);
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
  });

  it('shows how escrow works section', () => {
    render(<EscrowPage />);
    expect(screen.getByRole('heading', { name: 'How Escrow Works' })).toBeInTheDocument();
  });

  it('shows create escrow prompt when connected but no escrow', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
      isDisconnected: false,
    });
    render(<EscrowPage />);
    expect(screen.getByTestId('create-escrow')).toBeInTheDocument();
    expect(screen.getByTestId('create-button')).toBeInTheDocument();
  });

  it('shows escrow onboarding when escrow exists', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
      isDisconnected: false,
    });
    mockUseEscrow.mockReturnValue({
      escrowAddress: '0xabc123abc123abc123abc123abc123abc123abc1',
      hasEscrow: true,
      isLoading: false,
      createEscrow: vi.fn(),
      isCreating: false,
      isWaitingCreation: false,
      isCreationConfirmed: false,
      createTxHash: undefined,
    });
    render(<EscrowPage />);
    expect(screen.getByTestId('escrow-onboarding')).toBeInTheDocument();
  });

  it('shows loading state when escrow data is loading', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
      isDisconnected: false,
    });
    mockUseEscrow.mockReturnValue({
      escrowAddress: undefined,
      hasEscrow: false,
      isLoading: true,
      createEscrow: vi.fn(),
      isCreating: false,
      isWaitingCreation: false,
      isCreationConfirmed: false,
      createTxHash: undefined,
    });
    render(<EscrowPage />);
    expect(screen.getByText('Loading your escrow...')).toBeInTheDocument();
  });

  it('shows create escrow with tx hash', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
      isDisconnected: false,
    });
    mockUseEscrow.mockReturnValue({
      escrowAddress: undefined,
      hasEscrow: false,
      isLoading: false,
      createEscrow: vi.fn(),
      isCreating: false,
      isWaitingCreation: true,
      isCreationConfirmed: false,
      createTxHash: '0xtx123tx123tx123tx123tx123tx123x123x12',
    });
    render(<EscrowPage />);
    expect(screen.getByTestId('tx-hash').textContent).toBe('0xtx123tx123tx123tx123tx123tx123x123x12');
  });
});
