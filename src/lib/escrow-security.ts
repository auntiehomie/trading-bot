export function isEscrowOwnedByUser(
  escrowOwner: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
): boolean {
  if (!escrowOwner || !userAddress) return false;
  return escrowOwner.toLowerCase() === userAddress.toLowerCase();
}
