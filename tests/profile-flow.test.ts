import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const callbackRoute = readFileSync('src/app/auth/callback/route.ts', 'utf8');
const quinielaPage = readFileSync('src/app/quiniela/page.tsx', 'utf8');
const actions = readFileSync('src/server/actions.ts', 'utf8');

describe('auth callback profile routing', () => {
  it('sends incomplete or missing OAuth profiles to completar-perfil', () => {
    expect(callbackRoute).toContain(".select('is_active,profile_completed')");
    expect(callbackRoute).toContain('.maybeSingle()');
    expect(callbackRoute).toContain("if (!profile?.profile_completed) return NextResponse.redirect(new URL('/completar-perfil', request.url))");
  });

  it('sends complete active users to quiniela or safe internal next destination', () => {
    expect(callbackRoute).toContain("const next = url.searchParams.get('next') ?? '/quiniela'");
    expect(callbackRoute).toContain('return NextResponse.redirect(new URL(destination, request.url))');
  });

  it('blocks inactive users and rejects external next redirects', () => {
    expect(callbackRoute).toContain("if (profile?.is_active === false) return NextResponse.redirect(new URL('/403', request.url))");
    expect(callbackRoute).toContain("!next.startsWith('/')");
    expect(callbackRoute).toContain("next.startsWith('//')");
    expect(callbackRoute).toContain("next.includes('://')");
  });
});

describe('quiniela profile gates', () => {
  it('redirects missing, inactive, and incomplete profiles before showing predictions', () => {
    expect(quinielaPage).toContain("if (!profile) redirect('/login')");
    expect(quinielaPage).toContain("if (!profile.is_active) redirect('/403')");
    expect(quinielaPage).toContain("if (!profile.profile_completed) redirect('/completar-perfil')");
    expect(quinielaPage).not.toContain('Tu perfil está incompleto o inactivo');
  });
});

describe('complete profile action unlocks predictions', () => {
  it('marks profile completed, revalidates participant pages and redirects to quiniela', () => {
    expect(actions).toContain('profile_completed:true');
    expect(actions).toContain("revalidatePath('/quiniela')");
    expect(actions).toContain("revalidatePath('/clasificacion')");
    expect(actions).toContain("revalidatePath('/', 'layout')");
    expect(actions).toContain("redirect('/quiniela')");
  });

  it('savePredictionAction requires completed active profile before saving a prediction', () => {
    expect(actions).toContain(".select('is_active,profile_completed')");
    expect(actions).toContain('!profile?.is_active || !profile?.profile_completed');
    expect(actions).toContain("message:'Pronóstico guardado.'");
  });
});
