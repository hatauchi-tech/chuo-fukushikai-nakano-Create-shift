/**
 * AIシフト作成アプリ
 * メインエントリーポイント
 *
 * @file Code.gs
 * @description Webアプリケーションのメインエントリーポイント
 */

/**
 * Webアプリケーションのエントリーポイント（GET）
 * @param {Object} e - イベントオブジェクト
 * @returns {HtmlOutput} HTMLページ
 */
function doGet(e) {
  try {
    Logger.log('doGet started');
    Logger.log('Page parameter: ' + (e.parameter ? e.parameter.page : 'none'));

    // セッション情報の確認
    const userProperties = PropertiesService.getUserProperties();
    const sessionUser = userProperties.getProperty('sessionUser');

    Logger.log('Session user: ' + (sessionUser ? 'exists' : 'null'));

    // ページパラメータを取得
    const page = e.parameter ? e.parameter.page : null;

    // ログイン画面は常に表示可能
    if (!page || page === 'login') {
      return renderPage('Login');
    }

    // それ以外のページはログインが必要
    if (!sessionUser) {
      Logger.log('Session not found, redirecting to login');
      return renderPage('Login');
    }

    // ページパラメータに基づいてルーティング
    // staff/leader/masterすべてStaffDashboard（SPA）を表示
    switch(page) {
      case 'staff':
      case 'leader':
      case 'master':
        return renderPage('StaffDashboard');
      default:
        return renderPage('Login');
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return HtmlService.createHtmlOutput('エラーが発生しました: ' + error.toString());
  }
}

/**
 * Webアプリケーションのエントリーポイント（POST）
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function doPost(e) {
  try {
    Logger.log('doPost started');
    Logger.log('Parameters: ' + JSON.stringify(e.parameter));

    const action = e.parameter.action;

    // アクションに基づいてルーティング
    switch(action) {
      case 'login':
        return handleLogin(e);
      case 'logout':
        return handleLogout(e);
      case 'submitRequest':
        return handleSubmitRequest(e);
      case 'generateShift':
        return handleGenerateShift(e);
      case 'updateShift':
        return handleUpdateShift(e);
      case 'exportPdf':
        return handleExportPdf(e);
      case 'saveStaff':
        return handleSaveStaff(e);
      case 'saveEvent':
        return handleSaveEvent(e);
      default:
        return createJsonResponse(false, 'Invalid action');
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createJsonResponse(false, error.toString());
  }
}

/**
 * HTMLページをレンダリング
 * @param {string} pageName - ページ名
 * @returns {HtmlOutput} HTMLページ
 */
function renderPage(pageName) {
  const template = HtmlService.createTemplateFromFile(pageName);
  return template.evaluate()
    .setTitle('AIシフト作成アプリ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTMLファイルのインクルード（ビュー内で使用）
 * @param {string} filename - ファイル名
 * @returns {string} ファイルの内容
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * スクリプトのURLを取得（クライアント側から呼び出し）
 * @returns {string} スクリプトURL
 */
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * JSON形式のレスポンスを作成
 * @param {boolean} success - 成功フラグ
 * @param {*} data - データまたはエラーメッセージ
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function createJsonResponse(success, data) {
  const response = success ? { success: true, data: data } : { success: false, error: data };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * テスト用: スプレッドシートの初期化
 */
function initializeSpreadsheet() {
  const config = new Config();
  const spreadsheetId = config.getSpreadsheetId();
  const ss = SpreadsheetApp.openById(spreadsheetId);

  // 各シートの作成
  const sheets = [
    'T_シフト表',
    'T_シフト表詳細',
    'T_シフト希望',
    'T_シフト希望詳細',
    'T_イベント',
    'M_職員',
    'M_シフト',
    'M_ルール'
  ];

  sheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('Created sheet: ' + sheetName);
    }
  });

  Logger.log('Spreadsheet initialization completed');
}
