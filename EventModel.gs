/**
 * イベントモデル（T_イベント）
 *
 * @file models/EventModel.gs
 * @class EventModel
 * @extends BaseModel
 */
class EventModel extends BaseModel {
  constructor() {
    super('T_イベント');
    this.headers = [
      'イベントID',
      '登録日時',
      '登録者',
      'イベント日',
      'グループ',
      'ユニット',
      '内容'
    ];
  }

  initializeHeaders() {
    const sheet = this.getSheet();
    sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
    sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    Logger.log(`${this.sheetName}のヘッダーを初期化しました`);
  }

  /**
   * イベントを追加
   * @param {Object} eventData - イベントデータ
   * @returns {string} イベントID
   */
  addEvent(eventData) {
    const eventId = eventData.eventId || generateId('EVENT_');

    const rowData = [
      eventId,
      formatDateTime(eventData.registeredAt || new Date()),
      eventData.registeredBy || '',
      formatDate(eventData.eventDate) || '',
      toEnumList(eventData.groups) || '',
      eventData.unit || '',
      eventData.content || ''
    ];

    this.appendRow(rowData);
    return eventId;
  }

  /**
   * イベントを更新
   * @param {string} eventId - イベントID
   * @param {Object} eventData - 更新するイベントデータ
   * @returns {boolean} 成功したかどうか
   */
  updateEvent(eventId, eventData) {
    const result = this.findById(eventId, 0);

    if (!result) {
      Logger.log(`イベントID ${eventId} が見つかりません`);
      return false;
    }

    const rowData = [
      eventId,
      result.data[1], // 登録日時は変更しない
      result.data[2], // 登録者も変更しない
      eventData.eventDate !== undefined ? formatDate(eventData.eventDate) : result.data[3],
      eventData.groups !== undefined ? toEnumList(eventData.groups) : result.data[4],
      eventData.unit !== undefined ? eventData.unit : result.data[5],
      eventData.content !== undefined ? eventData.content : result.data[6]
    ];

    this.updateRow(result.rowIndex, rowData);
    return true;
  }

  /**
   * イベントを削除
   * @param {string} eventId - イベントID
   * @returns {boolean} 成功したかどうか
   */
  deleteEvent(eventId) {
    const result = this.findById(eventId, 0);

    if (!result) {
      Logger.log(`イベントID ${eventId} が見つかりません`);
      return false;
    }

    this.deleteRow(result.rowIndex);
    return true;
  }

  /**
   * グループとユニットでフィルタリングしてイベントを取得
   * @param {string|Array<string>} groups - グループ
   * @param {string} unit - ユニット（オプション）
   * @param {Date} startDate - 開始日（オプション）
   * @param {Date} endDate - 終了日（オプション）
   * @returns {Array<Object>} イベントデータの配列
   */
  getEvents(groups, unit = null, startDate = null, endDate = null) {
    const targetGroups = Array.isArray(groups) ? groups : [groups];
    const data = this.getAllData();

    return data
      .filter(row => {
        // グループフィルタ
        const eventGroups = parseEnumList(row[4]);
        const groupMatch = targetGroups.some(target => eventGroups.includes(target));

        if (!groupMatch) return false;

        // ユニットフィルタ
        if (unit && row[5] !== unit && row[5] !== '') {
          return false;
        }

        // 日付フィルタ
        if (startDate || endDate) {
          const eventDate = parseDate(row[3]);

          if (startDate && eventDate < startDate) return false;
          if (endDate && eventDate > endDate) return false;
        }

        return true;
      })
      .map(row => ({
        eventId: row[0],
        registeredAt: parseDate(row[1]),
        registeredBy: row[2],
        eventDate: parseDate(row[3]),
        groups: parseEnumList(row[4]),
        unit: row[5],
        content: row[6]
      }))
      .sort((a, b) => a.eventDate - b.eventDate); // 日付順にソート
  }

  /**
   * 月のイベントを取得
   * @param {string|Array<string>} groups - グループ
   * @param {string} unit - ユニット
   * @param {Date} yearMonth - 年月
   * @returns {Array<Object>} イベントデータの配列
   */
  getMonthEvents(groups, unit, yearMonth) {
    const firstDay = getFirstDayOfMonth(yearMonth);
    const lastDay = getLastDayOfMonth(yearMonth);

    return this.getEvents(groups, unit, firstDay, lastDay);
  }

  /**
   * すべてのイベントを取得
   * @returns {Array<Object>} イベントデータの配列
   */
  getAllEvents() {
    const data = this.getAllData();

    return data.map(row => ({
      eventId: row[0],
      registeredAt: parseDate(row[1]),
      registeredBy: row[2],
      eventDate: parseDate(row[3]),
      groups: parseEnumList(row[4]),
      unit: row[5],
      content: row[6]
    }));
  }
}
