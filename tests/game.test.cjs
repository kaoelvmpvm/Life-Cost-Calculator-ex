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
test("五關引擎、題目、證書與自我確認備援均存在",()=>{
  const html=fs.readFileSync("index.html","utf8");
  const game=fs.readFileSync("js/game.js","utf8");
  for(const id of ["stage-mission","stage-insight","stage-policy","stage-vote","stage-certificate",
     "answer-poverty","answer-location","answer-leave","vote-frame","vote-q1-check",
     "vote-q2-check","certificate","print-certificate","password-form","student-label"]){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  for(const t of ["刮鬍刀與衛生紙也是日常用品","若你是校長，你會把免費衛生棉放在校園的哪裡",
    "給予特定群體合理的特別考量","Google","另存 PDF"]) assert.ok(html.includes(t),t);
  assert.ok(game.includes("matchingFields(values)"));
  assert.ok(game.includes("CostModel.calculate(values).totalLifetimeCost"));
  assert.ok(game.includes("verifiedVote"));
  assert.ok(game.includes("manualVote"));
  assert.doesNotThrow(()=>new Function(game));
  assert.equal((html.match(/<section\b/g)||[]).length,(html.match(/<\/section>/g)||[]).length);
});
test("Apps Script 雙題完成訊號只來自伺服器回應後",()=>{
  const backend=fs.readFileSync("apps-script/Code.gs","utf8");
  const ui=fs.readFileSync("apps-script/VoteApp.html","utf8");
  assert.doesNotThrow(()=>new Function(backend));
  const js=ui.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(js);
  assert.doesNotThrow(()=>new Function(js.replace('<?!= JSON.stringify(bridgeNonce) ?>','""')));
  assert.ok(ui.includes("reportCompletionFromServerState"));
  assert.ok(ui.includes("JINGCAI_CLOUD_VOTE_COMPLETE"));
  assert.ok(ui.includes("state.voted[\"1\"]")&&ui.includes("state.voted[\"2\"]"));
  assert.ok(backend.includes("HtmlService.createTemplateFromFile('VoteApp')"));
  assert.ok(backend.includes("19p_AsOe6_ndC1jEPjnk_hERdGXCE3Ft0g7UePBIZXig"));
});
test("提供 A4 列印樣式及手機版",()=>{
  const css=fs.readFileSync("css/game.css","utf8");
  assert.ok(css.includes("@page{size:A4 portrait"));
  assert.ok(css.includes("@media print"));
  assert.ok(css.includes("@media(max-width:760px)"));
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
