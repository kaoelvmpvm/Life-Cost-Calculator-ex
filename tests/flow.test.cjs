const test=require("node:test");
const assert=require("node:assert/strict");
const {canEnter,recoverStage}=require("../js/flow.js");
function state(){
  return {stage:1,successfulConfig:false,completed:false,
    answers:{poverty:"",location:"",leave:""},
    intentions:{q1:"",q2:""}};
}
test("關卡狀態守衛拒絕跳關與未完成記錄",()=>{
  const s=state();
  assert.equal(canEnter(s,1),true);
  for(let k=2;k<=5;k++)assert.equal(canEnter(s,k),false);
  s.successfulConfig=true;
  assert.equal(canEnter(s,2),true);
  assert.equal(canEnter(s,3),false);
  s.answers.poverty="我的判斷";
  assert.equal(canEnter(s,3),true);
  assert.equal(canEnter(s,4),false);
  s.answers.location="廁所旁";s.answers.leave="有條件支持";
  assert.equal(canEnter(s,4),true);
  assert.equal(canEnter(s,5),false);
  s.intentions={q1:"c",q2:"a"};s.completed=true;
  assert.equal(canEnter(s,5),true);
  assert.equal(canEnter(s,0),false);
  assert.equal(canEnter(s,9),false);
});
test("恢復瀏覽器紀錄時將不完整關卡退回最近有效階段",()=>{
  const s=state();
  s.stage=5;
  assert.equal(recoverStage(s),1);
  s.successfulConfig=true;
  assert.equal(recoverStage(s),2);
  s.answers.poverty="已回答";
  assert.equal(recoverStage(s),3);
  s.answers.location="已回答";s.answers.leave="已回答";
  assert.equal(recoverStage(s),4);
  s.intentions={q1:"b",q2:"c"};s.completed=true;
  assert.equal(recoverStage(s),5);
});
