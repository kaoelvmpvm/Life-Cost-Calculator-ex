/* 原始教材計算模型：保留預設值、假設與公式。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CostModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const DEFAULTS = Object.freeze({
    startAge: 12, endAge: 50, periodDays: 6, padsPerDay: 5,
    dayPadPrice: 5, nightPadPrice: 9, nightRatio: 30,
    painkillers: true, heatPacks: true, laundry: true, supplements: true
  });
  const ADD_ON_PRICES = Object.freeze({
    painkillers: 150, heatPacks: 100, laundry: 100, supplements: 150
  });
  const EQUIVALENT_PRICES = Object.freeze({
    boba: 60, bento: 110, iphone: 32000, flight: 12000
  });
  function calculate(input) {
    const v = Object.assign({}, DEFAULTS, input);
    const startAge = Number(v.startAge);
    const endAge = Number(v.endAge);
    const periodDays = Number(v.periodDays);
    const padsPerDay = Number(v.padsPerDay);
    const dayPadPrice = Number(v.dayPadPrice);
    const nightPadPrice = Number(v.nightPadPrice);
    const nightRatio = Number(v.nightRatio) / 100;
    const values = [startAge, endAge, periodDays, padsPerDay, dayPadPrice, nightPadPrice, nightRatio];
    if (!values.every(Number.isFinite)) throw new TypeError("試算參數必須為有效數字");
    const activeYears = Math.max(1, endAge - startAge);
    const totalCycles = Math.round(activeYears * 12);
    const padsPerCycle = periodDays * padsPerDay;
    const totalPadsLifetime = totalCycles * padsPerCycle;
    const nightPadsPerCycle = padsPerCycle * nightRatio;
    const dayPadsPerCycle = padsPerCycle * (1 - nightRatio);
    const padCostPerCycle = (dayPadsPerCycle * dayPadPrice) + (nightPadsPerCycle * nightPadPrice);
    const addOnCostPerMonth = Object.keys(ADD_ON_PRICES).reduce(
      (total, key) => total + (v[key] ? ADD_ON_PRICES[key] : 0), 0
    );
    const totalMonthlyCost = padCostPerCycle + addOnCostPerMonth;
    const totalLifetimeCost = Math.round(totalMonthlyCost * totalCycles);
    const padCostLifetime = padCostPerCycle * totalCycles;
    const addOnCostLifetime = addOnCostPerMonth * totalCycles;
    return {
      activeYears, totalCycles, padsPerCycle, totalPadsLifetime,
      nightPadsPerCycle, dayPadsPerCycle, padCostPerCycle,
      addOnCostPerMonth, totalMonthlyCost, totalLifetimeCost,
      padCostLifetime, addOnCostLifetime,
      padRatio: totalMonthlyCost ? padCostPerCycle / totalMonthlyCost : 0,
      addOnRatio: totalMonthlyCost ? addOnCostPerMonth / totalMonthlyCost : 0,
      equivalents: {
        boba: Math.round(totalLifetimeCost / EQUIVALENT_PRICES.boba),
        bento: Math.round(totalLifetimeCost / EQUIVALENT_PRICES.bento),
        iphone: (totalLifetimeCost / EQUIVALENT_PRICES.iphone).toFixed(1),
        flight: (totalLifetimeCost / EQUIVALENT_PRICES.flight).toFixed(1)
      }
    };
  }
  return Object.freeze({ DEFAULTS, ADD_ON_PRICES, EQUIVALENT_PRICES, calculate });
});
