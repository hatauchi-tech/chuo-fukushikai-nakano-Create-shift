/**
 * 日付ユーティリティ
 *
 * @file utils/DateUtils.gs
 */

/**
 * 日付をyyyy/MM/dd形式の文字列に変換
 * @param {Date} date - 日付オブジェクト
 * @returns {string} フォーマットされた日付文字列
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * 日付をyyyy/MM/dd HH:mm:ss形式の文字列に変換
 * @param {Date} date - 日付オブジェクト
 * @returns {string} フォーマットされた日時文字列
 */
function formatDateTime(date) {
  if (!(date instanceof Date)) {
    return '';
  }
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * 文字列をDateオブジェクトに変換
 * @param {string} dateStr - 日付文字列
 * @returns {Date} 日付オブジェクト
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr);
}

/**
 * 月の最初の日を取得
 * @param {Date} date - 基準日
 * @returns {Date} 月の最初の日
 */
function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 月の最後の日を取得
 * @param {Date} date - 基準日
 * @returns {Date} 月の最後の日
 */
function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * 月の日数を取得
 * @param {Date} date - 基準日
 * @returns {number} その月の日数
 */
function getDaysInMonth(date) {
  return getLastDayOfMonth(date).getDate();
}

/**
 * 翌月の1日を取得
 * @param {Date} date - 基準日
 * @returns {Date} 翌月の1日
 */
function getNextMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/**
 * 前月の1日を取得
 * @param {Date} date - 基準日
 * @returns {Date} 前月の1日
 */
function getPreviousMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

/**
 * 日付の配列を生成
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {Array<Date>} 日付の配列
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * 月の全日付を取得
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {Array<Date>} その月の全日付
 */
function getMonthDates(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = getLastDayOfMonth(firstDay);
  return getDateRange(firstDay, lastDay);
}

/**
 * 曜日を取得（日本語）
 * @param {Date} date - 日付
 * @returns {string} 曜日（日、月、火、水、木、金、土）
 */
function getJapaneseWeekday(date) {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return weekdays[date.getDay()];
}

/**
 * 日付が同じかチェック
 * @param {Date} date1 - 日付1
 * @param {Date} date2 - 日付2
 * @returns {boolean} 同じ日付ならtrue
 */
function isSameDate(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}
