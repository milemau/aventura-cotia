import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(process.env.TEST_URL || 'http://localhost:4173');
  await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#start').click();
  await expect.poll(() => page.locator('#score').textContent()).not.toBe('0000');
  await page.locator('#about').click();
  const score = await page.locator('#score').textContent();
  await expect(page.locator('#paused')).toBeVisible();
  await expect(page.locator('#lesson-prev')).toBeDisabled();
  await page.screenshot({ path: 'test-results/teaching-desktop.png' });
  await page.locator('#lesson-next').click();
  await page.locator('[data-lesson-move="-1"]').click();
  await page.locator('[data-lesson-move="-1"]').click();
  await expect(page.locator('[data-lesson-lane="-1"]')).toHaveClass('selected');
  await page.locator('[data-lesson-move="1"]').click();
  await expect(page.locator('[data-lesson-lane="0"]')).toHaveClass('selected');
  await page.locator('#lesson-next').click();
  await expect(page.locator('.lesson-code code')).toContainText('JUMP_SPEED');
  await page.locator('#lesson-next').click();
  for (let i = 0; i < 3; i++) await page.locator('#demo-collect').click();
  await expect(page.locator('#demo-coins')).toHaveText('3');
  await expect(page.locator('#demo-points')).toHaveText('30');
  await page.screenshot({ path: 'test-results/teaching-coins.png' });
  await page.locator('#demo-reset').click();
  await expect(page.locator('#demo-points')).toHaveText('0');
  await page.locator('#lesson-next').click();
  await expect(page.locator('.lesson-code code')).toContainText('node.position.z');
  await page.locator('#lesson-next').click();
  await page.locator('[data-quiz="wrong"]').click();
  await expect(page.locator('#quiz-feedback')).toContainText('Tente outra opção');
  await page.locator('[data-quiz="right"]').click();
  await expect(page.locator('#quiz-feedback')).toContainText('Isso!');
  await expect(page.locator('#score')).toHaveText(score);
  await expect(page.locator('#coins')).toHaveText('0');
  await page.locator('#lesson-next').click();
  await expect(page.locator('#about-dialog')).not.toBeVisible();
  await expect(page.locator('#paused')).toBeVisible();
  await page.locator('#start').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await page.locator('#about').click();
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    for (let step = 0; step < 6; step++) {
      await page.locator(`[data-lesson="${step}"]`).click();
      const layout = await page.locator('#about-dialog').evaluate(dialog => {
        const scroll = dialog.querySelector('.teaching-scroll');
        const r = dialog.getBoundingClientRect();
        return { fits: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, noOverflow: scroll.scrollWidth <= scroll.clientWidth + 1, scrollable: scroll.clientHeight > 50 };
      });
      expect(layout).toEqual({ fits: true, noOverflow: true, scrollable: true });
    }
    await page.locator('[data-lesson="3"]').click();
    await page.locator('#demo-collect').click();
    await expect(page.locator('#demo-points')).toHaveText('10');
    if (viewport.width === 390) await page.screenshot({ path: 'test-results/teaching-mobile.png' });
  }
  await page.locator('#close-about').click();
  await expect(page.locator('#about-dialog')).not.toBeVisible();
  await page.locator('#about').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#about-dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
  console.log('All six lessons, demos, quiz, pause isolation, close/Escape and responsive layouts passed.');
} finally { await browser.close(); }
