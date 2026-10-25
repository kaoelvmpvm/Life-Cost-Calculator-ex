/* 經彩人生｜闖關流程的純函式守衛。畫面層不得繞過先決條件。 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.JingcaiFlow=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const validStages=Object.freeze([1,2,3,4,5]);
  const hasAnswer=(state,key)=>Boolean(String(state?.answers?.[key]||"").trim());
  const hasIntentions=state=>["q1","q2"].every(key=>["a","b","c"].includes(state?.intentions?.[key]));
  function canEnter(state,stage){
    if(!state||!validStages.includes(stage))return false;
    if(stage===1)return true;
    if(!state.successfulConfig)return false;
    if(stage===2)return true;
    if(!hasAnswer(state,"poverty"))return false;
    if(stage===3)return true;
    if(!hasAnswer(state,"location")||!hasAnswer(state,"leave"))return false;
    if(stage===4)return true;
    return Boolean(state.completed)&&hasIntentions(state);
  }
  function recoverStage(state){
    let stage=validStages.includes(state?.stage)?state.stage:1;
    while(stage>1&&!canEnter(state,stage))stage-=1;
    return stage;
  }
  return Object.freeze({validStages,canEnter,recoverStage});
});
