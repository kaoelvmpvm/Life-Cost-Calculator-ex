/* 經彩人生闖關引擎。
   前四關沿用原教材與計算公式；第五關只保存個人意向，不使用雲端投票。
   選擇與反思記錄均只保存在目前瀏覽器分頁。 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const SESSION_KEY = "jingcai-life-game-v1";
  const money = amount => new Intl.NumberFormat("zh-TW",{maximumFractionDigits:0}).format(amount);
  const roleBook = JingcaiRoles.roles;
  const fields = JingcaiRoles.fields;
  const extras = JingcaiRoles.extras;
  const emptyAnswers = {poverty:"",location:"",leave:""};
  const allowedStages = [1,2,3,4,5];
  let state = null;
  const roleById = id => roleBook.find(x=>x.id===id);
  const roleResult = () => CostModel.calculate(roleById(state.roleId).settings);
  const safelyGet = () => {try{return sessionStorage.getItem(SESSION_KEY)}catch{return null}};
  const safelyPut = value => {try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(value))}catch{}};
  const safelyRemove = () => {try{sessionStorage.removeItem(SESSION_KEY)}catch{}};
  function chooseRole() {
    if(typeof crypto!=="undefined"&&crypto.getRandomValues){
      const n=new Uint32Array(1);
      const limit = Math.floor(0x100000000/roleBook.length)*roleBook.length;
      do{crypto.getRandomValues(n)}while(n[0]>=limit);
      return roleBook[n[0]%roleBook.length];
    }
    return roleBook[Math.floor(Math.random()*roleBook.length)];
  }

  function restore() {
    try {
      const raw = JSON.parse(safelyGet() || "null");
      if(!raw || ![1,2].includes(raw.version) || !roleById(raw.roleId) || !allowedStages.includes(raw.stage)
        || !allowedStages.includes(raw.maxStage))return null;
      const normalized = {
        version:2, roleId:raw.roleId, student:String(raw.student||"").slice(0,30),
        stage:raw.stage, maxStage:raw.maxStage,
        answers:{
          poverty:String(raw.answers?.poverty||"").slice(0,5000),
          location:String(raw.answers?.location||"").slice(0,5000),
          leave:String(raw.answers?.leave||"").slice(0,5000)
        },
        intentions:{
          q1:["a","b","c"].includes(raw.intentions?.q1) ? raw.intentions.q1 : "",
          q2:["a","b","c"].includes(raw.intentions?.q2) ? raw.intentions.q2 : ""
        },
        completed: Boolean(raw.completed), successfulConfig: Boolean(raw.successfulConfig)
      };
      if(normalized.stage===5 && (!normalized.completed || !normalized.intentions.q1 || !normalized.intentions.q2)) normalized.stage=4;
      return normalized;
    } catch { return null; }
  }
  function save() { if(state)safelyPut(state); }
  function showFeedback(id,message,type="") {
    const el=$(id);el.textContent=message;el.classList.remove("error","ok");if(type)el.classList.add(type);
  }
  function renderRole() {
    const role=roleById(state.roleId);
    $("character-name").textContent=role.name;
    $("character-subtitle").textContent=role.subtitle;
    $("character-story").textContent=role.story;
    $("character-tag").textContent=role.tag;
    const visual=document.querySelector(".character-visual");
    visual.style.background="linear-gradient(145deg,"+role.colors[1]+",#f9e4e9)";
    $("character-portrait").style.filter="drop-shadow(0 6px 10px "+role.colors[0]+"28)";
    const clues=$("character-clues");
    clues.replaceChildren();
    const clueData=[
      ["生理歷程",role.settings.startAge+" 歲初潮／"+role.settings.endAge+" 歲停經"],
      ["經期與使用量","每次 "+role.settings.periodDays+" 天／每日 "+role.settings.padsPerDay+" 片"],
      ["衛生棉價格","日用 NT$"+role.settings.dayPadPrice+"／夜用 NT$"+role.settings.nightPadPrice],
      ["夜用比例",role.settings.nightRatio+"%（其餘為日用）"],
      ["每月延伸項目",extras.filter(x=>role.settings[x.id]).map(x=>x.label).join("、")||"本次均不列入"]
    ];
    clueData.forEach(([label,value])=>{
      const row=document.createElement("div");row.className="clue-row";
      const n=document.createElement("span");n.textContent=label;
      const v=document.createElement("strong");v.textContent=value;
      row.append(n,v);clues.append(row);
    });
  }

  function makeCalculator() {
    const values=$("scenario-fields");values.replaceChildren();
    for (const field of fields) {
      const wrap=document.createElement("div");wrap.className="field";
      const label=document.createElement("label");label.htmlFor="input-"+field.id;label.textContent=field.label;
      const input=document.createElement("input");
      input.type="number";input.id="input-"+field.id;input.min=String(field.min);input.max=String(field.max);
      input.step=String(field.step);input.value=String(CostModel.DEFAULTS[field.id]);input.required=true;
      const note=document.createElement("small");note.textContent="範圍："+field.min+"–"+field.max+" "+field.unit;
      wrap.append(label,input,note);values.append(wrap);
      input.addEventListener("input",invalidate);
    }
    const extension=$("scenario-extras");extension.replaceChildren();
    for(const item of extras){
      const label=document.createElement("label");label.className="extra-option";
      const input=document.createElement("input");input.id="input-"+item.id;input.type="checkbox";
      input.checked=CostModel.DEFAULTS[item.id];input.addEventListener("change",invalidate);
      const text=document.createElement("span");text.textContent=item.label;
      const note=document.createElement("small");note.textContent="+ NT$ "+item.amount+"／月";text.append(note);
      label.append(input,text);extension.append(label);
    }
  }
  function invalidate(){
    $("calculation-display").hidden=true;
    $("calculation-detail").textContent="";
    showFeedback("mission-feedback","");
  }
  function formValues() {
    const v={};
    for(const f of fields) {
      const input=$("input-"+f.id),num=Number(input.value);
      if(!input.value.trim() || !Number.isFinite(num) || num<f.min || num>f.max
        || Math.abs(Math.round((num-f.min)/f.step)-(num-f.min)/f.step)>1e-7){
        throw new Error("請檢查「"+f.label+"」的輸入範圍與刻度。");
      }
      v[f.id]=num;
    }
    for(const x of extras)v[x.id]=$("input-"+x.id).checked;
    return v;
  }
  function matchingFields(values){
    const expected=roleById(state.roleId).settings;
    return [...fields.map(x=>x.id),...extras.map(x=>x.id)].filter(key=>values[key]!==expected[key]);
  }
  function calculate() {
    try {
      const values=formValues(),result=CostModel.calculate(values);
      $("calculation-display").hidden=false;
      $("calculated-sum").textContent="NT$ "+money(result.totalLifetimeCost);
      $("calculation-detail").textContent="估計月經 "+result.totalCycles+" 次，單月 NT$ "+money(result.totalMonthlyCost)+"。";
      const count=matchingFields(values).length;
      if(count)showFeedback("mission-feedback","目前有 "+count+" 個設定與角色檔案不同；請核對左側線索。","error");
      else showFeedback("mission-feedback","設定已與角色檔案相符！請輸入生涯總金額作為通關密碼。","ok");
      return result;
    }catch(error){$("calculation-display").hidden=true;showFeedback("mission-feedback",error.message,"error");return null;}
  }
  function submitPassword(event){
    event.preventDefault();
    try {
      const values=formValues();
      const mismatches=matchingFields(values);
      if(mismatches.length){showFeedback("mission-feedback","還有 "+mismatches.length+" 個設定未符合角色檔案，請重新核對後再試。","error");return;}
      const guess=$("password-input").value.replace(/[NT$，,\s]/gi,"");
      if(!/^\d{1,10}$/.test(guess))throw new Error("請輸入不含貨幣符號的正整數金額。");
      const expected=CostModel.calculate(values).totalLifetimeCost;
      if(Number(guess)!==expected){showFeedback("mission-feedback","密碼還不正確。請重新計算總金額，注意輸入的是「生涯」而非單月開銷。","error");return;}
      state.successfulConfig=true;
      showFeedback("mission-feedback","解密成功！", "ok");
      advance(2);
    }catch(error){showFeedback("mission-feedback",error.message,"error");}
  }

  function renderInsight() {
    const role=roleById(state.roleId),r=roleResult();
    $("insight-character").textContent=role.name;
    $("insight-total-value").textContent="NT$ "+money(r.totalLifetimeCost);
    for(const id of ["boba","bento","iphone","flight"]) {
      const val=r.equivalents[id];
      $("life-eq-"+id).textContent=typeof val==="number"?money(val):val;
    }
  }
  function bindAnswers() {
    for(const [key,id] of Object.entries({poverty:"answer-poverty",location:"answer-location",leave:"answer-leave"})){
      const node=$(id);
      node.value=state.answers[key] || "";
      node.addEventListener("input",()=>{state.answers[key]=node.value.slice(0,5000);save();});
    }
  }
  function checkAnswers(keys){
    const incomplete=keys.some(k=>!String(state.answers[k]||"").trim());
    if(incomplete){window.alert("請先完成本關的思辨回答。這些文字只會被保存，不會進行對錯評分。");return false;}
    return true;
  }
  // These answers are personal intentions, not an anonymous class poll.
  const intentionValues = new Set(["a","b","c"]);
  function bindIntentionChoices() {
    for (const key of ["q1","q2"]) {
      document.querySelectorAll('input[name="intention-'+key+'"]').forEach(radio=>{
        radio.addEventListener("change",()=>{
          if (!state || !radio.checked) return;
          state.intentions[key]=intentionValues.has(radio.value) ? radio.value : "";
          save();
          renderIntentionUI();
        });
      });
    }
  }
  function renderIntentionUI() {
    if (!state) return;
    for (const key of ["q1","q2"]) {
      const value=state.intentions[key];
      document.querySelectorAll('input[name="intention-'+key+'"]').forEach(radio=>{
        radio.checked=(radio.value===value);
      });
    }
    const complete=Boolean(state.intentions.q1&&state.intentions.q2);
    $("finish-game").disabled=!complete;
    showFeedback("vote-status",complete
      ? "兩項選擇已紀錄，現在可以領取學習證書。"
      : "請在兩道題目各選擇一項。",complete ? "ok" : "");
  }
  function selectedIntentionText(key) {
    const value=state?.intentions?.[key];
    if(!intentionValues.has(value)) return "尚未選擇";
    const radio=document.querySelector('input[name="intention-'+key+'"][value="'+value+'"]');
    return radio?.closest("label")?.querySelector(".intention-option__label")?.textContent?.trim() || "尚未選擇";
  }
  function populateCertificate() {
    const r=roleResult(),role=roleById(state.roleId);
    $("cert-student").textContent=state.student.trim()||"自主學習者";
    $("cert-date").textContent=new Date().toLocaleDateString("zh-TW",{year:"numeric",month:"long",day:"numeric",timeZone:"Asia/Taipei"});
    $("cert-role").textContent=role.name+"・"+role.subtitle;
    $("cert-cost").textContent="NT$ "+money(r.totalLifetimeCost);
    const eq=r.equivalents;
    $("cert-equivalent-line").textContent="珍珠奶茶 "+money(eq.boba)+" 杯　｜　豐盛便當 "+money(eq.bento)+" 個　｜　iPhone "+eq.iphone+" 支　｜　日本來回機票 "+eq.flight+" 趟";
    $("cert-poverty").textContent=state.answers.poverty;
    $("cert-location").textContent=state.answers.location;
    $("cert-leave").textContent=state.answers.leave;
    $("cert-vote-q1").textContent=selectedIntentionText("q1");
    $("cert-vote-q2").textContent=selectedIntentionText("q2");
  }
  function advance(to){
    if(!state||!allowedStages.includes(to))return;
    state.stage=to;state.maxStage=Math.max(state.maxStage,to);
    save();renderStage();
  }
  function renderStage(){
    $("intro").hidden=true;
    $("game-workspace").hidden=false;
    $("reset-game").hidden=false;
    const stageId={1:"stage-mission",2:"stage-insight",3:"stage-policy",4:"stage-vote",5:"stage-certificate"};
    const titles={1:"第一～二關・角色成本解密",2:"第三關・數據思辨",3:"第四關・政策思辨",4:"第五關・個人意向",5:"完成挑戰・學習證書"};
    for(const key of allowedStages)$(stageId[key]).hidden=state.stage!==key;
    $("journey-title").textContent=titles[state.stage];
    $("status-label").textContent=state.stage===5?"已完成學習挑戰":"闖關中・"+titles[state.stage];
    document.querySelectorAll("[data-stage-pill]").forEach(node=>{
      const number=Number(node.dataset.stagePill);
      node.classList.toggle("active",number===state.stage);
      node.classList.toggle("done",number<state.stage||number<state.maxStage);
      node.setAttribute("aria-current",number===state.stage?"step":"false");
    });
    if(state.stage===4)renderIntentionUI();
    if(state.stage===5)populateCertificate();
    window.scrollTo({top:0,behavior:"auto"});
  }
  function begin(){
    const role=chooseRole();
    state={version:1,roleId:role.id,student:$("student-label").value.trim().slice(0,30),
      stage:1,maxStage:1,answers:{...emptyAnswers},intentions:{q1:"",q2:""},
      completed:false,successfulConfig:false};
    renderRole();makeCalculator();bindAnswers();renderInsight();save();renderStage();
  }
  function goBack(to) {
    if(!state||to>state.maxStage)return;
    advance(to);
  }
  function finish(event){
    event.preventDefault();
    if(!state || !state.successfulConfig || !checkAnswers(["poverty","location","leave"]))return;
    if(!intentionValues.has(state.intentions.q1) || !intentionValues.has(state.intentions.q2)){
      showFeedback("vote-status","請先在兩道題目各選擇一個意向，才能產生證書。","error");
      renderIntentionUI();
      return;
    }
    state.completed=true;advance(5);
  }
  function clear(){
    if(!window.confirm("確定重新開始嗎？目前角色、試算進度與三段思辨紀錄將清空。"))return;
    safelyRemove();window.location.reload();
  }
  function init(){
    $("start-game").addEventListener("click",begin);
    $("reset-game").addEventListener("click",clear);
    $("calculate-now").addEventListener("click",calculate);
    $("password-form").addEventListener("submit",submitPassword);
    $("go-policy").addEventListener("click",()=>{if(checkAnswers(["poverty"]))advance(3)});
    $("go-vote").addEventListener("click",()=>{if(checkAnswers(["location","leave"]))advance(4)});
    document.querySelectorAll("[data-prev]").forEach(node=>node.addEventListener("click",()=>goBack(Number(node.dataset.prev))));
    bindIntentionChoices();
    $("intention-form").addEventListener("submit",finish);
    $("print-certificate").addEventListener("click",()=>window.print());
    $("back-to-vote").addEventListener("click",()=>goBack(4));
    const old=restore();
    if(old){
      state=old;
      renderRole();makeCalculator();bindAnswers();renderInsight();
      if(state.successfulConfig){
        const settings=roleById(state.roleId).settings;
        for(const f of fields)$("input-"+f.id).value=String(settings[f.id]);
        for(const f of extras)$("input-"+f.id).checked=settings[f.id];
        calculate();
        $("password-input").value=String(roleResult().totalLifetimeCost);
      }
      renderStage();
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
