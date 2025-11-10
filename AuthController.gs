/**
 * 認証コントローラー
 *
 * @file controllers/AuthController.gs
 */

/**
 * ログイン処理
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleLogin(e) {
  try {
    const groups = parseEnumList(e.parameter.groups || '');
    const name = e.parameter.name;
    const password = e.parameter.password;

    Logger.log(`ログイン試行: グループ=${groups}, 氏名=${name}`);

    if (!name || !password) {
      return createJsonResponse(false, '氏名とパスワードを入力してください');
    }

    // 職員マスタで認証
    const staffModel = new StaffModel();
    const staff = staffModel.authenticate(name, password);

    if (!staff) {
      Logger.log('認証失敗: 氏名またはパスワードが正しくありません');
      return createJsonResponse(false, '氏名またはパスワードが正しくありません');
    }

    // グループチェック（職員が指定されたグループに所属しているか）
    if (groups.length > 0 && !hasAnyGroup(toEnumList(staff.groups), groups)) {
      Logger.log('認証失敗: 指定されたグループに所属していません');
      return createJsonResponse(false, '指定されたグループに所属していません');
    }

    // セッション情報を保存
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('sessionUser', JSON.stringify({
      staffId: staff.staffId,
      name: staff.name,
      role: staff.role,
      groups: staff.groups,
      unit: staff.unit
    }));

    Logger.log('ログイン成功: ' + name);

    return createJsonResponse(true, {
      name: staff.name,
      role: staff.role,
      groups: staff.groups,
      unit: staff.unit
    });

  } catch (error) {
    Logger.log('ログインエラー: ' + error.toString());
    return createJsonResponse(false, error.toString());
  }
}

/**
 * ログアウト処理
 * @param {Object} e - イベントオブジェクト
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleLogout(e) {
  try {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('sessionUser');

    Logger.log('ログアウトしました');

    return createJsonResponse(true, 'ログアウトしました');

  } catch (error) {
    Logger.log('ログアウトエラー: ' + error.toString());
    return createJsonResponse(false, error.toString());
  }
}

/**
 * ログアウト（クライアント側から直接呼び出し）
 * @returns {Object} ログアウト結果
 */
function logoutUser() {
  try {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('sessionUser');

    Logger.log('ログアウトしました');

    return {
      success: true,
      message: 'ログアウトしました'
    };

  } catch (error) {
    Logger.log('ログアウトエラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 現在のセッションユーザーを取得
 * @returns {Object|null} ユーザー情報
 */
function getSessionUser() {
  const userProperties = PropertiesService.getUserProperties();
  const sessionUser = userProperties.getProperty('sessionUser');

  if (!sessionUser) {
    return null;
  }

  return JSON.parse(sessionUser);
}

/**
 * セッションチェック（GAS側で使用）
 * @returns {boolean} セッションが有効かどうか
 */
function isLoggedIn() {
  return getSessionUser() !== null;
}

/**
 * グループに所属する職員名リストを取得（クライアント側から呼び出し）
 * @param {string} group - グループ番号
 * @returns {Object} 職員名リスト
 */
function getStaffNamesByGroup(group) {
  try {
    const staffModel = new StaffModel();

    if (!group || group === '') {
      // グループ指定なしの場合は全職員
      const staffs = staffModel.getActiveStaffs();
      return {
        success: true,
        data: staffs.map(staff => staff.name).sort()
      };
    }

    // 指定グループの職員のみ
    const staffs = staffModel.getStaffsByGroup([group]);
    return {
      success: true,
      data: staffs.map(staff => staff.name).sort()
    };

  } catch (error) {
    Logger.log('職員名リスト取得エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ログイン認証（クライアント側から直接呼び出し）
 * @param {string} group - グループ番号
 * @param {string} name - 氏名
 * @param {string} password - パスワード
 * @returns {Object} 認証結果
 */
function authenticateUser(group, name, password) {
  try {
    Logger.log(`ログイン試行: グループ=${group}, 氏名=${name}`);

    if (!name || !password) {
      return {
        success: false,
        error: '氏名とパスワードを入力してください'
      };
    }

    // 職員マスタで認証
    const staffModel = new StaffModel();
    const staff = staffModel.authenticate(name, password);

    if (!staff) {
      Logger.log('認証失敗: 氏名またはパスワードが正しくありません');
      return {
        success: false,
        error: '氏名またはパスワードが正しくありません'
      };
    }

    // グループチェック（職員が指定されたグループに所属しているか）
    if (group && !hasAnyGroup(toEnumList(staff.groups), [group])) {
      Logger.log('認証失敗: 指定されたグループに所属していません');
      return {
        success: false,
        error: '指定されたグループに所属していません'
      };
    }

    // セッション情報を保存
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('sessionUser', JSON.stringify({
      staffId: staff.staffId,
      name: staff.name,
      role: staff.role,
      groups: staff.groups,
      unit: staff.unit
    }));

    Logger.log('ログイン成功: ' + name);

    return {
      success: true,
      data: {
        name: staff.name,
        role: staff.role,
        groups: staff.groups,
        unit: staff.unit
      }
    };

  } catch (error) {
    Logger.log('ログインエラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
