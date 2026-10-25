/* 第五關｜六種個人意向的教育性回饋。只鼓勵觀察與持續思考，不判定對錯。 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.JingcaiFeedback=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const feedback=Object.freeze({
    q1:Object.freeze({
      a:"你留意到用品不足可能影響經期照護。願這份觀察成為關心資源可近性的起點，也持續尊重每個人的處境。",
      b:"你看見用品充足帶來的便利。期待你也留意身邊是否有人面臨不同條件，讓支持更容易被取得。",
      c:"願意承認自己還不清楚，是理解議題的第一步。期待你在生活中多聆聽、多觀察，讓判斷更有依據。"
    }),
    q2:Object.freeze({
      a:"你重視就近取得與隱私，這是友善環境的重要考量。期待你也能思考補充與維護方式，讓措施更可行。",
      b:"你留意到健康中心可能提供的專業協助。接著可以思考，怎麼讓有需要的人不必承受領取壓力。",
      c:"你看見師長協助與熟悉管道的價值。也期待你持續思考，如何讓每位學生都能自在而自主地取得用品。"
    })
  });
  function get(question,choice){
    return feedback[question]?.[choice]||"";
  }
  return Object.freeze({feedback,get});
});
