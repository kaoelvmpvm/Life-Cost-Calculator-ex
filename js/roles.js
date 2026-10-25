/* 經彩人生：五位虛構角色，所有數值均落在原試算器控制範圍。 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.JingcaiRoles=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const roles=[
    {id:"ziqing",name:"子晴",subtitle:"忙碌的校園生活",tag:"經期較長",colors:["#3f8580","#e3f3ec"],
     story:"子晴在國中一年級、十二歲那年迎來第一次月經。想像她日後一直到五十歲停經，這段生理歷程會累積多少開銷？\n\n她每次月經通常持續七天，每天大約需要六片衛生棉。平常購買的日用款每片五元、夜用款每片九元；她記錄發現，夜用款大約占全部使用量的三成。\n\n遇到經期不適時，她還會準備止痛藥與暖暖包；這次估算只把這兩項額外支出算進去，替換內褲與經期專用洗劑、補品與鐵質補充劑則不列入。請依照她的生活故事完成試算。",
     settings:{startAge:12,endAge:50,periodDays:7,padsPerDay:6,dayPadPrice:5,nightPadPrice:9,nightRatio:30,painkillers:true,heatPacks:true,laundry:false,supplements:false}},
    {id:"xinyu",name:"昕妤",subtitle:"精打細算的日常",tag:"留意支出",colors:["#aa864f","#fcf1da"],
     story:"昕妤從十三歲開始有月經。她正在整理一份長期生活預算，打算以四十九歲作為這份模擬的停經年齡。\n\n她的經期通常是五天，每天使用四片衛生棉。她會挑選日用每片四元、夜用每片八元的產品；每用四片衛生棉，其中大約一片是夜用款，其餘使用日用款。\n\n為了保暖與清潔，她把暖暖包，以及替換內褲與經期專用洗劑的花費列入每月估算。止痛藥與醫藥費、補品與鐵質補充劑則不計入這次的情境。能從這些文字找出每個設定嗎？",
     settings:{startAge:13,endAge:49,periodDays:5,padsPerDay:4,dayPadPrice:4,nightPadPrice:8,nightRatio:25,painkillers:false,heatPacks:true,laundry:true,supplements:false}},
    {id:"yuan",name:"予安",subtitle:"重視用品與舒適",tag:"使用量較高",colors:["#627da7","#e8eff9"],
     story:"予安回想自己十一歲初潮的那一天，現在正試著推算直到五十一歲停經，可能需要負擔多少生理用品費用。\n\n她的經期約六天，流量與更換需求使她一天會用到七片衛生棉。日用衛生棉一片六元，夜用款則是一片十二元；把十片用品排在一起，其中約四片是夜用款。\n\n這次她也希望算入替換內褲與經期專用洗劑、補品與鐵質補充劑的花費；但止痛藥與醫藥費、暖暖包與熱敷貼不在這份預算裡。請協助她完成生涯成本估算。",
     settings:{startAge:11,endAge:51,periodDays:6,padsPerDay:7,dayPadPrice:6,nightPadPrice:12,nightRatio:40,painkillers:false,heatPacks:false,laundry:true,supplements:true}},
    {id:"ruoting",name:"若庭",subtitle:"偏好較高價用品",tag:"延伸項目齊全",colors:["#a16b58","#f9ebe0"],
     story:"若庭在十四歲那年迎來初潮。她將這份試算的停經年齡設定為五十二歲，希望知道不同用品選擇可能累積多少成本。\n\n每次經期大約五天，她一天會準備五片衛生棉。她偏好日用每片八元、夜用每片十三元的產品；平均使用五片時，其中約一片是夜用款，也就是全部用量的五分之一。\n\n除了衛生棉，她還會把止痛藥與醫藥費、暖暖包與熱敷貼、替換內褲與經期專用洗劑，以及補品與鐵質補充劑全部列入這次每月開銷。你能從這段故事重建她的試算條件嗎？",
     settings:{startAge:14,endAge:52,periodDays:5,padsPerDay:5,dayPadPrice:8,nightPadPrice:13,nightRatio:20,painkillers:true,heatPacks:true,laundry:true,supplements:true}},
    {id:"lecheng",name:"樂澄",subtitle:"經期較短的安排",tag:"較少延伸項目",colors:["#518096","#e2f1f5"],
     story:"樂澄十二歲初潮。為了學習計算生理期的長期經濟負擔，她將人生試算延伸到四十八歲停經。\n\n她的月經通常維持四天，每天約用五片衛生棉。她購買的日用款每片五元，夜用款每片十元；夜用的使用量大約占全部的百分之三十五，其餘是日用款。\n\n除了基本生理用品，她這次只把止痛藥與醫藥費列為額外開銷。暖暖包與熱敷貼、替換內褲與經期專用洗劑、補品與鐵質補充劑都不納入估算。試著用她的經歷找出正確數值。",
     settings:{startAge:12,endAge:48,periodDays:4,padsPerDay:5,dayPadPrice:5,nightPadPrice:10,nightRatio:35,painkillers:true,heatPacks:false,laundry:false,supplements:false}}
  ];
  const fields=Object.freeze([
    {id:"startAge",label:"初潮年齡",unit:"歲",min:8,max:18,step:1},
    {id:"endAge",label:"停經年齡",unit:"歲",min:40,max:60,step:1},
    {id:"periodDays",label:"每次經期天數",unit:"天",min:3,max:10,step:1},
    {id:"padsPerDay",label:"每天衛生棉使用量",unit:"片",min:2,max:10,step:1},
    {id:"dayPadPrice",label:"日用衛生棉單價",unit:"元／片",min:2,max:15,step:.5},
    {id:"nightPadPrice",label:"夜用衛生棉單價",unit:"元／片",min:5,max:25,step:.5},
    {id:"nightRatio",label:"夜用使用比例",unit:"%",min:0,max:60,step:5}
  ]);
  const extras=Object.freeze([
    {id:"painkillers",label:"止痛藥／醫藥費",amount:150},
    {id:"heatPacks",label:"暖暖包／熱敷貼",amount:100},
    {id:"laundry",label:"替換內褲／經期專用洗劑",amount:100},
    {id:"supplements",label:"補品／鐵質補充劑",amount:150}
  ]);
  return Object.freeze({roles:roles.map(x=>Object.freeze({...x,settings:Object.freeze(x.settings)})),fields,extras});
});
