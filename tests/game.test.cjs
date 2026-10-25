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
test("第五關不引入投票 iframe 或 Google 試算表資料串接",()=>{
  const html=fs.readFileSync("index.html","utf8");
  const game=fs.readFileSync("js/game.js","utf8");
  assert.doesNotMatch(html,/<iframe\b/i);
  assert.doesNotMatch(html,/js\/config\.js|script\.google\.com|docs\.google\.com\/spreadsheets/i);
  assert.doesNotMatch(game,/google\.script|postMessage|onCloudMessage|LIFE_COST_CLOUD_VOTE_URL|voteFrame/);
  assert.ok(html.includes("我的個人意向紀錄"));
  assert.ok(html.includes('id="cert-feedback-q1"'));
  assert.ok(html.includes('id="cert-feedback-q2"'));
});
test("提供 A4 列印樣式及手機版",()=>{
  const css=fs.readFileSync("css/game.css","utf8");
  assert.ok(css.includes("@page{size:A4 portrait"));
  assert.ok(css.includes("@media print"));
  assert.ok(css.includes("@media(max-width:760px)"));
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});

test("五位角色以情境敘事交代條件，不再展示設定對照表",()=>{
  const html=fs.readFileSync("index.html","utf8");
  const js=fs.readFileSync("js/game.js","utf8");
  for(const role of roles){
    assert.ok(role.story.length>130,role.name+" 敘事情境應包含足夠的生活細節");
    assert.ok(role.story.includes("\n\n"),role.name+" 情境應分段");
    assert.ok(role.story.includes("初潮") || role.story.includes("第一次月經"),role.name+" 初潮描述");
    assert.ok(role.story.includes("停經"),role.name+" 停經描述");
  }
  assert.doesNotMatch(html,/id="character-clues"|class="clue-list"|角色檔案・試算線索/);
  assert.doesNotMatch(js,/const clueData|character-clues|\.clue-row/);
  assert.match(html,/你的閱讀任務/);
});

test("試算僅輸出金額，角色比對及錯誤提醒只在確認通關時發生",()=>{
  const js=fs.readFileSync("js/game.js","utf8");
  const start=js.indexOf("  function calculate() {");
  const end=js.indexOf("  function submitPassword(event)",start);
  const calculation=js.slice(start,end);
  assert.ok(start>0&&end>start);
  assert.doesNotMatch(calculation,/matchingFields|與角色檔案不同|設定已與角色|解密成功/);
  assert.match(calculation,/calculated-sum/);
  const submit=js.slice(end,js.indexOf("  function renderInsight()",end));
  assert.match(submit,/matchingFields\(values\)/);
  assert.match(submit,/設定與故事內容不一致/);
  assert.match(submit,/CostModel\.calculate\(values\)\.totalLifetimeCost/);
});

test("依據第五關六種選擇提供溫和、有持續關注意義的回饋",()=>{
  const feedback=require("../js/feedback.js");
  const html=fs.readFileSync("index.html","utf8");
  const game=fs.readFileSync("js/game.js","utf8");
  for(const question of ["q1","q2"]){
    assert.ok(html.includes('id="intention-feedback-'+question+'"'));
    assert.ok(html.includes('id="cert-feedback-'+question+'"'));
    for(const choice of ["a","b","c"]){
      const message=feedback.get(question,choice);
      assert.ok(message.length>=35&&message.length<=120,question+":"+choice);
      assert.ok(/期待|願|思考|留意|關心/.test(message),question+":"+choice);
    }
  }
  assert.equal(feedback.get("q1","z"),"");
  assert.match(game,/JingcaiFeedback\.get\(key,value\)/);
  assert.match(game,/JingcaiFeedback\.get\("q1",state\.intentions\.q1\)/);
  assert.ok(html.includes("./js/feedback.js"));
});
test("舊版技術說明、證書冗文與所有臨時圖示均已移除",()=>{
  const html=fs.readFileSync("index.html","utf8");
  for(const old of [
    "以下沿用原教材兩道問題與選項",
    "透過成本試算、議題思辨與個人意向選擇，留下專屬的學習紀錄",
    "✓ 已完成兩項個人意向選擇",
    "本紀錄僅保存在目前瀏覽器，沒有上傳或產生班級統計。",
    "政策必須兼顧可近性、隱私與公平。",
    "🧋","🍱","📱","✈️"
  ])assert.ok(!html.includes(old),old);
  const slots=["logo","cover","character","boba","bento","iphone","flight","certificate-mark","certificate-seal"];
  for(const slot of slots)assert.ok(html.includes('data-image-slot="'+slot+'"'),slot);
  assert.ok(html.includes("./css/refinement.css"));
  const css=fs.readFileSync("css/refinement.css","utf8");
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(css.includes("@keyframes reveal-stage"));
  assert.ok(css.includes("@media print"));
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
