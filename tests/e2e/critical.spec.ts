import { test, expect } from '@playwright/test';

test('visitante en /quiniela y /perfil es enviado a login cuando no hay sesión', async ({ page }) => {
  await page.goto('/quiniela');
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/perfil');
  await expect(page).toHaveURL(/\/login/);
});

test('ranking vacío no muestra participantes ficticios ni datos privados', async ({ page }) => {
  await page.goto('/clasificacion');
  await expect(page.getByText('Clasificación pública')).toBeVisible();
  await expect(page.getByText('Todavía no hay participantes')).toBeVisible();
  await expect(page.getByText('Carlos')).toHaveCount(0);
  await expect(page.getByText('Andrea')).toHaveCount(0);
  await expect(page.getByText('José')).toHaveCount(0);
  await expect(page.getByText('@')).toHaveCount(0);
});

test('home vacío no muestra partidos ficticios', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Próximamente se publicarán los partidos')).toBeVisible();
  await expect(page.getByText('Brasil')).toHaveCount(0);
  await expect(page.getByText('Argentina')).toHaveCount(0);
});

test('formularios reales de auth exponen campos y acciones Supabase', async ({ page }) => {
  await page.goto('/registro');
  await expect(page.getByPlaceholder('Nombre')).toBeVisible();
  await expect(page.getByPlaceholder('Apellido')).toBeVisible();
  await expect(page.getByPlaceholder('Correo')).toBeVisible();
  await page.goto('/login');
  await expect(page.getByText('Continuar con Google')).toBeVisible();
});
