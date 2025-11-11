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
    Logger.log('シフト自動生成を開始します');

    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return createJsonResponse(false, '管理者権限が必要です');
    }

    const yearMonthStr = e.parameter.yearMonth; // "YYYY-MM" 形式
    const groups = parseEnumList(e.parameter.groups || '');

    if (!yearMonthStr || groups.length === 0) {
      return createJsonResponse(false, '年月とグループを指定してください');
    }

    // 年月をパース
    const [year, month] = yearMonthStr.split('-').map(Number);
    const yearMonth = new Date(year, month - 1, 1);

    Logger.log(`対象: ${year}年${month}月、グループ: ${groups.join(',')}`);

    // 1. 職員データを取得
    const staffModel = new StaffModel();
    const staffs = staffModel.getStaffsByGroup(groups);

    if (staffs.length === 0) {
      return createJsonResponse(false, '対象の職員が見つかりません');
    }

    Logger.log(`対象職員数: ${staffs.length}`);

    // 2. 休み希望を取得
    const requestDetailModel = new RequestDetailModel();
    const requests = {};

    staffs.forEach(staff => {
      const requestDates = requestDetailModel.getRequestDates(staff.name, yearMonth);
      requests[staff.name] = requestDates;
      Logger.log(`${staff.name} の休み希望: ${requestDates.length}日`);
    });

    // 3. 対象日付を生成
    const dates = getMonthDates(year, month);

    // 4. ルールを取得
    const ruleModel = new RuleModel();
    const rulesText = ruleModel.getRulesText();

    Logger.log('ルールテキストを取得しました');

    // 5. Gemini APIでシフト生成
    const geminiService = new GeminiService();
    const result = geminiService.generateShift({
      staffs: staffs,
      requests: requests,
      dates: dates,
      rulesText: rulesText
    });

    if (!result.success) {
      Logger.log('シフト生成失敗: ' + result.error);
      return createJsonResponse(false, result.error);
    }

    Logger.log('シフト生成成功');

    // 6. シフト表を保存
    const shiftTableModel = new ShiftTableModel();
    const tableId = shiftTableModel.addShiftTable({
      outputBy: user.name,
      yearMonth: yearMonth,
      groups: groups,
      filePath: '' // PDF出力時に更新
    });

    // 7. シフト詳細を保存
    const shiftTableDetailModel = new ShiftTableDetailModel();
    shiftTableDetailModel.addShiftDetails(tableId, result.data);

    Logger.log('シフトをデータベースに保存しました');

    return createJsonResponse(true, {
      tableId: tableId,
      shifts: result.data,
      feedback: result.feedback
    });

  } catch (error) {
    Logger.log('シフト生成エラー: ' + error.toString());
    return createJsonResponse(false, error.toString());
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
 * シフト自動生成プレビュー（保存なし、クライアント側から直接呼び出し）
 * @param {string} yearMonth - 対象年月（YYYY-MM形式）
 * @param {string} groups - 対象グループ（カンマ区切り）
 * @returns {Object} 生成結果（職員情報、休み希望を含む）
 */
function generateShiftPreview(yearMonth, groups) {
  try {
    Logger.log('シフト自動生成（プレビュー）を開始します');

    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    const groupArray = parseEnumList(groups);

    if (!yearMonth || groupArray.length === 0) {
      return {
        success: false,
        error: '年月とグループを指定してください'
      };
    }

    // 年月をパース
    const [year, month] = yearMonth.split('-').map(Number);
    const yearMonthDate = new Date(year, month - 1, 1);

    Logger.log(`対象: ${year}年${month}月、グループ: ${groupArray.join(',')}`);

    // 1. 職員データを取得
    const staffModel = new StaffModel();
    const staffs = staffModel.getStaffsByGroup(groupArray);

    if (staffs.length === 0) {
      return {
        success: false,
        error: '対象の職員が見つかりません'
      };
    }

    Logger.log(`対象職員数: ${staffs.length}`);

    // 2. 休み希望を取得
    const requestDetailModel = new RequestDetailModel();
    const requests = {};

    staffs.forEach(staff => {
      const requestDates = requestDetailModel.getRequestDates(staff.name, yearMonthDate);
      requests[staff.name] = requestDates;
      Logger.log(`${staff.name} の休み希望: ${requestDates.length}日`);
    });

    // 3. 対象日付を生成
    const dates = getMonthDates(year, month);

    // 4. ルールを取得
    const ruleModel = new RuleModel();
    const rulesText = ruleModel.getRulesText();

    Logger.log('ルールテキストを取得しました');

    // 5. Gemini APIでシフト生成
    const geminiService = new GeminiService();
    const result = geminiService.generateShift({
      staffs: staffs,
      requests: requests,
      dates: dates,
      rulesText: rulesText
    });

    if (!result.success) {
      Logger.log('シフト生成失敗: ' + result.error);
      return {
        success: false,
        error: result.error
      };
    }

    Logger.log('シフト生成成功（保存なし）');

    // 職員情報と休み希望をフロントエンドで使用できるように整形
    const staffInfo = staffs.map(staff => ({
      name: staff.name,
      isSuctionCertified: staff.isSuctionCertified,
      groups: staff.groups
    }));

    const requestDatesFormatted = {};
    Object.keys(requests).forEach(staffName => {
      requestDatesFormatted[staffName] = requests[staffName].map(date => formatDate(date));
    });

    return {
      success: true,
      data: {
        shifts: result.data,
        feedback: result.feedback,
        staffInfo: staffInfo,
        requestDates: requestDatesFormatted,
        yearMonth: yearMonth,
        groups: groupArray
      }
    };

  } catch (error) {
    Logger.log('シフト生成エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * シフト確定（編集済みシフトデータを保存、クライアント側から直接呼び出し）
 * @param {string} yearMonth - 対象年月（YYYY-MM形式）
 * @param {Array<string>} groups - 対象グループ配列
 * @param {Array<Object>} shifts - 編集済みシフトデータ [{staffName, date, shiftName}]
 * @returns {Object} 保存結果
 */
function confirmShift(yearMonth, groups, shifts) {
  try {
    Logger.log('シフト確定処理を開始します');

    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!yearMonth || !groups || !shifts || shifts.length === 0) {
      return {
        success: false,
        error: '必要なデータが不足しています'
      };
    }

    // 年月をパース
    const [year, month] = yearMonth.split('-').map(Number);
    const yearMonthDate = new Date(year, month - 1, 1);

    Logger.log(`シフト確定: ${year}年${month}月、グループ: ${groups.join(',')}`);

    // シフト表を保存
    const shiftTableModel = new ShiftTableModel();
    const tableId = shiftTableModel.addShiftTable({
      outputBy: user.name,
      yearMonth: yearMonthDate,
      groups: groups,
      filePath: '' // PDF出力時に更新
    });

    // シフト詳細を保存（日付文字列をDateオブジェクトに変換）
    const shiftsWithDateObjects = shifts.map(shift => ({
      date: parseDate(shift.date),
      staffName: shift.staffName,
      shiftName: shift.shiftName
    }));

    const shiftTableDetailModel = new ShiftTableDetailModel();
    shiftTableDetailModel.addShiftDetails(tableId, shiftsWithDateObjects);

    Logger.log('シフトをデータベースに保存しました');

    return {
      success: true,
      data: {
        tableId: tableId
      }
    };

  } catch (error) {
    Logger.log('シフト確定エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * シフト自動生成処理（クライアント側から直接呼び出し）
 * @deprecated 代わりにgenerateShiftPreviewとconfirmShiftを使用してください
 * @param {string} yearMonth - 対象年月（YYYY-MM形式）
 * @param {string} groups - 対象グループ（カンマ区切り）
 * @returns {Object} 生成結果
 */
function generateShiftForAdmin(yearMonth, groups) {
  try {
    Logger.log('シフト自動生成を開始します');

    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    const groupArray = parseEnumList(groups);

    if (!yearMonth || groupArray.length === 0) {
      return {
        success: false,
        error: '年月とグループを指定してください'
      };
    }

    // 年月をパース
    const [year, month] = yearMonth.split('-').map(Number);
    const yearMonthDate = new Date(year, month - 1, 1);

    Logger.log(`対象: ${year}年${month}月、グループ: ${groupArray.join(',')}`);

    // 1. 職員データを取得
    const staffModel = new StaffModel();
    const staffs = staffModel.getStaffsByGroup(groupArray);

    if (staffs.length === 0) {
      return {
        success: false,
        error: '対象の職員が見つかりません'
      };
    }

    Logger.log(`対象職員数: ${staffs.length}`);

    // 2. 休み希望を取得
    const requestDetailModel = new RequestDetailModel();
    const requests = {};

    staffs.forEach(staff => {
      const requestDates = requestDetailModel.getRequestDates(staff.name, yearMonthDate);
      requests[staff.name] = requestDates;
      Logger.log(`${staff.name} の休み希望: ${requestDates.length}日`);
    });

    // 3. 対象日付を生成
    const dates = getMonthDates(year, month);

    // 4. ルールを取得
    const ruleModel = new RuleModel();
    const rulesText = ruleModel.getRulesText();

    Logger.log('ルールテキストを取得しました');

    // 5. Gemini APIでシフト生成
    const geminiService = new GeminiService();
    const result = geminiService.generateShift({
      staffs: staffs,
      requests: requests,
      dates: dates,
      rulesText: rulesText
    });

    if (!result.success) {
      Logger.log('シフト生成失敗: ' + result.error);
      return {
        success: false,
        error: result.error
      };
    }

    Logger.log('シフト生成成功');

    // 6. シフト表を保存
    const shiftTableModel = new ShiftTableModel();
    const tableId = shiftTableModel.addShiftTable({
      outputBy: user.name,
      yearMonth: yearMonthDate,
      groups: groupArray,
      filePath: '' // PDF出力時に更新
    });

    // 7. シフト詳細を保存
    const shiftTableDetailModel = new ShiftTableDetailModel();
    shiftTableDetailModel.addShiftDetails(tableId, result.data);

    Logger.log('シフトをデータベースに保存しました');

    return {
      success: true,
      data: {
        tableId: tableId,
        shifts: result.data,
        feedback: result.feedback
      }
    };

  } catch (error) {
    Logger.log('シフト生成エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * PDF出力処理（クライアント側から直接呼び出し）
 * @param {string} tableId - シフト表ID
 * @returns {Object} 出力結果
 */
function exportPdfForAdmin(tableId) {
  try {
    Logger.log('PDF出力を開始します');

    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!tableId) {
      return {
        success: false,
        error: 'シフト表IDを指定してください'
      };
    }

    // シフト表データを取得
    const shiftTableModel = new ShiftTableModel();
    const table = shiftTableModel.findById(tableId, 0);

    if (!table) {
      return {
        success: false,
        error: 'シフト表が見つかりません'
      };
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
      return {
        success: false,
        error: result.error
      };
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

    return {
      success: true,
      data: {
        fileName: result.fileName,
        filePath: result.filePath
      }
    };

  } catch (error) {
    Logger.log('PDF出力エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
