/**
 * 職員マスタモデル
 *
 * @file models/StaffModel.gs
 * @class StaffModel
 * @extends BaseModel
 */
class StaffModel extends BaseModel {
  constructor() {
    super('M_職員');
    this.headers = [
      '従業員ID',
      '所属',
      '役職',
      'グループ',
      'ユニット',
      '氏名',
      '喀痰吸引資格者',
      '勤務配慮',
      '権限',
      '雇用形態',
      '有効',
      'PW'
    ];
  }

  /**
   * ヘッダー行を初期化
   */
  initializeHeaders() {
    const sheet = this.getSheet();
    sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
    sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    Logger.log(`${this.sheetName}のヘッダーを初期化しました`);
  }

  /**
   * 職員データを追加
   * @param {Object} staffData - 職員データ
   * @returns {string} 生成された従業員ID
   */
  addStaff(staffData) {
    const staffId = staffData.staffId || generateId('STAFF_');

    const rowData = [
      staffId,
      staffData.department || '',
      staffData.position || '',
      toEnumList(staffData.groups) || '',
      staffData.unit || '',
      staffData.name || '',
      staffData.isSuctionCertified || false,
      staffData.workConsiderations || '',
      staffData.role || '一般',
      staffData.employmentType || '常勤',
      staffData.isActive !== false, // デフォルトtrue
      staffData.password || 'password123'
    ];

    this.appendRow(rowData);
    return staffId;
  }

  /**
   * 職員データを更新
   * @param {string} staffId - 従業員ID
   * @param {Object} staffData - 更新する職員データ
   * @returns {boolean} 成功したかどうか
   */
  updateStaff(staffId, staffData) {
    const result = this.findById(staffId, 0);

    if (!result) {
      Logger.log(`職員ID ${staffId} が見つかりません`);
      return false;
    }

    const rowData = [
      staffId,
      staffData.department !== undefined ? staffData.department : result.data[1],
      staffData.position !== undefined ? staffData.position : result.data[2],
      staffData.groups !== undefined ? toEnumList(staffData.groups) : result.data[3],
      staffData.unit !== undefined ? staffData.unit : result.data[4],
      staffData.name !== undefined ? staffData.name : result.data[5],
      staffData.isSuctionCertified !== undefined ? staffData.isSuctionCertified : result.data[6],
      staffData.workConsiderations !== undefined ? staffData.workConsiderations : result.data[7],
      staffData.role !== undefined ? staffData.role : result.data[8],
      staffData.employmentType !== undefined ? staffData.employmentType : result.data[9],
      staffData.isActive !== undefined ? staffData.isActive : result.data[10],
      staffData.password !== undefined ? staffData.password : result.data[11]
    ];

    this.updateRow(result.rowIndex, rowData);
    return true;
  }

  /**
   * 職員を削除（論理削除）
   * @param {string} staffId - 従業員ID
   * @returns {boolean} 成功したかどうか
   */
  deleteStaff(staffId) {
    return this.updateStaff(staffId, { isActive: false });
  }

  /**
   * 有効な職員のみを取得
   * @returns {Array<Object>} 職員データの配列
   */
  getActiveStaffs() {
    const data = this.getAllData();
    return data
      .filter(row => row[10] === true) // 有効フラグ
      .map(this._rowToObject.bind(this));
  }

  /**
   * グループでフィルタリングして職員を取得
   * @param {string|Array<string>} groups - グループ（単一または配列）
   * @returns {Array<Object>} 職員データの配列
   */
  getStaffsByGroup(groups) {
    const targetGroups = Array.isArray(groups) ? groups : [groups];
    const data = this.getAllData();

    return data
      .filter(row => row[10] === true) // 有効フラグ
      .filter(row => {
        const staffGroups = parseEnumList(row[3]);
        return targetGroups.some(target => staffGroups.includes(target));
      })
      .map(this._rowToObject.bind(this));
  }

  /**
   * 認証チェック
   * @param {string} name - 氏名
   * @param {string} password - パスワード
   * @returns {Object|null} 認証成功時は職員オブジェクト、失敗時はnull
   */
  authenticate(name, password) {
    const data = this.getAllData();

    const staffRow = data.find(row =>
      row[5] === name && // 氏名
      row[11] === password && // パスワード
      row[10] === true // 有効フラグ
    );

    return staffRow ? this._rowToObject(staffRow) : null;
  }

  /**
   * 行データをオブジェクトに変換
   * @param {Array} row - 行データ
   * @returns {Object} 職員オブジェクト
   * @private
   */
  _rowToObject(row) {
    return {
      staffId: row[0],
      department: row[1],
      position: row[2],
      groups: parseEnumList(row[3]),
      unit: row[4],
      name: row[5],
      isSuctionCertified: row[6],
      workConsiderations: row[7],
      role: row[8],
      employmentType: row[9],
      isActive: row[10],
      password: row[11]
    };
  }

  /**
   * 名前のリストを取得
   * @param {string|Array<string>} groups - フィルタリングするグループ（オプション）
   * @returns {Array<string>} 氏名の配列
   */
  getStaffNames(groups = null) {
    const staffs = groups ? this.getStaffsByGroup(groups) : this.getActiveStaffs();
    return staffs.map(staff => staff.name);
  }
}
