for file in tests/e2e/*.spec.ts; do
  sed -i "s/await expect(page.locator('\[data-testid=\"tab-home\"\]')).toBeVisible({ timeout: 15000 });/await page.waitForLoadState('networkidle');\n        await expect(page.locator('\[data-testid=\"tab-home\"\]')).toBeVisible({ timeout: 15000 });/" "$file"
done
