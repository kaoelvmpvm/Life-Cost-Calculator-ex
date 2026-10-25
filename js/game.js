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
  const allowedStages = JingcaiFlow.validStages;
  let state = null;
  let noticeTimeout=null;
  const roleById = id => roleBook.find(x=>x.id===id);
  const roleResult = () => CostModel.calculate(roleById(state.roleId).settings);
  const safelyGet = () => {try{return sessionStorage.getItem(SESSION_KEY)}catch{return null}};
  const safelyPut = value => {try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(value));return true}catch{return false}};
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
        completed: Boolean(raw.completed), successfulConfig: Boolean(raw.successfulConfig),
        draft:raw.draft && typeof raw.draft==="object" ? raw.draft : null
      };
      normalized.stage=JingcaiFlow.recoverStage(normalized);
      normalized.maxStage=Math.max(normalized.stage,normalized.maxStage);
      return normalized;
    } catch { return null; }
  }
  function save() {
    if(!state)return;
    const stored=safelyPut(state);
    const label=$("save-status");
    label.hidden=false;
    const message=stored?"✓ 進度已儲存":"儲存失敗，離開前請另存證書";
    if(label.textContent!==message)label.textContent=message;
    label.classList.toggle("is-error",!stored);
  }
  function notice(message,type=""){
    const el=$("app-notice");el.textContent=message;el.hidden=false;
    el.classList.toggle("is-error",type==="error");
    if(noticeTimeout)clearTimeout(noticeTimeout);
    noticeTimeout=setTimeout(()=>{el.hidden=true;noticeTimeout=null},5500);
  }
  function showFeedback(id,message,type="") {
    const el=$(id);el.textContent=message;el.classList.remove("error","ok");if(type)el.classList.add(type);
  }
  function renderRole() {
    const role=roleById(state.roleId);
    $("character-name").textContent=role.name;
    $("character-subtitle").textContent=role.subtitle;
    $("character-story").textContent=role.story;
    $("character-tag").textContent=role.tag;
    $("mobile-story-name").textContent=role.name+"｜"+role.subtitle;
    $("mobile-story-text").textContent=role.story;
    const portrait=$("character-portrait");
    // Only load the portrait of the current random role, including restored sessions.
    portrait.src=role.image;
    portrait.alt=role.name+"的角色手繪插畫";
    const visual=document.querySelector(".character-visual");
    visual.style.setProperty("--character-tint",role.colors[1]);
    visual.style.setProperty("--character-accent",role.colors[0]);
  }

  function makeCalculator() {
    const values=$("scenario-fields");values.replaceChildren();
    const groupGridByField={};
    for(const group of [
      {title:"01 · 生理歷程",subtitle:"年齡與經期",keys:["startAge","endAge","periodDays"]},
      {title:"02 · 使用習慣",subtitle:"數量與比例",keys:["padsPerDay","nightRatio"]},
      {title:"03 · 用品價格",subtitle:"日用與夜用",keys:["dayPadPrice","nightPadPrice"]}
    ]){
      const section=document.createElement("section");section.className="parameter-group";
      const heading=document.createElement("h4");heading.textContent=group.title;
      const subtitle=document.createElement("small");subtitle.textContent=group.subtitle;
      const header=document.createElement("div");header.className="parameter-group__heading";header.append(heading,subtitle);
      const grid=document.createElement("div");grid.className="parameter-group__fields";
      section.append(header,grid);values.append(section);
      for(const key of group.keys)groupGridByField[key]=grid;
    }
    for (const field of fields) {
      const wrap=document.createElement("div");wrap.className="field";
      const label=document.createElement("label");label.htmlFor="input-"+field.id;label.textContent=field.label;
      const input=document.createElement("input");
      input.type="number";input.id="input-"+field.id;input.min=String(field.min);input.max=String(field.max);
      input.step=String(field.step);
      input.value=state?.draft?.fields?.[field.id]??String(CostModel.DEFAULTS[field.id]);input.required=true;
      const note=document.createElement("small");note.id="hint-"+field.id;note.textContent="範圍："+field.min+"–"+field.max+" "+field.unit;
      const error=document.createElement("span");error.className="field-error";error.id="error-"+field.id;error.hidden=true;
      input.setAttribute("aria-describedby",note.id+" "+error.id);
      wrap.append(label,input,note,error);groupGridByField[field.id].append(wrap);
      input.addEventListener("input",()=>{invalidate();captureDraft();if(input.getAttribute("aria-invalid")==="true")validateField(field);});
      input.addEventListener("blur",()=>validateField(field));
    }
    const extension=$("scenario-extras");extension.replaceChildren();
    for(const item of extras){
      const label=document.createElement("label");label.className="extra-option";
      const input=document.createElement("input");input.id="input-"+item.id;input.type="checkbox";
      input.checked=state?.draft?.extras?.[item.id]??CostModel.DEFAULTS[item.id];input.addEventListener("change",()=>{invalidate();captureDraft();});
      const text=document.createElement("span");text.textContent=item.label;
      const note=document.createElement("small");note.textContent="+ NT$ "+item.amount+"／月";text.append(note);
      label.append(input,text);extension.append(label);
    }
  }
  function captureDraft(){
    if(!state)return;
    state.draft={fields:Object.fromEntries(fields.map(f=>[f.id,$("input-"+f.id).value])),
      extras:Object.fromEntries(extras.map(x=>[x.id,$("input-"+x.id).checked]))};
    save();
  }
  function validateField(field){
    const input=$("input-"+field.id),text=input.value.trim(),value=Number(text);
    const valid=text!==""&&Number.isFinite(value)&&value>=field.min&&value<=field.max
      &&Math.abs(Math.round((value-field.min)/field.step)-(value-field.min)/field.step)<1e-7;
    const error=$("error-"+field.id);
    input.setAttribute("aria-invalid",String(!valid));
    error.hidden=valid;
    error.textContent=valid?"":"請輸入 "+field.min+" 至 "+field.max+"，間隔 "+field.step+" 的數值。";
    return valid;
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
      if(!validateField(f)){
        input.focus();
        throw new Error("請先修正「"+f.label+"」的輸入格式。");
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
      // Calculation does not give away whether the student has matched the character story.
      showFeedback("mission-feedback","");
      return result;
    }catch(error){$("calculation-display").hidden=true;showFeedback("mission-feedback",error.message,"error");return null;}
  }
  function submitPassword(event){
    event.preventDefault();
    try {
      const values=formValues();
      const mismatches=matchingFields(values);
      if(mismatches.length){
        const groups=[
          {keys:["startAge","endAge","periodDays"],label:"生理歷程"},
          {keys:["padsPerDay","nightRatio"],label:"用品使用"},
          {keys:["dayPadPrice","nightPadPrice"],label:"用品單價"},
          {keys:extras.map(x=>x.id),label:"額外開銷"}
        ];
        const suggestions=groups.filter(g=>g.keys.some(k=>mismatches.includes(k))).map(g=>g.label);
        showFeedback("mission-feedback","還有 "+mismatches.length+" 個設定與故事內容不一致。請優先檢查："+suggestions.join("、")+"。","error");
        return;
      }
      const guess=$("password-input").value.replace(/[NT$，,\s]/gi,"");
      if(!/^\d{1,10}$/.test(guess))throw new Error("請輸入不含貨幣符號的正整數金額。");
      const expected=CostModel.calculate(values).totalLifetimeCost;
      if(Number(guess)!==expected){showFeedback("mission-feedback","密碼還不正確。請重新計算總金額，注意輸入的是「生涯」而非單月開銷。","error");return;}
      state.successfulConfig=true;
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
    if(incomplete){
      const ids={poverty:"answer-poverty",location:"answer-location",leave:"answer-leave"};
      const key=keys.find(k=>!String(state.answers[k]||"").trim());
      $(ids[key]).focus();
      notice("請先在目前題目寫下你的想法，再繼續這段故事。","error");
      return false;
    }
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
      const response=$("intention-feedback-"+key);
      const message=JingcaiFeedback.get(key,value);
      response.textContent=message;
      response.hidden=!message;
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
    $("cert-feedback-q1").textContent=JingcaiFeedback.get("q1",state.intentions.q1);
    $("cert-feedback-q2").textContent=JingcaiFeedback.get("q2",state.intentions.q2);
  }
  function advance(to){
    if(!state||!JingcaiFlow.canEnter(state,to))return;
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
    if(state.stage===5){
      populateCertificate();
      // Eagerly fetch the two certificate decorations before students print.
      document.querySelectorAll("#certificate img").forEach(img=>{img.loading="eager";});
    }
    window.scrollTo({top:0,behavior:"auto"});
    const heading=$(stageId[state.stage]).querySelector("h2");
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  function begin(){
    const role=chooseRole();
    state={version:2,roleId:role.id,student:$("student-label").value.trim().slice(0,30),
      stage:1,maxStage:1,answers:{...emptyAnswers},intentions:{q1:"",q2:""},
      completed:false,successfulConfig:false,draft:null};
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
    $("app-confirm").showModal();
  }
  function init(){
    $("start-game").addEventListener("click",begin);
    $("reset-game").addEventListener("click",clear);
    $("dialog-cancel").addEventListener("click",()=>$("app-confirm").close());
    $("dialog-accept").addEventListener("click",()=>{safelyRemove();window.location.reload();});
    $("calculate-now").addEventListener("click",calculate);
    $("password-form").addEventListener("submit",submitPassword);
    $("go-policy").addEventListener("click",()=>{if(checkAnswers(["poverty"]))advance(3)});
    $("go-vote").addEventListener("click",()=>{if(checkAnswers(["location","leave"]))advance(4)});
    document.querySelectorAll("[data-prev]").forEach(node=>node.addEventListener("click",()=>goBack(Number(node.dataset.prev))));
    bindIntentionChoices();
    $("intention-form").addEventListener("submit",finish);
    $("print-certificate").addEventListener("click",async()=>{
      // Ensure images that started offscreen are decoded in the A4 PDF.
      const pictures=Array.from(document.querySelectorAll("#certificate img"));
      await Promise.all(pictures.map(img=>img.decode?.().catch(()=>{})??Promise.resolve()));
      window.print();
    });
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
      save(); // Refresh the persisted draft and the visible save indicator after restoring.
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
