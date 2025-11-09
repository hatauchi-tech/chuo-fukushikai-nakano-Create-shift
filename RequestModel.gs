/**
 * シフト希望モデル（T_シフト希望）
 *
 * @file models/RequestModel.gs
 * @class RequestModel
 * @extends BaseModel
 */
class RequestModel extends BaseModel {
  constructor() {
    super('T_シフト希望');
    this.headers = ['シフト希望ID', '提出者', '提出日', '特記事項'];
  }

  initializeHeaders() {
    const sheet = this.getSheet();
    sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
    sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    Logger.log(`${this.sheetName}のヘッダーを初期化しました`);
  }

  /**
   * シフト希望を追加
   * @param {Object} requestData - シフト希望データ
   * @returns {string} シフト希望ID
   */
  addRequest(requestData) {
    const requestId = requestData.requestId || generateId('REQ_');

    const rowData = [
      requestId,
      requestData.staffName || '',
      formatDate(requestData.submitDate || new Date()),
      requestData.notes || ''
    ];

    this.appendRow(rowData);
    return requestId;
  }

  /**
   * 提出者とシフト希望IDで検索
   * @param {string} staffName - 提出者名
   * @param {Date} targetMonth - 対象月
   * @returns {Object|null} シフト希望データ
   */
  findByStaffAndMonth(staffName, targetMonth) {
    const data = this.getAllData();

    // その月に提出されたリクエストを探す
    const targetYear = targetMonth.getFullYear();
    const targetMonthNum = targetMonth.getMonth();

    const found = data.filter(row => {
      const submitDate = parseDate(row[2]);
      return row[1] === staffName &&
             submitDate &&
             submitDate.getFullYear() === targetYear &&
             submitDate.getMonth() === targetMonthNum;
    });

    if (found.length === 0) return null;

    // 最新のものを返す
    const latest = found[found.length - 1];

    return {
      requestId: latest[0],
      staffName: latest[1],
      submitDate: parseDate(latest[2]),
      notes: latest[3]
    };
  }

  /**
   * 提出者で最新のシフト希望を取得
   * @param {string} staffName - 提出者名
   * @returns {Object|null} シフト希望データ
   */
  getLatestByStaff(staffName) {
    const results = this.findBy(1, staffName);

    if (results.length === 0) return null;

    const latest = results[results.length - 1];

    return {
      requestId: latest.data[0],
      staffName: latest.data[1],
      submitDate: parseDate(latest.data[2]),
      notes: latest.data[3]
    };
  }
}

/**
 * シフト希望詳細モデル（T_シフト希望詳細）
 */
class RequestDetailModel extends BaseModel {
  constructor() {
    super('T_シフト希望詳細');
    this.headers = ['シフト希望詳細ID', 'シフト希望ID', '日付'];
  }

  initializeHeaders() {
    const sheet = this.getSheet();
    sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
    sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    Logger.log(`${this.sheetName}のヘッダーを初期化しました`);
  }

  /**
   * シフト希望詳細を追加
   * @param {Object} detailData - シフト希望詳細データ
   * @returns {string} シフト希望詳細ID
   */
  addRequestDetail(detailData) {
    const detailId = detailData.detailId || generateId('REQDET_');

    const rowData = [
      detailId,
      detailData.requestId || '',
      formatDate(detailData.date) || ''
    ];

    this.appendRow(rowData);
    return detailId;
  }

  /**
   * シフト希望詳細を一括追加
   * @param {string} requestId - シフト希望ID
   * @param {Array<Date>} dates - 日付の配列
   */
  addRequestDetails(requestId, dates) {
    const data = dates.map(date => [
      generateId('REQDET_'),
      requestId,
      formatDate(date)
    ]);

    this.appendRows(data);
  }

  /**
   * シフト希望IDで詳細を取得
   * @param {string} requestId - シフト希望ID
   * @returns {Array<Object>} シフト希望詳細の配列
   */
  getDetailsByRequestId(requestId) {
    const results = this.findBy(1, requestId);
    return results.map(result => ({
      detailId: result.data[0],
      requestId: result.data[1],
      date: parseDate(result.data[2])
    }));
  }

  /**
   * シフト希望IDで詳細を削除
   * @param {string} requestId - シフト希望ID
   */
  deleteByRequestId(requestId) {
    const results = this.findBy(1, requestId);

    // 後ろから削除（行番号がずれないように）
    results.reverse().forEach(result => {
      this.deleteRow(result.rowIndex);
    });

    Logger.log(`シフト希望ID ${requestId} の詳細を削除しました`);
  }

  /**
   * 提出者の休み希望日を取得
   * @param {string} staffName - 提出者名
   * @param {Date} targetMonth - 対象月
   * @returns {Array<Date>} 休み希望日の配列
   */
  getRequestDates(staffName, targetMonth) {
    const requestModel = new RequestModel();
    const request = requestModel.findByStaffAndMonth(staffName, targetMonth);

    if (!request) return [];

    const details = this.getDetailsByRequestId(request.requestId);
    return details.map(detail => detail.date);
  }
}
