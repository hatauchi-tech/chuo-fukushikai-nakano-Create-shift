/**
 * ベースモデルクラス
 * すべてのモデルの基底クラス
 *
 * @file models/BaseModel.gs
 * @class BaseModel
 */
class BaseModel {
  /**
   * @param {string} sheetName - シート名
   */
  constructor(sheetName) {
    this.sheetName = sheetName;
    this.config = new Config();
    this.ss = this.config.getSpreadsheet();
  }

  /**
   * シートを取得（存在しない場合は作成）
   * @returns {Sheet} シートオブジェクト
   */
  getSheet() {
    let sheet = this.ss.getSheetByName(this.sheetName);
    if (!sheet) {
      sheet = this.ss.insertSheet(this.sheetName);
      this.initializeHeaders();
    }
    return sheet;
  }

  /**
   * ヘッダー行を初期化（サブクラスでオーバーライド）
   */
  initializeHeaders() {
    // サブクラスで実装
  }

  /**
   * 全データを取得
   * @returns {Array<Array>} データの2次元配列
   */
  getAllData() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return [];
    }

    const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    return range.getValues();
  }

  /**
   * データを1行追加
   * @param {Array} rowData - 行データの配列
   */
  appendRow(rowData) {
    const sheet = this.getSheet();
    sheet.appendRow(rowData);
    Logger.log(`${this.sheetName}にデータを追加しました: ${JSON.stringify(rowData)}`);
  }

  /**
   * 複数行を一括追加
   * @param {Array<Array>} data - データの2次元配列
   */
  appendRows(data) {
    if (!data || data.length === 0) return;

    const sheet = this.getSheet();
    const startRow = sheet.getLastRow() + 1;

    sheet.getRange(startRow, 1, data.length, data[0].length).setValues(data);
    Logger.log(`${this.sheetName}に${data.length}行追加しました`);
  }

  /**
   * 特定の行を更新
   * @param {number} row - 行番号（1始まり、ヘッダー含む）
   * @param {Array} rowData - 行データの配列
   */
  updateRow(row, rowData) {
    const sheet = this.getSheet();
    sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
    Logger.log(`${this.sheetName}の${row}行目を更新しました`);
  }

  /**
   * 特定の行を削除
   * @param {number} row - 行番号（1始まり、ヘッダー含む）
   */
  deleteRow(row) {
    const sheet = this.getSheet();
    sheet.deleteRow(row);
    Logger.log(`${this.sheetName}の${row}行目を削除しました`);
  }

  /**
   * 条件に一致する行を検索
   * @param {number} columnIndex - 検索する列のインデックス（0始まり）
   * @param {*} value - 検索値
   * @returns {Array<Object>} 一致した行のオブジェクト配列
   */
  findBy(columnIndex, value) {
    const data = this.getAllData();
    const results = [];

    data.forEach((row, index) => {
      if (row[columnIndex] === value) {
        results.push({
          rowIndex: index + 2, // ヘッダー分+1、0始まり補正+1
          data: row
        });
      }
    });

    return results;
  }

  /**
   * IDで1件検索
   * @param {string} id - ID
   * @param {number} idColumnIndex - IDの列インデックス（デフォルト0）
   * @returns {Object|null} 見つかった行のオブジェクト、またはnull
   */
  findById(id, idColumnIndex = 0) {
    const results = this.findBy(idColumnIndex, id);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * データをすべてクリア（ヘッダーは残す）
   */
  clearAllData() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }

    Logger.log(`${this.sheetName}のデータをクリアしました`);
  }

  /**
   * シート全体をクリア
   */
  clearSheet() {
    const sheet = this.getSheet();
    sheet.clear();
    Logger.log(`${this.sheetName}をクリアしました`);
  }
}
