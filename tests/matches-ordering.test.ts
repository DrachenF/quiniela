import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getNextClosingMatch, sortMatchesByLockAt } from '../src/lib/matches';
import type { Match } from '../src/lib/types';

const dataSource = readFileSync('src/lib/data.ts', 'utf8');

function match(overrides: Partial<Match>): Match {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    round: 'ROUND_OF_32',
    roundOrder: overrides.roundOrder ?? 1,
    lockAt: 'lockAt' in overrides ? overrides.lockAt : '2026-06-28T18:55:00.000Z',
    kickoffAt: 'kickoffAt' in overrides ? overrides.kickoffAt : '2026-06-28T19:00:00.000Z',
    status: overrides.status ?? 'SCHEDULED',
    manuallyLocked: overrides.manuallyLocked ?? false,
  } as Match;
}

describe('match ordering', () => {
  it('requests Supabase ordering by lock_at asc with nulls last and round_order tie-breaker', () => {
    expect(dataSource).toContain(".order('lock_at', { ascending: true, nullsFirst: false })");
    expect(dataSource).toContain(".order('round_order', { ascending: true })");
  });

  it('sorts by ascending lock_at and places null values last', () => {
    const ordered = sortMatchesByLockAt([
      match({ id: 'null-lock', roundOrder: 1, lockAt: null }),
      match({ id: 'late', roundOrder: 2, lockAt: '2026-06-29T18:55:00.000Z' }),
      match({ id: 'early', roundOrder: 3, lockAt: '2026-06-28T18:55:00.000Z' }),
    ]);

    expect(ordered.map(({ id }) => id)).toEqual(['early', 'late', 'null-lock']);
  });

  it('uses round_order as ascending tie-breaker when lock_at is equal', () => {
    const lockAt = '2026-06-28T18:55:00.000Z';
    const ordered = sortMatchesByLockAt([
      match({ id: 'round-20', roundOrder: 20, lockAt }),
      match({ id: 'round-10', roundOrder: 10, lockAt }),
    ]);

    expect(ordered.map(({ id }) => id)).toEqual(['round-10', 'round-20']);
  });
});

describe('next closing match', () => {
  it('selects the future scheduled match with the nearest lock_at', () => {
    const next = getNextClosingMatch(
      [
        match({ id: 'later', roundOrder: 2, lockAt: '2026-06-28T20:00:00.000Z' }),
        match({ id: 'nearest', roundOrder: 1, lockAt: '2026-06-28T19:00:00.000Z' }),
      ],
      new Date('2026-06-28T18:00:00.000Z'),
    );

    expect(next?.id).toBe('nearest');
  });

  it('does not select expired or manually locked matches as next closing', () => {
    const next = getNextClosingMatch(
      [
        match({ id: 'expired', lockAt: '2026-06-28T17:59:59.000Z' }),
        match({ id: 'manual', lockAt: '2026-06-28T18:30:00.000Z', manuallyLocked: true }),
        match({ id: 'valid', lockAt: '2026-06-28T19:00:00.000Z' }),
      ],
      new Date('2026-06-28T18:00:00.000Z'),
    );

    expect(next?.id).toBe('valid');
  });

  it('ignores unavailable match statuses', () => {
    const next = getNextClosingMatch(
      [
        match({ id: 'locked', lockAt: '2026-06-28T18:30:00.000Z', status: 'LOCKED' }),
        match({ id: 'live', lockAt: '2026-06-28T18:40:00.000Z', status: 'LIVE' }),
        match({ id: 'postponed', lockAt: '2026-06-28T18:50:00.000Z', status: 'POSTPONED' }),
        match({ id: 'valid', lockAt: '2026-06-28T19:00:00.000Z', status: 'SCHEDULED' }),
      ],
      new Date('2026-06-28T18:00:00.000Z'),
    );

    expect(next?.id).toBe('valid');
  });
});
