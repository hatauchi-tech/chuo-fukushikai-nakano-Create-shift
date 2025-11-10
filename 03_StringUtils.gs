/**
 * 文字列ユーティリティ
 *
 * @file utils/StringUtils.gs
 */

/**
 * ユニークIDを生成
 * @param {string} prefix - プレフィックス
 * @returns {string} ユニークID
 */
function generateId(prefix = '') {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

/**
 * 文字列が空かチェック
 * @param {string} str - チェックする文字列
 * @returns {boolean} 空ならtrue
 */
function isEmpty(str) {
  return !str || str.trim() === '';
}

/**
 * EnumList形式の文字列を配列に変換
 * @param {string} enumListStr - カンマ区切りの文字列
 * @returns {Array<string>} 配列
 */
function parseEnumList(enumListStr) {
  if (!enumListStr) return [];
  return enumListStr.split(',').map(item => item.trim()).filter(item => item);
}

/**
 * 配列をEnumList形式の文字列に変換
 * @param {Array<string>} array - 配列
 * @returns {string} カンマ区切りの文字列
 */
function toEnumList(array) {
  if (!Array.isArray(array)) return '';
  return array.join(',');
}

/**
 * グループの配列に指定グループが含まれているかチェック
 * @param {string} enumListStr - EnumList形式の文字列
 * @param {string} targetGroup - チェックするグループ
 * @returns {boolean} 含まれていればtrue
 */
function hasGroup(enumListStr, targetGroup) {
  const groups = parseEnumList(enumListStr);
  return groups.includes(targetGroup);
}

/**
 * 複数のグループに少なくとも1つマッチするかチェック
 * @param {string} enumListStr - EnumList形式の文字列
 * @param {Array<string>} targetGroups - チェックするグループの配列
 * @returns {boolean} マッチすればtrue
 */
function hasAnyGroup(enumListStr, targetGroups) {
  const groups = parseEnumList(enumListStr);
  return targetGroups.some(target => groups.includes(target));
}
