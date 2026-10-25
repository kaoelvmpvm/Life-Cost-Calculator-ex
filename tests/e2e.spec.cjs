const { test, expect } = require("@playwright/test");
const { roles, fields, extras } = require("../js/roles.js");
const CostModel = require("../js/cost-model.js");

async function enterGame(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("#start-game").click();
  const name = (await page.locator("#character-name").textContent()).trim();
  const role = roles.find(r => r.name === name);
  expect(role, "抽中的角色必須存在").toBeTruthy();
  return role;
}

async function passCalculator(page, role) {
  for (const field of fields) {
    await page.locator("#input-" + field.id).fill(String(role.settings[field.id]));
  }
  for (const extra of extras) {
    await page.locator("#input-" + extra.id).setChecked(role.settings[extra.id]);
  }
  await page.locator("#calculate-now").click();
  const total = CostModel.calculate(role.settings).totalLifetimeCost;
  await expect(page.locator("#calculated-sum")).toContainText(new Intl.NumberFormat("zh-TW").format(total));
  await page.locator("#password-input").fill(String(total));
  await page.locator("#password-form button[type=submit]").click();
  await expect(page.locator("#stage-insight")).toBeVisible();
}

test("完整通關：角色設定、思辨、選擇及證書", async ({ page }) => {
  const role = await enterGame(page);
  await expect(page.locator("#character-portrait")).toHaveAttribute("src", role.image);
  await passCalculator(page, role);
  await expect(page.locator("#insight-title")).toBeFocused();
  await page.locator("#answer-poverty").fill("我會比較不同政策的優點、成本與公平性。");
  await page.locator("#go-policy").click();
  await expect(page.locator("#stage-policy")).toBeVisible();
  await page.locator("#answer-location").fill("提供方便取得與隱私兼顧的方案。");
  await page.locator("#answer-leave").fill("應兼顧合理支持與學習機會。");
  await page.locator("#go-vote").click();
  await expect(page.locator("#stage-vote")).toBeVisible();
  await page.locator('input[name="intention-q1"][value="c"]').check();
  await page.locator('input[name="intention-q2"][value="a"]').check();
  await expect(page.locator("#intention-feedback-q1")).toBeVisible();
  await page.locator("#finish-game").click();
  await expect(page.locator("#stage-certificate")).toBeVisible();
  await expect(page.locator("#cert-cost")).toContainText(new Intl.NumberFormat("zh-TW").format(CostModel.calculate(role.settings).totalLifetimeCost));
  await expect(page.locator("#cert-role")).toContainText(role.name);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#certificate")).toBeVisible();
  await expect(page.locator("#intro")).toBeHidden();
  for(const slot of ["certificate-mark","certificate-seal"]){
    await expect.poll(()=>page.locator('[data-image-slot="'+slot+'"]').evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  }
});

test("輸入範圍、重新開始對話框及復原", async ({ page }) => {
  await enterGame(page);
  await page.locator("#input-startAge").fill("30");
  await page.locator("#input-startAge").blur();
  await expect(page.locator("#input-startAge")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#error-startAge")).toBeVisible();
  await page.locator("#input-startAge").fill("16");
  await expect(page.locator("#input-startAge")).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#error-startAge")).toBeHidden();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#input-startAge")).toHaveValue("16");
  await expect(page.locator("#save-status")).toBeVisible();
  await page.locator("#reset-game").click();
  await expect(page.locator("#app-confirm")).toBeVisible();
  await page.locator("#dialog-cancel").click();
  await expect(page.locator("#app-confirm")).toBeHidden();
  await expect(page.locator("#input-startAge")).toHaveValue("16");
  await page.locator("#reset-game").click();
  await page.locator("#dialog-accept").click();
  await expect(page.locator("#intro")).toBeVisible();
  await expect(page.locator("#game-workspace")).toBeHidden();
});

test.describe("手機排版", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("可查看角色故事並輸入設定", async ({ page }) => {
    const role = await enterGame(page);
    await expect(page.locator("#mobile-story")).toBeVisible();
    await expect(page.locator("#character-story")).toBeHidden();
    await page.locator("#mobile-story summary").click();
    await expect(page.locator("#mobile-story-text")).toBeVisible();
    await expect(page.locator("#mobile-story-name")).toContainText(role.name);
    await expect(page.locator("#input-startAge")).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,"手機不應產生水平捲動").toBeLessThan(3);
    await page.locator("#input-endAge").fill("55");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#input-endAge")).toHaveValue("55");
  });
});

test("計算只顯示金額；確認通關後才給出錯誤類別", async ({page})=>{
  const role=await enterGame(page);
  const age=role.settings.startAge===12?13:12;
  await page.locator("#input-startAge").fill(String(age));
  await page.locator("#calculate-now").click();
  await expect(page.locator("#calculation-display")).toBeVisible();
  await expect(page.locator("#mission-feedback")).toBeEmpty();
  await page.locator("#password-input").fill("100000");
  await page.locator("#password-form button[type=submit]").click();
  await expect(page.locator("#mission-feedback")).toContainText("生理歷程");
  await expect(page.locator("#stage-mission")).toBeVisible();
});
