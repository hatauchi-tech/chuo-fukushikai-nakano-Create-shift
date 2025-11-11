/**
 * 設定管理クラス
 * スクリプトプロパティから設定情報を取得
 *
 * @file Config.gs
 * @class Config
 */
class Config {
  constructor() {
    this.scriptProperties = PropertiesService.getScriptProperties();
  }

  /**
   * スプレッドシートIDを取得
   * @returns {string} スプレッドシートID
   */
  getSpreadsheetId() {
    const id = this.scriptProperties.getProperty('SPREADSHEET_ID');
    if (!id) {
      throw new Error('SPREADSHEET_IDが設定されていません。スクリプトプロパティを確認してください。');
    }
    return id;
  }

  /**
   * GoogleドライブIDを取得
   * @returns {string} ドライブID
   */
  getDriveId() {
    const id = this.scriptProperties.getProperty('DRIVE_FOLDER_ID');
    if (!id) {
      throw new Error('DRIVE_FOLDER_IDが設定されていません。スクリプトプロパティを確認してください。');
    }
    return id;
  }

  /**
   * Gemini APIキーを取得
   * @returns {string} APIキー
   */
  getGeminiApiKey() {
    try {
      const key = this.scriptProperties.getProperty('GEMINI_API_KEY');
      if (!key) {
        Logger.log('エラー: GEMINI_API_KEYが設定されていません');
        throw new Error('GEMINI_API_KEYが設定されていません。Config.setProperties()を実行してスクリプトプロパティを設定してください。');
      }
      return key;
    } catch (error) {
      Logger.log('getGeminiApiKeyでエラー: ' + error.message);
      throw error;
    }
  }

  /**
   * Gemini APIモデル名を取得
   * @returns {string} モデル名
   */
  getGeminiModel() {
    return this.scriptProperties.getProperty('GEMINI_MODEL') || 'gemini-pro';
  }

  /**
   * スプレッドシートオブジェクトを取得
   * @returns {Spreadsheet} スプレッドシートオブジェクト
   */
  getSpreadsheet() {
    return SpreadsheetApp.openById(this.getSpreadsheetId());
  }

  /**
   * スクリプトプロパティを設定する（初期設定用）
   * @param {string} spreadsheetId - スプレッドシートID
   * @param {string} driveFolderId - ドライブフォルダID
   * @param {string} geminiApiKey - Gemini APIキー
   * @param {string} geminiModel - Gemini APIモデル名
   */
  static setProperties(spreadsheetId, driveFolderId, geminiApiKey, geminiModel = 'gemini-1.5-flash') {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperties({
      'SPREADSHEET_ID': spreadsheetId,
      'DRIVE_FOLDER_ID': driveFolderId,
      'GEMINI_API_KEY': geminiApiKey,
      'GEMINI_MODEL': geminiModel
    });
    Logger.log('スクリプトプロパティを設定しました。');
  }

  /**
   * 現在の設定を表示（デバッグ用）
   */
  static showProperties() {
    const scriptProperties = PropertiesService.getScriptProperties();
    const props = scriptProperties.getProperties();

    // APIキーはマスクして表示
    const maskedProps = {};
    for (const key in props) {
      if (key === 'GEMINI_API_KEY') {
        maskedProps[key] = props[key].substring(0, 10) + '...';
      } else {
        maskedProps[key] = props[key];
      }
    }

    Logger.log('現在のスクリプトプロパティ:');
    Logger.log(JSON.stringify(maskedProps, null, 2));
    return maskedProps;
  }
}

/**
 * セットアップ用メニューを作成
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('シフトアプリ設定')
    .addItem('プロパティ表示', 'showCurrentProperties')
    .addItem('スプレッドシート初期化', 'initializeSpreadsheet')
    .addItem('サンプルデータ投入', 'insertSampleData')
    .addToUi();
}

/**
 * 現在のプロパティを表示
 */
function showCurrentProperties() {
  const props = Config.showProperties();
  const ui = SpreadsheetApp.getUi();
  ui.alert('現在の設定', JSON.stringify(props, null, 2), ui.ButtonSet.OK);
}
