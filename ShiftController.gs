/**
 * シフトコントローラー
 *
 * @file controllers/ShiftController.gs
 */

/**
 * シフト自動生成処理
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleGenerateShift(e) {
  try {
    Logger.log('=== シフト自動生成を開始します ===');
    Logger.log('パラメータ: ' + JSON.stringify(e.parameter));

    // セッションチェック
    const user = getSessionUser();
    Logger.log('セッションユーザー: ' + (user ? user.name : 'null'));

    if (!user || user.role !== '管理者') {
      Logger.log('権限エラー: 管理者権限が必要です');
      return createJsonResponse(false, '管理者権限が必要です');
    }

    const yearMonthStr = e.parameter.yearMonth; // "YYYY-MM" 形式
    const groups = parseEnumList(e.parameter.groups || '');

    if (!yearMonthStr || groups.length === 0) {
      Logger.log('パラメータエラー: 年月またはグループが未指定');
      return createJsonResponse(false, '年月とグループを指定してください');
    }

    // 年月をパース
    const [year, month] = yearMonthStr.split('-').map(Number);
    const yearMonth = new Date(year, month - 1, 1);

    Logger.log(`対象: ${year}年${month}月、グループ: ${groups.join(',')}`);

    // 1. 職員データを取得
    Logger.log('STEP 1: 職員データを取得中...');
    const staffModel = new StaffModel();
    const staffs = staffModel.getStaffsByGroup(groups);

    if (staffs.length === 0) {
      Logger.log('エラー: 対象の職員が見つかりません');
      return createJsonResponse(false, '対象の職員が見つかりません');
    }

    Logger.log(`対象職員数: ${staffs.length}人`);
    Logger.log('職員名: ' + staffs.map(s => s.name).join(', '));

    // 2. 休み希望を取得
    Logger.log('STEP 2: 休み希望を取得中...');
    const requestDetailModel = new RequestDetailModel();
    const requests = {};

    staffs.forEach(staff => {
      const requestDates = requestDetailModel.getRequestDates(staff.name, yearMonth);
      requests[staff.name] = requestDates;
      Logger.log(`${staff.name} の休み希望: ${requestDates.length}日`);
    });

    // 3. 対象日付を生成
    Logger.log('STEP 3: 対象日付を生成中...');
    const dates = getMonthDates(year, month);
    Logger.log(`対象日数: ${dates.length}日`);

    // 4. ルールを取得
    Logger.log('STEP 4: ルールを取得中...');
    const ruleModel = new RuleModel();
    const rulesText = ruleModel.getRulesText();
    Logger.log('ルールテキスト長: ' + rulesText.length + '文字');

    // 5. Gemini APIでシフト生成
    Logger.log('STEP 5: Gemini APIでシフト生成中...');
    const geminiService = new GeminiService();
    const result = geminiService.generateShift({
      staffs: staffs,
      requests: requests,
      dates: dates,
      rulesText: rulesText
    });

    if (!result.success) {
      Logger.log('シフト生成失敗: ' + result.error);
      return createJsonResponse(false, 'シフト生成失敗: ' + result.error);
    }

    Logger.log('シフト生成成功。生成されたシフト数: ' + result.data.length);

    // 6. 職員情報を取得（資格者情報を含む）
    Logger.log('STEP 6: 職員情報を整形中...');
    const staffsInfo = staffs.map(staff => ({
      name: staff.name,
      isSuctionCertified: staff.isSuctionCertified
    }));

    // 7. 休み希望情報を整形
    Logger.log('STEP 7: 休み希望情報を整形中...');
    const requestDates = {};
    for (const staffName in requests) {
      requestDates[staffName] = requests[staffName].map(date => formatDate(date));
    }

    Logger.log('=== シフト自動生成が完了しました（確定待ち） ===');

    // スプレッドシートには保存せず、データのみ返す
    return createJsonResponse(true, {
      shifts: result.data,
      feedback: result.feedback,
      staffs: staffsInfo,
      requestDates: requestDates,
      yearMonth: formatDate(yearMonth),
      groups: groups
    });

  } catch (error) {
    Logger.log('=== シフト生成エラー ===');
    Logger.log('エラーメッセージ: ' + error.message);
    Logger.log('エラースタック: ' + error.stack);
    return createJsonResponse(false, 'エラー: ' + error.message);
  }
}

/**
 * シフト確定処理（スプレッドシートに保存）
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleConfirmShift(e) {
  try {
    Logger.log('=== シフト確定処理を開始します ===');
    Logger.log('パラメータ: ' + JSON.stringify(e.parameter));

    // セッションチェック
    const user = getSessionUser();
    Logger.log('セッションユーザー: ' + (user ? user.name : 'null'));

    if (!user || user.role !== '管理者') {
      Logger.log('権限エラー: 管理者権限が必要です');
      return createJsonResponse(false, '管理者権限が必要です');
    }

    const yearMonthStr = e.parameter.yearMonth; // "YYYY/MM/DD" 形式（月初日）
    const groups = parseEnumList(e.parameter.groups || '');
    const shiftsJson = e.parameter.shifts; // JSON文字列

    if (!yearMonthStr || groups.length === 0 || !shiftsJson) {
      Logger.log('パラメータエラー: 必要なパラメータが未指定');
      return createJsonResponse(false, '必要なパラメータが指定されていません');
    }

    // シフトデータをパース
    const shifts = JSON.parse(shiftsJson);
    Logger.log(`確定するシフト数: ${shifts.length}`);

    // 年月を復元
    const yearMonth = parseDate(yearMonthStr);

    // 1. シフト表を保存
    Logger.log('STEP 1: シフト表を保存中...');
    const shiftTableModel = new ShiftTableModel();
    const tableId = shiftTableModel.addShiftTable({
      outputBy: user.name,
      yearMonth: yearMonth,
      groups: groups,
      filePath: '' // PDF出力時に更新
    });
    Logger.log('シフト表ID: ' + tableId);

    // 2. シフト詳細を保存
    Logger.log('STEP 2: シフト詳細を保存中...');
    const shiftTableDetailModel = new ShiftTableDetailModel();

    // shifts配列の各要素に date を Date オブジェクトに変換
    const shiftsToSave = shifts.map(shift => ({
      date: parseDate(shift.date),
      staffName: shift.staffName,
      shiftName: shift.shiftName
    }));

    shiftTableDetailModel.addShiftDetails(tableId, shiftsToSave);

    Logger.log('=== シフト確定が完了しました ===');

    return createJsonResponse(true, {
      tableId: tableId,
      message: 'シフトを確定しました'
    });

  } catch (error) {
    Logger.log('=== シフト確定エラー ===');
    Logger.log('エラーメッセージ: ' + error.message);
    Logger.log('エラースタック: ' + error.stack);
    return createJsonResponse(false, 'エラー: ' + error.message);
  }
}

/**
 * シフト手動更新処理
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleUpdateShift(e) {
  try {
    Logger.log('シフト手動更新を開始します');

    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return createJsonResponse(false, '管理者権限が必要です');
    }

    const tableId = e.parameter.tableId;
    const updates = JSON.parse(e.parameter.updates || '[]');

    if (!tableId || updates.length === 0) {
      return createJsonResponse(false, 'シフト表IDと更新データを指定してください');
    }

    Logger.log(`シフト表ID: ${tableId}, 更新件数: ${updates.length}`);

    const shiftTableDetailModel = new ShiftTableDetailModel();

    // 更新処理
    updates.forEach(update => {
      const { historyId, shiftName } = update;

      // historyIdで検索して更新
      const result = shiftTableDetailModel.findById(historyId, 0);

      if (result) {
        const rowData = result.data;
        rowData[4] = shiftName; // 勤務シフト列を更新
        shiftTableDetailModel.updateRow(result.rowIndex, rowData);
      }
    });

    Logger.log('シフト更新完了');

    return createJsonResponse(true, '更新しました');

  } catch (error) {
    Logger.log('シフト更新エラー: ' + error.toString());
    return createJsonResponse(false, error.toString());
  }
}

/**
 * シフト表のPDF出力処理
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleExportPdf(e) {
  try {
    Logger.log('PDF出力を開始します');

    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return createJsonResponse(false, '管理者権限が必要です');
    }

    const tableId = e.parameter.tableId;

    if (!tableId) {
      return createJsonResponse(false, 'シフト表IDを指定してください');
    }

    // シフト表データを取得
    const shiftTableModel = new ShiftTableModel();
    const table = shiftTableModel.findById(tableId, 0);

    if (!table) {
      return createJsonResponse(false, 'シフト表が見つかりません');
    }

    const tableData = {
      tableId: table.data[0],
      outputBy: table.data[1],
      yearMonth: parseDate(table.data[2]),
      groups: parseEnumList(table.data[3]),
      filePath: table.data[4]
    };

    // シフト詳細を取得
    const shiftTableDetailModel = new ShiftTableDetailModel();
    const details = shiftTableDetailModel.getDetailsByTableId(tableId);

    // 職員データを取得
    const staffModel = new StaffModel();
    const staffs = staffModel.getStaffsByGroup(tableData.groups);

    // PDF出力
    const pdfService = new PdfService();
    const result = pdfService.exportToPdf({
      yearMonth: tableData.yearMonth,
      groups: tableData.groups,
      shiftData: details,
      staffs: staffs
    });

    if (!result.success) {
      return createJsonResponse(false, result.error);
    }

    // ファイルパスを更新
    shiftTableModel.updateRow(table.rowIndex, [
      tableData.tableId,
      tableData.outputBy,
      formatDate(tableData.yearMonth),
      toEnumList(tableData.groups),
      result.filePath
    ]);

    Logger.log('PDF出力完了: ' + result.fileName);

    return createJsonResponse(true, {
      fileName: result.fileName,
      filePath: result.filePath
    });

  } catch (error) {
    Logger.log('PDF出力エラー: ' + error.toString());
    return createJsonResponse(false, error.toString());
  }
}

/**
 * シフトデータを取得（クライアント側から呼び出し）
 * @param {string} tableId - シフト表ID
 * @returns {Object} シフトデータ
 */
function getShiftData(tableId) {
  try {
    const shiftTableDetailModel = new ShiftTableDetailModel();
    const details = shiftTableDetailModel.getDetailsByTableId(tableId);

    return {
      success: true,
      data: details
    };

  } catch (error) {
    Logger.log('シフトデータ取得エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * デバッグ用: シフト生成の各ステップをテスト
 * GASエディタから直接実行してログを確認
 */
function debugShiftGeneration() {
  try {
    Logger.log('=== デバッグ: シフト生成テスト開始 ===');

    // STEP 1: Config確認
    Logger.log('STEP 1: Config確認');
    const config = new Config();
    try {
      const spreadsheetId = config.getSpreadsheetId();
      Logger.log('  スプレッドシートID: OK');
    } catch (e) {
      Logger.log('  スプレッドシートID: NG - ' + e.message);
      return;
    }

    try {
      const apiKey = config.getGeminiApiKey();
      Logger.log('  Gemini APIキー: OK (先頭10文字: ' + apiKey.substring(0, 10) + '...)');
    } catch (e) {
      Logger.log('  Gemini APIキー: NG - ' + e.message);
      return;
    }

    // STEP 2: 職員データ確認
    Logger.log('STEP 2: 職員データ確認');
    const staffModel = new StaffModel();
    const allStaffs = staffModel.getActiveStaffs();
    Logger.log('  有効な職員数: ' + allStaffs.length);

    if (allStaffs.length === 0) {
      Logger.log('  警告: 職員データがありません。サンプルデータを投入してください。');
      return;
    }

    // 最初のグループを取得
    const firstGroup = allStaffs[0].groups[0];
    Logger.log('  テスト用グループ: ' + firstGroup);

    const groupStaffs = staffModel.getStaffsByGroup([firstGroup]);
    Logger.log('  グループの職員数: ' + groupStaffs.length);

    // STEP 3: ルール確認
    Logger.log('STEP 3: ルール確認');
    const ruleModel = new RuleModel();
    const rules = ruleModel.getAllRules();
    Logger.log('  ルール数: ' + rules.length);

    if (rules.length === 0) {
      Logger.log('  警告: ルールがありません。サンプルデータを投入してください。');
      return;
    }

    // STEP 4: Gemini API接続テスト
    Logger.log('STEP 4: Gemini API接続テスト');
    const geminiService = new GeminiService();
    try {
      const testResult = geminiService.testApi();
      Logger.log('  Gemini API接続: OK');
      Logger.log('  応答: ' + testResult.substring(0, 100) + '...');
    } catch (e) {
      Logger.log('  Gemini API接続: NG - ' + e.message);
      return;
    }

    Logger.log('=== すべてのテストをパスしました ===');
    Logger.log('実際のシフト生成を実行する準備ができています。');

  } catch (error) {
    Logger.log('=== デバッグテストでエラー ===');
    Logger.log('エラー: ' + error.message);
    Logger.log('スタック: ' + error.stack);
  }
}

/**
 * デバッグ用: 簡易シフト生成テスト（2人、3日間のみ）
 * GASエディタから直接実行してログを確認
 */
function debugSimpleShiftGeneration() {
  try {
    Logger.log('=== 簡易シフト生成テスト開始 ===');

    // テスト用の最小データでシフト生成
    const staffModel = new StaffModel();
    const allStaffs = staffModel.getActiveStaffs();

    if (allStaffs.length === 0) {
      Logger.log('エラー: 職員データがありません');
      return;
    }

    // 最初の2人のみ
    const staffs = allStaffs.slice(0, Math.min(2, allStaffs.length));
    Logger.log('テスト職員: ' + staffs.map(s => s.name).join(', '));

    // 3日分の日付
    const today = new Date();
    const dates = [
      new Date(today.getFullYear(), today.getMonth(), 1),
      new Date(today.getFullYear(), today.getMonth(), 2),
      new Date(today.getFullYear(), today.getMonth(), 3)
    ];

    // 休み希望は空
    const requests = {};
    staffs.forEach(s => requests[s.name] = []);

    // シンプルなルール
    const rulesText = `
【ルール1】基本ルール
- 早出、日勤、遅出、夜勤、休みのいずれかを割り当ててください
- すべての職員に公平にシフトを配分してください
    `;

    const geminiService = new GeminiService();
    const result = geminiService.generateShift({
      staffs: staffs,
      requests: requests,
      dates: dates,
      rulesText: rulesText
    });

    if (result.success) {
      Logger.log('=== シフト生成成功 ===');
      Logger.log('生成されたシフト数: ' + result.data.length);
      Logger.log('最初の3件: ' + JSON.stringify(result.data.slice(0, 3), null, 2));
    } else {
      Logger.log('=== シフト生成失敗 ===');
      Logger.log('エラー: ' + result.error);
    }

  } catch (error) {
    Logger.log('=== 簡易テストでエラー ===');
    Logger.log('エラー: ' + error.message);
    Logger.log('スタック: ' + error.stack);
  }
}
