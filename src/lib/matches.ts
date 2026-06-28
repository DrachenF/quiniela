import type { Match } from './types';

const unavailableStatuses = new Set(['LOCKED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED']);

export function sortMatchesByLockAt(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    if (!a.lockAt && !b.lockAt) return a.roundOrder - b.roundOrder;
    if (!a.lockAt) return 1;
    if (!b.lockAt) return -1;

    const lockDiff = new Date(a.lockAt).getTime() - new Date(b.lockAt).getTime();
    return lockDiff || a.roundOrder - b.roundOrder;
  });
}

export function getNextClosingMatch(matches: Match[], now = new Date()): Match | undefined {
  const nowTime = now.getTime();

  return sortMatchesByLockAt(matches).find((match) => {
    if (!match.lockAt || match.manuallyLocked || unavailableStatuses.has(match.status)) return false;
    return new Date(match.lockAt).getTime() > nowTime;
  });
}
