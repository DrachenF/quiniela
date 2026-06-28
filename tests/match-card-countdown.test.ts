import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const matchCard = readFileSync('src/components/match-card.tsx', 'utf8');

describe('MatchCard countdown hydration safety', () => {
  it('does not calculate countdown dates before the browser mount', () => {
    expect(matchCard).toContain('useState<Date | null>(null)');
    expect(matchCard).toContain("now === null\n              ? 'Calculando cierre...'");
    expect(matchCard).toContain('const locked = now ? isPredictionLocked(match, now) : false');
    expect(matchCard).toContain('const remaining = now && match.lockAt');
    expect(matchCard).not.toContain('useState(new Date())');
    expect(matchCard).not.toContain('suppressHydrationWarning');
  });

  it('uses a stable kickoff placeholder until mounted before formatting in Guatemala time', () => {
    expect(matchCard).toContain("if (now === null) return 'Cargando horario...'");
    expect(matchCard).toContain("timeZone: 'America/Guatemala'");
    expect(matchCard).toContain("dateStyle: 'medium'");
    expect(matchCard).toContain("timeStyle: 'short'");
    expect(matchCard).toContain('}, [match.kickoffAt, now])');
  });

  it('starts and clears browser timers after mount and closes at zero', () => {
    expect(matchCard).toContain('const updateNow = () => setNow(new Date())');
    expect(matchCard).toContain('window.setTimeout(updateNow, 0)');
    expect(matchCard).toContain('window.setInterval(updateNow, 1000)');
    expect(matchCard).toContain('window.clearTimeout(timeoutId)');
    expect(matchCard).toContain('window.clearInterval(intervalId)');
    expect(matchCard).toContain("remaining === 0\n                ? 'Pronósticos cerrados'");
  });
});
