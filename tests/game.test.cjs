const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const CostModel = require("../js/cost-model.js");
const {roles,fields,extras} = require("../js/roles.js");

test("五個角色全部存在且編號唯一",()=>{
  assert.equal(roles.length,5);
  assert.equal(new Set(roles.map(r=>r.id)).size,5);
});
test("角色全數在既有試算器允許範圍且延伸開銷保持原有價目",()=>{
  for(const role of roles){
    for(const f of fields){
      const value=role.settings[f.id];
      assert.ok(Number.isFinite(value)&&value>=f.min&&value<=f.max,role.id+":"+f.id);
      assert.ok(Math.abs(Math.round((value-f.min)/f.step)-(value-f.min)/f.step)<1e-8);
    }
    for(const extra of extras){
      assert.equal(typeof role.settings[extra.id],"boolean");
      assert.equal(extra.amount,CostModel.ADD_ON_PRICES[extra.id]);
    }
  }
});
test("五個通關金額依舊版公式重新運算，且彼此不同",()=>{
  const expected={ziqing:232742,xinyu:129600,yuan:289344,ruoting:330600,lecheng:123120};
  for(const r of roles)assert.equal(CostModel.calculate(r.settings).totalLifetimeCost,expected[r.id],r.id);
  assert.equal(new Set(Object.values(expected)).size,5);
});
test("原有預設公式未變更",()=>{
  const result=CostModel.calculate();
  assert.equal(result.totalMonthlyCost,686);
  assert.equal(result.totalLifetimeCost,312816);
  assert.equal(result.totalPadsLifetime,13680);
});
test("第五關純本地意向選擇與證書紀錄，保留原教材兩題六選項",()=>{
  const html=fs.readFileSync("index.html","utf8");
  const game=fs.readFileSync("js/game.js","utf8");
  for(const id of ["stage-mission","stage-insight","stage-policy","stage-vote","stage-certificate",
     "answer-poverty","answer-location","answer-leave","intention-form","intention-q1","intention-q2",
     "cert-vote-q1","cert-vote-q2","certificate","print-certificate","password-form","student-label"]){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  for(const t of [
    "刮鬍刀與衛生紙也是日常用品",
    "若你是校長，你會把免費衛生棉放在校園的哪裡",
    "給予特定群體合理的特別考量",
    "你或你身邊的同學，曾有過「因為衛生棉不夠/省錢而減少更換頻率」的經驗嗎？",
    "經常或偶爾會有這種情況","從來沒有，補給都很充裕","不清楚 / 沒注意過",
    "你認為學校提供免費衛生棉，放置在哪裡最合適？",
    "各樓層廁所內部（包含女廁與無性別廁所）","健康中心 / 保健室","班級導師櫃或教官室",
    "另存 PDF"
  ]) assert.ok(html.includes(t),t);
  for(const question of ["q1","q2"]){
    const pattern=new RegExp('name="intention-'+question+'" value="([abc])"','g');
    const radios=[...html.matchAll(pattern)].map(m=>m[1]);
    assert.deepEqual(radios,["a","b","c"],question);
  }
  for(const t of ["matchingFields(values)","CostModel.calculate(values).totalLifetimeCost",
    "state.intentions","selectedIntentionText","sessionStorage"]) assert.ok(game.includes(t),t);
  assert.doesNotThrow(()=>new Function(game));
  assert.equal((html.match(/<section\b/g)||[]).length,(html.match(/<\/section>/g)||[]).length);
});
test("第五關不引入 iframe、Google 服務、全班統計或外部網路",()=>{
  const html=fs.readFileSync("index.html","utf8");
  const game=fs.readFileSync("js/game.js","utf8");
  assert.doesNotMatch(html,/<iframe\b/i);
  assert.doesNotMatch(html,/js\/config\.js|Google 雲端投票|全班票數/i);
  assert.doesNotMatch(game,/google\.script|postMessage|onCloudMessage|LIFE_COST_CLOUD_VOTE_URL|voteFrame/);
  assert.ok(html.includes("已完成兩項個人意向選擇"));
});
test("提供 A4 列印樣式及手機版",()=>{
  const css=fs.readFileSync("css/game.css","utf8");
  assert.ok(css.includes("@page{size:A4 portrait"));
  assert.ok(css.includes("@media print"));
  assert.ok(css.includes("@media(max-width:760px)"));
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
