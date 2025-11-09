/**
 * シフトマスタモデル
 *
 * @file models/ShiftModel.gs
 * @class ShiftModel
 * @extends BaseModel
 */
class ShiftModel extends BaseModel {
  constructor() {
    super('M_シフト');
    this.headers = ['シフトID', 'シフト名', '開始時間', '終了時間'];
  }

  initializeHeaders() {
    const sheet = this.getSheet();
    sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
    sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    Logger.log(`${this.sheetName}のヘッダーを初期化しました`);
  }

  /**
   * シフトを追加
   * @param {Object} shiftData - シフトデータ
   * @returns {string} シフトID
   */
  addShift(shiftData) {
    const shiftId = shiftData.shiftId || generateId('SHIFT_');

    const rowData = [
      shiftId,
      shiftData.name || '',
      shiftData.startTime || '',
      shiftData.endTime || ''
    ];

    this.appendRow(rowData);
    return shiftId;
  }

  /**
   * すべてのシフトを取得
   * @returns {Array<Object>} シフトデータの配列
   */
  getAllShifts() {
    const data = this.getAllData();
    return data.map(row => ({
      shiftId: row[0],
      name: row[1],
      startTime: row[2],
      endTime: row[3]
    }));
  }

  /**
   * シフト名のリストを取得
   * @returns {Array<string>} シフト名の配列
   */
  getShiftNames() {
    const shifts = this.getAllShifts();
    return shifts.map(shift => shift.name);
  }

  /**
   * シフト名からシフトIDを取得
   * @param {string} shiftName - シフト名
   * @returns {string|null} シフトID
   */
  getShiftIdByName(shiftName) {
    const result = this.findBy(1, shiftName);
    return result.length > 0 ? result[0].data[0] : null;
  }
}

/**
 * シフト表モデル（T_シフト表）
 */
class ShiftTableModel extends BaseModel {
  constructor() {
    super('T_シフト表');
    this.headers = ['シフト表ID', '出力者', '年月', 'グループ', 'ファイルパス'];
  }

  initializeHeaders() {
    const sheet = this.getSheet();
    sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
    sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    Logger.log(`${this.sheetName}のヘッダーを初期化しました`);
  }

  /**
   * シフト表を追加
   * @param {Object} tableData - シフト表データ
   * @returns {string} シフト表ID
   */
  addShiftTable(tableData) {
    const tableId = tableData.tableId || generateId('TABLE_');

    const rowData = [
      tableId,
      tableData.outputBy || '',
      formatDate(tableData.yearMonth) || '',
      toEnumList(tableData.groups) || '',
      tableData.filePath || ''
    ];

    this.appendRow(rowData);
    return tableId;
  }

  /**
   * シフト表を年月・グループで検索
   * @param {Date} yearMonth - 年月
   * @param {Array<string>} groups - グループ
   * @returns {Object|null} シフト表データ
   */
  findByYearMonthAndGroup(yearMonth, groups) {
    const data = this.getAllData();
    const targetDate = formatDate(yearMonth);
    const targetGroups = toEnumList(groups);

    const found = data.find(row =>
      row[2] === targetDate &&
      row[3] === targetGroups
    );

    if (!found) return null;

    return {
      tableId: found[0],
      outputBy: found[1],
      yearMonth: parseDate(found[2]),
      groups: parseEnumList(found[3]),
      filePath: found[4]
    };
  }
}

/**
 * シフト表詳細モデル（T_シフト表詳細）
 */
class ShiftTableDetailModel extends BaseModel {
  constructor() {
    super('T_シフト表詳細');
    this.headers = ['履歴ID', 'シフト表ID', '日付', '従業員名', '勤務シフト'];
  }

  initializeHeaders() {
    const sheet = this.getSheet();
    sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
    sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    Logger.log(`${this.sheetName}のヘッダーを初期化しました`);
  }

  /**
   * シフト詳細を追加
   * @param {Object} detailData - シフト詳細データ
   * @returns {string} 履歴ID
   */
  addShiftDetail(detailData) {
    const historyId = detailData.historyId || generateId('DETAIL_');

    const rowData = [
      historyId,
      detailData.tableId || '',
      formatDate(detailData.date) || '',
      detailData.staffName || '',
      detailData.shiftName || ''
    ];

    this.appendRow(rowData);
    return historyId;
  }

  /**
   * シフト詳細を一括追加
   * @param {string} tableId - シフト表ID
   * @param {Array<Object>} details - シフト詳細の配列
   */
  addShiftDetails(tableId, details) {
    const data = details.map(detail => [
      generateId('DETAIL_'),
      tableId,
      formatDate(detail.date),
      detail.staffName,
      detail.shiftName
    ]);

    this.appendRows(data);
  }

  /**
   * シフト表IDで詳細を取得
   * @param {string} tableId - シフト表ID
   * @returns {Array<Object>} シフト詳細の配列
   */
  getDetailsByTableId(tableId) {
    const results = this.findBy(1, tableId);
    return results.map(result => ({
      historyId: result.data[0],
      tableId: result.data[1],
      date: parseDate(result.data[2]),
      staffName: result.data[3],
      shiftName: result.data[4]
    }));
  }

  /**
   * シフト表IDで詳細を削除
   * @param {string} tableId - シフト表ID
   */
  deleteByTableId(tableId) {
    const results = this.findBy(1, tableId);

    // 後ろから削除（行番号がずれないように）
    results.reverse().forEach(result => {
      this.deleteRow(result.rowIndex);
    });

    Logger.log(`シフト表ID ${tableId} の詳細を削除しました`);
  }
}
