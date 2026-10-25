/* 經彩人生：五位虛構角色，所有數值均落在原試算器控制範圍。 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.JingcaiRoles=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const roles=[
    {id:"ziqing",image:"./images/character-ziqing.png",name:"子晴",subtitle:"忙碌的校園生活",tag:"經期較長",colors:["#3f8580","#e3f3ec"],
     story:"子晴 12 歲初潮，這次以 50 歲停經估算，每次經期約 7 天。\n\n「上學前先換一片，上午下課、午餐、下午下課、晚餐後各換一片，睡前再換一片。」她買的日用衛生棉每片 5 元、夜用每片 9 元。有時白天也會使用夜用款，長期買下來，夜用款約占三成。\n\n「我經期常會經痛，所以會另外買止痛藥，也習慣準備暖暖包熱敷。」清潔衣物時，她使用家中原有的用品，沒有另外購買專用洗劑或替換內褲，也不買營養補充品。",
     settings:{startAge:12,endAge:50,periodDays:7,padsPerDay:6,dayPadPrice:5,nightPadPrice:9,nightRatio:30,painkillers:true,heatPacks:true,laundry:false,supplements:false}},
    {id:"xinyu",image:"./images/character-xinyu.png",name:"昕妤",subtitle:"精打細算的日常",tag:"留意支出",colors:["#aa864f","#fcf1da"],
     story:"昕妤 13 歲初潮，預計 49 歲停經，每次經期約 5 天。\n\n「我早上出門前換一片，午餐時換一片，傍晚回家再換一片，睡前換成夜用款。」她買的日用衛生棉每片 4 元、夜用每片 8 元。\n\n「經期腹部不舒服時，我習慣另外買暖暖包熱敷，但沒有另外買止痛藥。衣物有時會沾到經血，所以我每次經期都會預留購買清潔用品的費用。」她沒有額外購買營養補充品的習慣。",
     settings:{startAge:13,endAge:49,periodDays:5,padsPerDay:4,dayPadPrice:4,nightPadPrice:8,nightRatio:25,painkillers:false,heatPacks:true,laundry:true,supplements:false}},
    {id:"yuan",image:"./images/character-yuan.png",name:"予安",subtitle:"重視用品與舒適",tag:"使用量較高",colors:["#627da7","#e8eff9"],
     story:"予安 11 歲初潮，這次以 51 歲停經估算，每次經期約 6 天。\n\n「我的經血量比較多，從起床到傍晚大約會用到五片，晚餐後和睡前又各換一片。」日用衛生棉每片 6 元、夜用每片 12 元。為了減少滲漏，她白天有時也使用夜用款；長期購買下來，每 10 片約有 4 片是夜用款。\n\n「我不太會經痛，所以沒有另外買止痛藥或暖暖包；但為了處理衣物沾染，我會另外添購清潔用品。營養補充品則是我個人每個月固定購買的東西。」",
     settings:{startAge:11,endAge:51,periodDays:6,padsPerDay:7,dayPadPrice:6,nightPadPrice:12,nightRatio:40,painkillers:false,heatPacks:false,laundry:true,supplements:true}},
    {id:"ruoting",image:"./images/character-ruoting.png",name:"若庭",subtitle:"偏好較高價用品",tag:"延伸項目齊全",colors:["#a16b58","#f9ebe0"],
     story:"若庭 14 歲初潮，這次以 52 歲停經估算，每次經期約 5 天。\n\n「早上出門前一片，午餐時、放學前、晚餐後再各換一片，睡前換成夜用款。」她偏好日用每片 8 元、夜用每片 13 元的衛生棉；白天使用日用款，睡前才換夜用款。\n\n「我經痛時會另外買止痛藥，也會準備暖暖包熱敷。經期偶爾會弄髒衣物，所以我每次都會編列替換內褲或專用洗劑的費用；此外，我每個月也會自行購買營養補充品。」",
     settings:{startAge:14,endAge:52,periodDays:5,padsPerDay:5,dayPadPrice:8,nightPadPrice:13,nightRatio:20,painkillers:true,heatPacks:true,laundry:true,supplements:true}},
    {id:"lecheng",image:"./images/character-lecheng.png",name:"樂澄",subtitle:"經期較短的安排",tag:"較少延伸項目",colors:["#518096","#e2f1f5"],
     story:"樂澄 12 歲初潮，這次以 48 歲停經估算，每次經期約 4 天。\n\n「早上出門先換一片，上午下課、下午下課、晚餐後和睡前，再各換一片。」她買的日用衛生棉每片 5 元、夜用每片 10 元。有時白天也會用夜用款，所以長期使用下來，夜用款約占三成半。\n\n「我容易經痛，每次月經都會為止痛藥預留一筆費用。」至於暖暖包、替換內褲或經期專用洗劑，以及營養補充品，她都沒有另外購買。",
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
