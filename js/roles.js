/* 經彩人生：五位虛構角色，所有數值均落在原試算器控制範圍。 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.JingcaiRoles=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const roles=[
    {id:"ziqing",image:"./images/character-ziqing.png",name:"子晴",subtitle:"忙碌的校園生活",tag:"經期較長",colors:["#3f8580","#e3f3ec"],
     story:"子晴 12 歲初潮。在這份生涯推估中，她預計到 50 歲停經；每次月經通常會持續 7 天。\n\n「平日上課、社團和補習，白天大約有 12 小時需要使用衛生棉。我平均每 3 小時就會用掉 1 片，回家後到隔天起床還會再用 2 片。」她平常買的日用款每片 5 元、夜用款每片 9 元。整理一段時間的購買紀錄後，她發現每 10 片裡大約有 3 片是夜用款。\n\n「我很容易經痛，幾乎每次都需要買止痛藥；肚子不舒服時，也會另外準備暖暖包。」至於衣物清潔，她會使用家裡原本就有的用品，不另外買替換內褲或經期專用洗劑；補品和鐵質補充劑也不在她的購物清單上。",
     settings:{startAge:12,endAge:50,periodDays:7,padsPerDay:6,dayPadPrice:5,nightPadPrice:9,nightRatio:30,painkillers:true,heatPacks:true,laundry:false,supplements:false}},
    {id:"xinyu",image:"./images/character-xinyu.png",name:"昕妤",subtitle:"精打細算的日常",tag:"留意支出",colors:["#aa864f","#fcf1da"],
     story:"昕妤 13 歲初潮，預計以 49 歲作為這份試算的停經年齡。她每次經期大約是 5 天。\n\n「我白天從早到晚大約有 12 小時會使用衛生棉，通常每 4 小時才需要用掉 1 片；睡前會再換上 1 片。」日用款每片 4 元，夜用款每片 8 元。她觀察自己常買的用品，平均每 4 片就有 1 片是夜用款。\n\n「我經期通常沒有痛到需要買止痛藥，可是很容易覺得冷，所以都會準備暖暖包。偶爾弄髒衣物，我也會另外買經期專用洗劑清潔。」她沒有額外購買補品或鐵質補充劑的習慣。",
     settings:{startAge:13,endAge:49,periodDays:5,padsPerDay:4,dayPadPrice:4,nightPadPrice:8,nightRatio:25,painkillers:false,heatPacks:true,laundry:true,supplements:false}},
    {id:"yuan",image:"./images/character-yuan.png",name:"予安",subtitle:"重視用品與舒適",tag:"使用量較高",colors:["#627da7","#e8eff9"],
     story:"予安 11 歲初潮。她想推估一直到 51 歲停經的開銷；每次經期大約持續 6 天。\n\n「我的量比較多。從早上 7 點到晚上 10 點，這 15 小時裡差不多每 3 小時就要用掉 1 片；睡覺期間還會再用 2 片。」她買的日用款每片 6 元，夜用款每片 12 元。因為量大時白天也會使用夜用款，所以從長期購買紀錄來看，每 10 片裡約有 4 片是夜用款。\n\n「我比較少經痛，也不需要特別買止痛藥或暖暖包。但經血有時會沾到衣物，所以得另外買清洗用品；我也有定期購買補品與鐵質補充劑的習慣。」",
     settings:{startAge:11,endAge:51,periodDays:6,padsPerDay:7,dayPadPrice:6,nightPadPrice:12,nightRatio:40,painkillers:false,heatPacks:false,laundry:true,supplements:true}},
    {id:"ruoting",image:"./images/character-ruoting.png",name:"若庭",subtitle:"偏好較高價用品",tag:"延伸項目齊全",colors:["#a16b58","#f9ebe0"],
     story:"若庭 14 歲初潮，將這份生涯試算設定到 52 歲停經。她每次月經大約會持續 5 天。\n\n「白天清醒的 12 小時裡，我平均每 3 小時就會用掉 1 片；晚上上床睡覺前，會再換上 1 片夜用款。」她偏好單價較高的用品：日用每片 8 元、夜用每片 13 元。她平常使用的衛生棉大約每 5 片就有 1 片是夜用款。\n\n「我的經痛有時很明顯，經期一定會準備止痛藥和暖暖包。擔心弄髒衣物，我也會購買替換內褲、經期專用洗劑；此外還會另外買補品或鐵質補充劑。」想想看，這些生活習慣會讓她多出哪些開銷？",
     settings:{startAge:14,endAge:52,periodDays:5,padsPerDay:5,dayPadPrice:8,nightPadPrice:13,nightRatio:20,painkillers:true,heatPacks:true,laundry:true,supplements:true}},
    {id:"lecheng",image:"./images/character-lecheng.png",name:"樂澄",subtitle:"經期較短的安排",tag:"較少延伸項目",colors:["#518096","#e2f1f5"],
     story:"樂澄 12 歲初潮。在這個模擬情境裡，她預計到 48 歲停經；每次月經通常只持續 4 天。\n\n「我從早上 8 點到晚上 8 點，大約 12 小時會使用衛生棉；平均每 3 小時就用掉 1 片，睡前再換上 1 片。」她習慣購買日用每片 5 元、夜用每片 10 元的用品。她偶爾在白天也選擇夜用款，所以統計一段時間後，每 20 片裡約有 7 片是夜用款。\n\n「我很容易經痛，幾乎每次月經都需要買止痛藥。」不過，她通常不會購買暖暖包，清洗衣物也沿用家裡原有的用品，不另買替換內褲或經期專用洗劑；補品與鐵質補充劑也不另外購買。",
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
