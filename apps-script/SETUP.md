# Google 投票頁：啟用「兩題投票後自動解鎖」功能

本 repo 使用原有 Google 試算表（不更換資料庫）：

https://docs.google.com/spreadsheets/d/19p_AsOe6_ndC1jEPjnk_hERdGXCE3Ft0g7UePBIZXig/edit

Google Apps Script 網頁應用程式現有網址：

https://script.google.com/macros/s/AKfycbwwQYPz2wsbVN8C4J2_BaGqpfZj-QakXVdnHOrHp48vvRUfeUXhW2_KvBCiy0J-NXnX/exec

## 必須在 Google Apps Script 編輯器完成的更新

此 GitHub 專案能編輯 GitHub 檔案，但不能因此自動替換或部署你 Google 帳號內既有的 Apps Script 專案。

1. 開啟 Google 試算表，點「擴充功能 → Apps Script」。
2. 點左側的 `Code.gs`（可能顯示「程式碼.gs」）；用本 repo 的 **[apps-script/Code.gs](Code.gs)** 全文替換原程式碼。注意不要再保留預設 `function myFunction(){...}` 外框。
3. 點 `VoteApp.html`，用本 repo **[apps-script/VoteApp.html](VoteApp.html)** 全文替換。
4. 儲存後確認 Apps Script 指令碼屬性中原有的 `TEACHER_KEY` 仍存在；**不要把這組密語寫進 GitHub 或學生頁面**。
5. 點「部署 → 管理部署作業 → 編輯（鉛筆） → 版本：新增版本 → 部署」。請編輯**原有部署**而不是新建部署，以保留網址。
6. 重新整理闖關版網站，進入第五關。當學生在雲端投票頁用班級代碼完成 Q1 與 Q2，投票頁會根據後端的已投紀錄，向教材網站發出本分頁對應的完成訊號；教材收到後可直接解鎖證書，不需自行勾選。

## 驗收

- 教師端可建立投票場次、看到 Q1/Q2 個別累計票數；原有試算表票數繼續保存。
- 學生端登入場次後投兩題，闖關網站出現「已收到兩題完成訊號」，才能直接領證。
- 尚未部署新版 Google Apps Script 時，投票仍可使用，但不會自動通知闖關網頁；學習頁必須使用標示清楚的**自我確認備援**。
- 如 Google 網頁應用程式在嵌入時因瀏覽器 Cookie 或 iframe 政策無法使用，可選「在新分頁開啟」再回來自我確認；**新分頁的完成訊號不會自動傳到原闖關分頁**。

## 設計界線

- 只有 Apps Script 後端透過 `studentJoin` 或 `studentVote` 回傳的 Q1/Q2 紀錄皆已存在時，投票頁才會產生「完成兩題」訊號。
- 瀏覽器接收端驗證來源網域與本分頁隨機 nonce；此機制是供教學進度使用，不是具法律效力或防作弊保證的身分證明。
- Google 試算表的投票明細不分享給學生；學習證書不包含任何具體投票選項。
- 因為 Q1 涉及生理用品使用經驗，務必避免在其他教學頁面展示學生與選項的對應關係。
