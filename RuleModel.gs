/**
 * ルールモデル（M_ルール）
 *
 * @file models/RuleModel.gs
 * @class RuleModel
 * @extends BaseModel
 */
class RuleModel extends BaseModel {
  constructor() {
    super('M_ルール');
    this.headers = ['ルールID', 'ルール名', '内容', '重要度'];
  }

  initializeHeaders() {
    const sheet = this.getSheet();
    sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
    sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    Logger.log(`${this.sheetName}のヘッダーを初期化しました`);
  }

  /**
   * ルールを追加
   * @param {Object} ruleData - ルールデータ
   * @returns {string} ルールID
   */
  addRule(ruleData) {
    const ruleId = ruleData.ruleId || generateId('RULE_');

    const rowData = [
      ruleId,
      ruleData.name || '',
      ruleData.content || '',
      ruleData.priority || '中'
    ];

    this.appendRow(rowData);
    return ruleId;
  }

  /**
   * ルールを更新
   * @param {string} ruleId - ルールID
   * @param {Object} ruleData - 更新するルールデータ
   * @returns {boolean} 成功したかどうか
   */
  updateRule(ruleId, ruleData) {
    const result = this.findById(ruleId, 0);

    if (!result) {
      Logger.log(`ルールID ${ruleId} が見つかりません`);
      return false;
    }

    const rowData = [
      ruleId,
      ruleData.name !== undefined ? ruleData.name : result.data[1],
      ruleData.content !== undefined ? ruleData.content : result.data[2],
      ruleData.priority !== undefined ? ruleData.priority : result.data[3]
    ];

    this.updateRow(result.rowIndex, rowData);
    return true;
  }

  /**
   * ルールを削除
   * @param {string} ruleId - ルールID
   * @returns {boolean} 成功したかどうか
   */
  deleteRule(ruleId) {
    const result = this.findById(ruleId, 0);

    if (!result) {
      Logger.log(`ルールID ${ruleId} が見つかりません`);
      return false;
    }

    this.deleteRow(result.rowIndex);
    return true;
  }

  /**
   * すべてのルールを取得
   * @returns {Array<Object>} ルールデータの配列
   */
  getAllRules() {
    const data = this.getAllData();

    return data.map(row => ({
      ruleId: row[0],
      name: row[1],
      content: row[2],
      priority: row[3]
    }));
  }

  /**
   * ルールを重要度順に取得
   * @returns {Array<Object>} ルールデータの配列
   */
  getRulesByPriority() {
    const rules = this.getAllRules();

    const priorityOrder = {
      '最高': 1,
      '高': 2,
      '中': 3,
      '低': 4,
      '最低': 5
    };

    return rules.sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 3;
      const priorityB = priorityOrder[b.priority] || 3;
      return priorityA - priorityB;
    });
  }

  /**
   * Gemini APIに渡すルールテキストを生成
   * @returns {string} ルールテキスト
   */
  getRulesText() {
    const rules = this.getRulesByPriority();

    const rulesText = rules.map((rule, index) => {
      return `【ルール${index + 1}】${rule.name}（重要度: ${rule.priority}）\n${rule.content}`;
    }).join('\n\n');

    return rulesText;
  }
}
