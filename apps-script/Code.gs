/**
 * Google 試算表跨裝置投票後端（Google Apps Script / V8）。
 * 學生僅透過 HtmlService + google.script.run 寫入；試算表維持私有。
 * 在 Apps Script 專案「專案設定 → 指令碼屬性」新增：
 *   TEACHER_KEY = 自訂足夠長的教師管理密語（建議至少 16 字元）
 * 試算表：本教材專用，不在此程式中公開任何學生姓名。
 */
const VOTE_DB_ID = '19p_AsOe6_ndC1jEPjnk_hERdGXCE3Ft0g7UePBIZXig';
const TAB_SESSIONS = '投票場次';
const TAB_BALLOTS = '投票紀錄';
const SESSION_HEADERS = ['場次代碼','班級標籤','狀態','建立時間','結束時間'];
const BALLOT_HEADERS = ['投票時間','場次代碼','題號','選項','匿名裝置雜湊'];

function doGet(e) {
  // Embedded learning game sends a random nonce to pair one browser session.
  // The templated value is public session metadata, never a teacher password.
  const nonce = String((e && e.parameter && e.parameter.bridgeNonce) || '');
  const template = HtmlService.createTemplateFromFile('VoteApp');
  template.bridgeNonce = /^[a-f0-9]{24}$/.test(nonce) ? nonce : '';
  return template.evaluate()
    .setTitle('月經平權｜課堂雲端匿名投票')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function database_() { return SpreadsheetApp.openById(VOTE_DB_ID); }

function tab_(name) {
  const sheet = database_().getSheetByName(name);
  if (!sheet) throw new Error('投票資料表尚未初始化；請由教師先執行初始化。');
  return sheet;
}
function requireTeacher_(secret) {
  const valid = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
  if (!valid || valid.length < 16) throw new Error('尚未設定有效的教師管理密語。');
  if (typeof secret !== 'string' || secret !== valid) throw new Error('教師管理密語不正確。');
}
function createTabs_() {
  const book = database_();
  [[TAB_SESSIONS, SESSION_HEADERS],[TAB_BALLOTS, BALLOT_HEADERS]].forEach(([name, headers]) => {
    let sh = book.getSheetByName(name);
    if (!sh) sh = book.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(headers);
      sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#ffe4e6');
      sh.setFrozenRows(1);
    } else {
      const current = sh.getRange(1, 1, 1, headers.length).getValues()[0];
      if (headers.some((heading, index) => heading !== current[index])) {
        throw new Error(name + ' 的表頭不符合預期，已停止操作以保護資料。');
      }
    }
  });
  return true;
}
function setupVotingSheets(teacherSecret) {
  requireTeacher_(teacherSecret);
  return createTabs_();
}
function allData_(sheet) {
  const rows = sheet.getLastRow();
  return rows < 2 ? [] : sheet.getRange(2, 1, rows - 1, sheet.getLastColumn()).getValues();
}
function lookup_(sessionCode) {
  const code = String(sessionCode || '').trim().toUpperCase();
  if (!/^[A-F0-9]{6}$/.test(code)) return null;
  const rows = allData_(tab_(TAB_SESSIONS));
  for (let i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][0]) === code)
      return { code, label: String(rows[i][1] || ''), open: rows[i][2] === '開放', row: i + 2 };
  }
  return null;
}
function tokenHash_(code, token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9-]{24,80}$/.test(token)) throw new Error('無效的匿名裝置識別碼。');
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, code + ':' + token, Utilities.Charset.UTF_8
  );
  return digest.map(byte => ('0' + (byte & 255).toString(16)).slice(-2)).join('');
}
function myVotes_(code, hash) {
  const selected = {};
  allData_(tab_(TAB_BALLOTS)).forEach(row => {
    if (row[1] === code && row[4] === hash) selected[String(row[2])] = String(row[3]);
  });
  return selected;
}
function studentJoin(code, token) {
  const room = lookup_(code);
  if (!room) throw new Error('找不到此班級代碼。');
  return { code: room.code, label: room.label, open: room.open,
    voted: myVotes_(room.code, tokenHash_(room.code, token)) };
}
function studentVote(code, question, option, token) {
  const q = Number(question);
  const value = String(option || '');
  if (![1, 2].includes(q) || !['a','b','c'].includes(value)) throw new Error('不支援的題目或選項。');
  const hash = tokenHash_(String(code || '').trim().toUpperCase(), token);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const room = lookup_(code);
    if (!room) throw new Error('班級代碼不存在。');
    if (!room.open) throw new Error('本場次已關閉投票。');
    const previous = myVotes_(room.code, hash);
    if (previous[String(q)]) return { ok: true, recorded: false, voted: previous, note: '本題已投票，未重複計票。' };
    tab_(TAB_BALLOTS).appendRow([new Date(), room.code, q, value, hash]);
    SpreadsheetApp.flush();
    previous[String(q)] = value;
    return { ok: true, recorded: true, voted: previous, note: '投票成功。' };
  } finally { lock.releaseLock(); }
}
function teacherCreateSession(teacherSecret, label) {
  requireTeacher_(teacherSecret);
  const roomLabel = String(label || '').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0, 35) || '課堂投票';
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    createTabs_();
    let code;
    do { code = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase(); }
    while (lookup_(code));
    tab_(TAB_SESSIONS).appendRow([code, roomLabel, '開放', new Date(), '']);
    return { code, label: roomLabel, open: true };
  } finally { lock.releaseLock(); }
}
function teacherCloseSession(teacherSecret, code) {
  requireTeacher_(teacherSecret);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const room = lookup_(code);
    if (!room) throw new Error('找不到此場次。');
    if (room.open) {
      tab_(TAB_SESSIONS).getRange(room.row, 3, 1, 3).setValues([['結束',
        tab_(TAB_SESSIONS).getRange(room.row, 4).getValue(), new Date()]]);
    }
    return { code: room.code, open: false };
  } finally { lock.releaseLock(); }
}
function teacherListSessions(teacherSecret) {
  requireTeacher_(teacherSecret);
  createTabs_();
  return allData_(tab_(TAB_SESSIONS)).slice(-40).reverse().map(row => ({
    code: String(row[0]), label: String(row[1]), open: row[2] === '開放'
  }));
}
function teacherStats(teacherSecret, code) {
  requireTeacher_(teacherSecret);
  const room = lookup_(code);
  if (!room) throw new Error('找不到此場次。');
  const summary = {
    1: { a:0, b:0, c:0, total:0 },
    2: { a:0, b:0, c:0, total:0 }
  };
  allData_(tab_(TAB_BALLOTS)).forEach(row => {
    if (row[1] !== room.code) return;
    const q = Number(row[2]), a = String(row[3]);
    if (![1, 2].includes(q) || !['a','b','c'].includes(a)) return;
    summary[q][a]++; summary[q].total++;
  });
  return { room: { code:room.code, label:room.label, open:room.open }, questions:summary };
}
