import { expect, Page, test } from '@playwright/test';
import { data, storageStatePath } from '../support/fixtures';

/**
 * STO — store admin: creating products (single item and with sizes), creating a category from the
 * product form, editing a hidden product, and the shopper catalogue reflecting stock.
 */

test.describe.configure({ mode: 'serial' });

const { store } = data;
const base = `/store/${data.schoolSlug}`;

const productRow = (page: Page, name: string) => page.getByTestId('store-product-row').filter({ hasText: name });

test.describe('Store admin (admin)', () => {
  test.use({ storageState: storageStatePath('admin') });

  test('creates a single item with a category made from the form', async ({ page }) => {
    await page.goto(`${base}/admin/products`);
    await expect(page.getByRole('link', { name: 'Productos' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('Tu tienda aún no tiene productos')).toBeVisible();

    await page.getByRole('button', { name: 'Nuevo producto' }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(store.single.name);
    await page.getByRole('button', { name: 'Nueva categoría' }).click();
    await page.getByLabel('Nueva categoría').fill(store.category);
    await page.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Nueva categoría' })).toBeHidden();
    await expect(page.getByRole('combobox', { name: /^Categoría/ }).locator('option:checked')).toHaveText(store.category);

    await page.getByLabel('Precio').fill(String(store.single.price));
    await expect(page.getByRole('radio', { name: /Artículo único/ })).toHaveAttribute('aria-checked', 'true');
    await page.getByLabel('Unidades disponibles').fill(String(store.single.stock));
    await page.getByRole('button', { name: 'Crear producto' }).click();

    await expect(page).toHaveURL(new RegExp(`${base}/admin/products$`));
    const row = productRow(page, store.single.name);
    await expect(row).toContainText(store.category);
    await expect(row).toContainText(`${store.single.stock} unidades`);
    await expect(row).toContainText('Visible');
  });

  test('creates a product with sizes from a preset and refuses repeated sizes', async ({ page }) => {
    await page.goto(`${base}/admin/products/new`);
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(store.sized.name);
    await page.getByLabel('Precio').fill(String(store.sized.price));
    await page.getByRole('radio', { name: /Con tallas o variantes/ }).click();
    await page.getByRole('button', { name: 'Ropa (XS–XL)' }).click();

    const sizes = page.getByRole('list', { name: 'Tallas' }).getByRole('listitem');
    await expect(sizes).toHaveCount(5);
    for (let i = 1; i <= 5; i++) {
      await page.getByLabel(`Stock de la talla ${i}`, { exact: true }).fill(String(store.sized.stockPerSize));
    }
    // XS sold out: the list flags the product with a sold-out size.
    await page.getByLabel('Stock de la talla 1', { exact: true }).fill('0');

    await page.getByRole('button', { name: 'Agregar talla' }).click();
    await page.getByLabel('Talla 6', { exact: true }).fill('m');
    await page.getByRole('button', { name: 'Crear producto' }).click();
    await expect(page.getByText('Esta talla está repetida')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Hay tallas repetidas.');

    await page.getByRole('button', { name: 'Quitar talla 6' }).click();
    await page.getByRole('button', { name: 'Crear producto' }).click();

    await expect(page).toHaveURL(new RegExp(`${base}/admin/products$`));
    const row = productRow(page, store.sized.name);
    await expect(row).toContainText(`${store.sized.stockPerSize * 4} unidades`);
    await expect(row).toContainText('XS · 0');
    await expect(row).toContainText('Talla agotada');
  });

  test('creates a hidden product with "Crear y agregar otro", then edits it', async ({ page }) => {
    await page.goto(`${base}/admin/products/new`);
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(store.hidden.name);
    await page.getByLabel('Precio').fill(String(store.hidden.price));
    await page.getByLabel('Visible en la tienda').uncheck();
    await page.getByRole('button', { name: 'Crear y agregar otro' }).click();
    // Stays on a blank form, ready for the next product.
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue('');
    await expect(page.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible();

    await page.goto(`${base}/admin/products`);
    const row = productRow(page, store.hidden.name);
    await expect(row).toContainText('Oculto');
    await expect(row).toContainText('Agotado');

    // A hidden product still loads in the edit form.
    await row.getByRole('link', { name: store.hidden.name }).click();
    await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue(store.hidden.name);
    await page.getByLabel('Unidades disponibles').fill('3');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(productRow(page, store.hidden.name)).toContainText('3 unidades');
  });

  test('the catalogue shows visible products only, with their stock', async ({ page }) => {
    await page.goto(base);
    await expect(page.getByRole('link', { name: new RegExp(store.single.name) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(store.sized.name) })).toContainText('Alguna talla agotada');
    await expect(page.getByRole('link', { name: new RegExp(store.hidden.name) })).toHaveCount(0);
    // No card is wrongly shown as sold out.
    await expect(page.getByRole('link', { name: new RegExp(store.single.name) })).not.toContainText('Agotado');

    await page.getByRole('link', { name: new RegExp(store.single.name) }).click();
    await expect(page.getByText(`${store.single.stock} disponibles`)).toBeVisible();
    await expect(page.getByLabel('Talla / variante')).toHaveCount(0);
  });

  test('deletes a product nobody ordered', async ({ page }) => {
    await page.goto(`${base}/admin/products`);
    await page.getByRole('button', { name: `Acciones para ${store.hidden.name}` }).click();
    await page.getByRole('menuitem', { name: 'Eliminar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(productRow(page, store.hidden.name)).toHaveCount(0);
  });
});
