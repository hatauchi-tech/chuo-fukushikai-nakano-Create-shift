/**
 * 休み希望コントローラー
 *
 * @file controllers/RequestController.gs
 */

/**
 * 休み希望提出処理
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleSubmitRequest(e) {
  try {
    Logger.log('休み希望提出を開始します');

    const user = getSessionUser();
    if (!user) {
      return createJsonResponse(false, 'ログインが必要です');
    }

    const datesStr = e.parameter.dates; // JSON形式の日付配列
    const notes = e.parameter.notes || '';

    if (!datesStr) {
      return createJsonResponse(false, '日付を指定してください');
    }

    const dates = JSON.parse(datesStr).map(dateStr => parseDate(dateStr));

    Logger.log(`${user.name} の休み希望: ${dates.length}日`);

    // 1. シフト希望を追加
    const requestModel = new RequestModel();
    const requestId = requestModel.addRequest({
      staffName: user.name,
      submitDate: new Date(),
      notes: notes
    });

    // 2. シフト希望詳細を追加
    const requestDetailModel = new RequestDetailModel();
    requestDetailModel.addRequestDetails(requestId, dates);

    Logger.log('休み希望を保存しました');

    return createJsonResponse(true, {
      requestId: requestId,
      message: '休み希望を提出しました'
    });

  } catch (error) {
    Logger.log('休み希望提出エラー: ' + error.toString());
    return createJsonResponse(false, error.toString());
  }
}

/**
 * 休み希望を取得（クライアント側から呼び出し）
 * @param {string} staffName - 職員名（省略時はログインユーザー）
 * @param {string} yearMonth - 年月（YYYY-MM形式）
 * @returns {Object} 休み希望データ
 */
function getRequest(staffName, yearMonth) {
  try {
    const user = getSessionUser();

    // staffNameが指定されていない場合はログインユーザー
    const targetName = staffName || (user ? user.name : null);

    if (!targetName) {
      return {
        success: false,
        error: 'ログインが必要です'
      };
    }

    // 年月をパース
    let targetMonth;
    if (yearMonth) {
      const [year, month] = yearMonth.split('-').map(Number);
      targetMonth = new Date(year, month - 1, 1);
    } else {
      // 指定がない場合は翌月
      targetMonth = getNextMonth(new Date());
    }

    const requestModel = new RequestModel();
    const request = requestModel.findByStaffAndMonth(targetName, targetMonth);

    if (!request) {
      return {
        success: true,
        data: {
          dates: [],
          notes: ''
        }
      };
    }

    const requestDetailModel = new RequestDetailModel();
    const details = requestDetailModel.getDetailsByRequestId(request.requestId);

    return {
      success: true,
      data: {
        requestId: request.requestId,
        dates: details.map(d => formatDate(d.date)),
        notes: request.notes
      }
    };

  } catch (error) {
    Logger.log('休み希望取得エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * イベントを保存
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleSaveEvent(e) {
  try {
    Logger.log('イベント保存を開始します');

    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return createJsonResponse(false, '管理者権限が必要です');
    }

    const eventDate = parseDate(e.parameter.eventDate);
    const groups = parseEnumList(e.parameter.groups || '');
    const unit = e.parameter.unit || '';
    const content = e.parameter.content || '';

    if (!eventDate || !content) {
      return createJsonResponse(false, 'イベント日と内容を指定してください');
    }

    const eventModel = new EventModel();
    const eventId = eventModel.addEvent({
      registeredBy: user.name,
      eventDate: eventDate,
      groups: groups,
      unit: unit,
      content: content
    });

    Logger.log('イベントを保存しました');

    return createJsonResponse(true, {
      eventId: eventId,
      message: 'イベントを保存しました'
    });

  } catch (error) {
    Logger.log('イベント保存エラー: ' + error.toString());
    return createJsonResponse(false, error.toString());
  }
}

/**
 * イベントを取得（クライアント側から呼び出し）
 * @param {string} groups - グループ（カンマ区切り）
 * @param {string} unit - ユニット
 * @param {string} yearMonth - 年月（YYYY-MM形式）
 * @returns {Object} イベントデータ
 */
function getEvents(groups, unit, yearMonth) {
  try {
    const groupArray = parseEnumList(groups);

    // 年月をパース
    let targetMonth;
    if (yearMonth) {
      const [year, month] = yearMonth.split('-').map(Number);
      targetMonth = new Date(year, month - 1, 1);
    } else {
      // 指定がない場合は翌月
      targetMonth = getNextMonth(new Date());
    }

    const eventModel = new EventModel();
    const events = eventModel.getMonthEvents(groupArray, unit, targetMonth);

    return {
      success: true,
      data: events.map(event => ({
        eventId: event.eventId,
        eventDate: formatDate(event.eventDate),
        content: event.content,
        registeredBy: event.registeredBy
      }))
    };

  } catch (error) {
    Logger.log('イベント取得エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
