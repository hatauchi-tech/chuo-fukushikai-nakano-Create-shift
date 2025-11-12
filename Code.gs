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
    Logger.log('=== doGet started ===');
    Logger.log('e.parameter: ' + JSON.stringify(e.parameter));

    // ページパラメータを取得
    let page = e.parameter ? e.parameter.page : null;
    Logger.log('Page parameter: ' + page);

    // セッション情報の確認
    const userProperties = PropertiesService.getUserProperties();
    const sessionUser = userProperties.getProperty('sessionUser');
    Logger.log('Session user: ' + (sessionUser ? 'exists' : 'null'));

    // ログアウトまたは明示的なログイン画面要求
    if (page === 'login') {
      Logger.log('Rendering Login page (explicit request)');
      return renderPage('Login');
    }

    // セッションが存在する場合の自動ルーティング
    if (sessionUser && !page) {
      // ログイン済みでページ指定なし→ロールに基づいて自動判定
      try {
        const user = JSON.parse(sessionUser);
        page = user.role === '管理者' ? 'leader' : 'staff';
        Logger.log('Auto-routing logged-in user to: ' + page);
      } catch (error) {
        Logger.log('Session parse error: ' + error.toString());
        return renderPage('Login');
      }
    }

    // ページパラメータなし＆セッションなし→ログイン画面
    if (!page) {
      Logger.log('No page parameter and no session, rendering Login');
      return renderPage('Login');
    }

    // それ以外のページはログインが必要
    if (!sessionUser) {
      Logger.log('Session not found, redirecting to login');
      return renderPage('Login');
    }

    // ページパラメータに基づいてルーティング
    Logger.log('Routing to page: ' + page);
    switch(page) {
      case 'staff':
        Logger.log('Rendering StaffDashboard');
        return renderPage('StaffDashboard');
      case 'leader':
        Logger.log('Rendering LeaderDashboard');
        return renderPage('LeaderDashboard');
      case 'master':
        Logger.log('Rendering MasterManagement');
        return renderPage('MasterManagement');
      default:
        Logger.log('Unknown page, rendering Login');
        return renderPage('Login');
    }
  } catch (error) {
    Logger.log('=== Error in doGet ===');
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    return HtmlService.createHtmlOutput(
      '<h1>エラーが発生しました</h1>' +
      '<p>' + error.toString() + '</p>' +
      '<pre>' + error.stack + '</pre>'
    );
  }
}

/**
 * Webアプリケーションのエントリーポイント（POST）
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function doPost(e) {
  try {
    Logger.log('=== doPost started ===');
    Logger.log('Parameters: ' + JSON.stringify(e.parameter));

    const action = e.parameter.action;
    Logger.log('Action: ' + action);

    if (!action) {
      Logger.log('エラー: actionパラメータが指定されていません');
      return createJsonResponse(false, 'actionパラメータが必要です');
    }

    // アクションに基づいてルーティング
    switch(action) {
      case 'login':
        Logger.log('Routing to: handleLogin');
        return handleLogin(e);
      case 'logout':
        Logger.log('Routing to: handleLogout');
        return handleLogout(e);
      case 'submitRequest':
        Logger.log('Routing to: handleSubmitRequest');
        return handleSubmitRequest(e);
      case 'generateShift':
        Logger.log('Routing to: handleGenerateShift');
        return handleGenerateShift(e);
      case 'confirmShift':
        Logger.log('Routing to: handleConfirmShift');
        return handleConfirmShift(e);
      case 'updateShift':
        Logger.log('Routing to: handleUpdateShift');
        return handleUpdateShift(e);
      case 'exportPdf':
        Logger.log('Routing to: handleExportPdf');
        return handleExportPdf(e);
      case 'saveStaff':
        Logger.log('Routing to: handleSaveStaff');
        return handleSaveStaff(e);
      case 'saveEvent':
        Logger.log('Routing to: handleSaveEvent');
        return handleSaveEvent(e);
      default:
        Logger.log('エラー: 無効なaction - ' + action);
        return createJsonResponse(false, 'Invalid action: ' + action);
    }
  } catch (error) {
    Logger.log('=== doPostでエラー ===');
    Logger.log('エラーメッセージ: ' + error.message);
    Logger.log('エラースタック: ' + error.stack);
    return createJsonResponse(false, 'サーバーエラー: ' + error.message);
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
