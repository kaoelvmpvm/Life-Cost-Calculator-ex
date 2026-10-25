/* 經彩人生：五位虛構角色，所有數值均落在原試算器控制範圍。 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.JingcaiRoles=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const roles=[
    {id:"ziqing",name:"子晴",subtitle:"忙碌的校園生活",tag:"經期較長",colors:["#bd6d87","#fce5e7"],symbol:"✿",
     story:"子晴常需要在校園活動之間安排生活。為了這次試算，她將經期較長時使用的用品，以及止痛藥、暖暖包列入每月開銷。",
     settings:{startAge:12,endAge:50,periodDays:7,padsPerDay:6,dayPadPrice:5,nightPadPrice:9,nightRatio:30,painkillers:true,heatPacks:true,laundry:false,supplements:false}},
    {id:"xinyu",name:"昕妤",subtitle:"精打細算的日常",tag:"留意支出",colors:["#7aaea4","#dff4ed"],symbol:"☘",
     story:"昕妤習慣記錄生活開銷。這次她選擇較低單價的用品，並將暖暖包與經期清洗用品納入估算。",
     settings:{startAge:13,endAge:49,periodDays:5,padsPerDay:4,dayPadPrice:4,nightPadPrice:8,nightRatio:25,painkillers:false,heatPacks:true,laundry:true,supplements:false}},
    {id:"yuan",name:"予安",subtitle:"重視用品與舒適",tag:"使用量較高",colors:["#8b90c2","#e9eaff"],symbol:"✦",
     story:"予安在這個模擬情境中需要較多用品，並將經期清洗用品與補充品列入每月開銷。",
     settings:{startAge:11,endAge:51,periodDays:6,padsPerDay:7,dayPadPrice:6,nightPadPrice:12,nightRatio:40,painkillers:false,heatPacks:false,laundry:true,supplements:true}},
    {id:"ruoting",name:"若庭",subtitle:"偏好較高價用品",tag:"延伸項目齊全",colors:["#daaa72","#fff0d8"],symbol:"☀",
     story:"若庭在這次試算中偏好單價較高的用品，並把止痛藥、暖暖包、清洗用品和補充品全部納入。",
     settings:{startAge:14,endAge:52,periodDays:5,padsPerDay:5,dayPadPrice:8,nightPadPrice:13,nightRatio:20,painkillers:true,heatPacks:true,laundry:true,supplements:true}},
    {id:"lecheng",name:"樂澄",subtitle:"經期較短的安排",tag:"較少延伸項目",colors:["#92abcc","#e3f1fc"],symbol:"☁",
     story:"樂澄設定的經期天數較短，除了衛生棉之外，這次僅將止痛藥列入延伸開銷。",
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
