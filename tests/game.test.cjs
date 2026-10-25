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

test("13 張 GitHub 圖片均有正確檔名、PNG 格式與頁面路徑",()=>{
  const html=fs.readFileSync("index.html","utf8");
  const js=fs.readFileSync("js/game.js","utf8");
  const staticImages={
    logo:"logo.png",cover:"cover.png",
    boba:"boba.png",bento:"bento.png",iphone:"iphone.png",flight:"flight.png",
    "certificate-mark":"certificate-mark.png",
    "certificate-seal":"certificate-seal.png"
  };
  for(const [slot,name] of Object.entries(staticImages)){
    const tag=html.match(new RegExp('<img[^>]*data-image-slot="'+slot+'"[^>]*>'))?.[0];
    assert.ok(tag,"缺少正式圖片元件："+slot);
    assert.ok(tag.includes('src="./images/'+name+'"'),"圖片路徑錯誤："+name);
    assert.ok(/alt="[^"]+"/.test(tag),"圖片缺少替代文字："+name);
  }
  const png=Buffer.from([137,80,78,71,13,10,26,10]);
  for(const name of [...Object.values(staticImages),...roles.map(r=>"character-"+r.id+".png")]){
    const path="images/"+name;
    assert.ok(fs.existsSync(path),"缺少圖片："+path);
    assert.ok(fs.statSync(path).size>1000,"圖片內容異常："+path);
    assert.deepEqual(fs.readFileSync(path).subarray(0,8),png,"非 PNG 圖片："+path);
  }
  for(const role of roles){
    assert.equal(role.image,"./images/character-"+role.id+".png",role.name+" 的肖像路徑");
  }
  assert.ok(html.includes('id="character-portrait"'));
  assert.match(js,/portrait\.src=role\.image/);
  assert.match(js,/portrait\.alt=role\.name/);
  assert.match(js,/img\.decode\?\.\(\)/);
  assert.match(js,/#certificate img/);
});

test("圖片載入不會恢復圖片預留文案或干擾既有互動",()=>{
  const html=fs.readFileSync("index.html","utf8");
  const css=fs.readFileSync("css/refinement.css","utf8");
  for(const old of ["圖片預留區","印章預留區","角色圖片預留區"]){
    assert.ok(!html.includes(old),old);
  }
  for(const selector of [
    ".artwork-cover",".artwork-character",".illustration-artwork",
    ".artwork-certificate-mark",".artwork-certificate-seal"
  ])assert.ok(css.includes(selector),selector);
  assert.ok(css.includes("object-fit:contain"),"透明圖片應保留完整畫面");
  assert.ok(css.includes("object-fit:cover"),"角色圖片長寬比已配合肖像構圖");
});

test("五位角色維持原設定，閱讀負擔合理，作息線索有單一對應",()=>{
  const profiles={
    ziqing:{pads:6,night:30,age:12,end:50,days:7,dayPrice:5,nightPrice:9,kind:"中等",
      daily:"上學前先換一片，上午下課、午餐、下午下課、晚餐後各換一片，睡前再換一片",
      nightClue:"夜用款約占三成",positive:["止痛藥","暖暖包"],negative:["沒有另外購買專用洗劑或替換內褲","不買營養補充品"]},
    xinyu:{pads:4,night:25,age:13,end:49,days:5,dayPrice:4,nightPrice:8,kind:"容易",
      daily:"早上出門前換一片，午餐時換一片，傍晚回家再換一片，睡前換成夜用款",
      nightClue:"睡前換成夜用款",positive:["暖暖包","每次經期都會預留購買清潔用品的費用"],negative:["沒有另外買止痛藥","沒有額外購買營養補充品"]},
    yuan:{pads:7,night:40,age:11,end:51,days:6,dayPrice:6,nightPrice:12,kind:"中等",
      daily:"從起床到傍晚大約會用到五片，晚餐後和睡前又各換一片",
      nightClue:"每 10 片約有 4 片是夜用款",positive:["另外添購清潔用品","每個月固定購買"],negative:["沒有另外買止痛藥或暖暖包"]},
    ruoting:{pads:5,night:20,age:14,end:52,days:5,dayPrice:8,nightPrice:13,kind:"容易",
      daily:"早上出門前一片，午餐時、放學前、晚餐後再各換一片，睡前換成夜用款",
      nightClue:"睡前才換夜用款",positive:["止痛藥","暖暖包","專用洗劑","營養補充品"],negative:[]},
    lecheng:{pads:5,night:35,age:12,end:48,days:4,dayPrice:5,nightPrice:10,kind:"中等",
      daily:"早上出門先換一片，上午下課、下午下課、晚餐後和睡前，再各換一片",
      nightClue:"夜用款約占三成半",positive:["止痛藥"],negative:["沒有另外購買"]}
  };
  assert.deepEqual(roles.map(r=>r.id),Object.keys(profiles));
  for(const role of roles){
    const p=profiles[role.id];
    const s=role.story;
    assert.equal(role.settings.padsPerDay,p.pads,role.name+" 使用片數不應被改寫");
    assert.equal(role.settings.nightRatio,p.night,role.name+" 夜用比例不應被改寫");
    assert.ok(s.includes(p.age+" 歲初潮"),role.name+" 初潮年齡直接呈現");
    assert.ok(s.includes(p.end+" 歲停經"),role.name+" 停經年齡直接呈現");
    assert.ok(s.includes("經期約 "+p.days+" 天"),role.name+" 經期天數直接呈現");
    assert.ok(s.includes("每片 "+p.dayPrice+" 元")||s.includes("日用每片 "+p.dayPrice+" 元"),role.name+" 日用單價直接呈現");
    assert.ok(s.includes("每片 "+p.nightPrice+" 元"),role.name+" 夜用單價直接呈現");
    assert.ok(s.includes(p.daily),role.name+" 片數應由簡單生活作息得出");
    assert.ok(s.includes(p.nightClue),role.name+" 夜用比例線索明確");
    for(const line of [...p.positive,...p.negative])assert.ok(s.includes(line),role.name+" 額外需求線索："+line);
    assert.ok(s.length>=140&&s.length<=250,role.name+" 情境應簡短，不變閱讀考試");
    assert.equal(s.split("\n\n").length,3,role.name+" 限三段：歷程、用品、需求");
    assert.doesNotMatch(s,/每 [2345] 小時|這 \d+ 小時|白天大約有 \d+ 小時/,role.name+" 不安排精細計時算術");
    assert.doesNotMatch(s,/(?:每天|一天)\s*(?:大約|約)?\s*[4-7]\s*片/,role.name+" 不直接提供片數答案");
    assert.ok(["容易","中等"].includes(p.kind));
  }
  const html=fs.readFileSync("index.html","utf8");
  assert.match(html,/不必逐小時換算/);
  assert.match(html,/實際更換仍應依經血量與使用需求調整/);
});
