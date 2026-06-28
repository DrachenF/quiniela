import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const authForms = readFileSync('src/components/auth/auth-forms.tsx', 'utf8');
const nav = readFileSync('src/components/nav.tsx', 'utf8');

describe('login navigation refresh', () => {
  it('replaces to /quiniela and refreshes server components after password login', () => {
    const signInIndex = authForms.indexOf('signInWithPassword');
    const replaceIndex = authForms.indexOf("router.replace('/quiniela')");
    const refreshIndex = authForms.indexOf('router.refresh()');

    expect(signInIndex).toBeGreaterThan(0);
    expect(replaceIndex).toBeGreaterThan(signInIndex);
    expect(refreshIndex).toBeGreaterThan(replaceIndex);
    expect(authForms).not.toContain("router.push('/quiniela')");
  });

  it('authenticated navigation renders Salir instead of Entrar', () => {
    expect(nav).toContain('profile ? (');
    expect(nav).toContain('Salir');
    expect(nav).toContain('Entrar');
    expect(nav.indexOf('Salir')).toBeLessThan(nav.indexOf('Entrar'));
  });
});
