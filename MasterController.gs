/**
 * マスタ管理コントローラー
 *
 * @file controllers/MasterController.gs
 */

// ====================
// 職員マスタ管理
// ====================

/**
 * 全職員を取得（管理者用・クライアント側から呼び出し）
 * @returns {Object} 職員データ
 */
function getAllStaffsForAdmin() {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    const staffModel = new StaffModel();
    const staffs = staffModel.getAllStaffs();

    return {
      success: true,
      data: staffs.map(staff => ({
        staffId: staff.staffId,
        department: staff.department,
        position: staff.position,
        groups: staff.groups,
        unit: staff.unit,
        name: staff.name,
        isSuctionCertified: staff.isSuctionCertified,
        workConsiderations: staff.workConsiderations,
        role: staff.role,
        employmentType: staff.employmentType,
        isActive: staff.isActive
        // パスワードは返さない
      }))
    };

  } catch (error) {
    Logger.log('全職員取得エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 職員を保存（クライアント側から呼び出し）
 * @param {string} department - 所属
 * @param {string} position - 役職
 * @param {string} groups - グループ（カンマ区切り）
 * @param {string} unit - ユニット
 * @param {string} name - 氏名
 * @param {boolean} isSuctionCertified - 喀痰吸引資格者
 * @param {string} workConsiderations - 勤務配慮
 * @param {string} role - 権限
 * @param {string} employmentType - 雇用形態
 * @param {boolean} isActive - 有効
 * @param {string} password - パスワード
 * @returns {Object} 保存結果
 */
function saveStaff(department, position, groups, unit, name, isSuctionCertified, workConsiderations, role, employmentType, isActive, password) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!name) {
      return {
        success: false,
        error: '氏名を指定してください'
      };
    }

    const staffModel = new StaffModel();
    const staffId = staffModel.addStaff({
      department: department,
      position: position,
      groups: parseEnumList(groups),
      unit: unit,
      name: name,
      isSuctionCertified: isSuctionCertified,
      workConsiderations: workConsiderations,
      role: role,
      employmentType: employmentType,
      isActive: isActive,
      password: password || 'password123'
    });

    Logger.log('職員を保存しました: ' + staffId);

    return {
      success: true,
      data: {
        staffId: staffId,
        message: '職員を保存しました'
      }
    };

  } catch (error) {
    Logger.log('職員保存エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 職員を更新（クライアント側から呼び出し）
 * @param {string} staffId - 従業員ID
 * @param {string} department - 所属
 * @param {string} position - 役職
 * @param {string} groups - グループ（カンマ区切り）
 * @param {string} unit - ユニット
 * @param {string} name - 氏名
 * @param {boolean} isSuctionCertified - 喀痰吸引資格者
 * @param {string} workConsiderations - 勤務配慮
 * @param {string} role - 権限
 * @param {string} employmentType - 雇用形態
 * @param {boolean} isActive - 有効
 * @param {string} password - パスワード（任意）
 * @returns {Object} 更新結果
 */
function updateStaff(staffId, department, position, groups, unit, name, isSuctionCertified, workConsiderations, role, employmentType, isActive, password) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!staffId || !name) {
      return {
        success: false,
        error: '従業員IDと氏名を指定してください'
      };
    }

    const staffModel = new StaffModel();
    const updateData = {
      department: department,
      position: position,
      groups: parseEnumList(groups),
      unit: unit,
      name: name,
      isSuctionCertified: isSuctionCertified,
      workConsiderations: workConsiderations,
      role: role,
      employmentType: employmentType,
      isActive: isActive
    };

    // パスワードが指定されている場合のみ更新
    if (password) {
      updateData.password = password;
    }

    const result = staffModel.updateStaff(staffId, updateData);

    if (!result) {
      return {
        success: false,
        error: '職員の更新に失敗しました'
      };
    }

    Logger.log('職員を更新しました: ' + staffId);

    return {
      success: true,
      data: {
        message: '職員を更新しました'
      }
    };

  } catch (error) {
    Logger.log('職員更新エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 職員を削除（論理削除）（クライアント側から呼び出し）
 * @param {string} staffId - 従業員ID
 * @returns {Object} 削除結果
 */
function deleteStaff(staffId) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!staffId) {
      return {
        success: false,
        error: '従業員IDを指定してください'
      };
    }

    const staffModel = new StaffModel();
    const result = staffModel.deleteStaff(staffId);

    if (!result) {
      return {
        success: false,
        error: '職員の削除に失敗しました'
      };
    }

    Logger.log('職員を削除しました: ' + staffId);

    return {
      success: true,
      data: {
        message: '職員を削除しました'
      }
    };

  } catch (error) {
    Logger.log('職員削除エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ====================
// シフトマスタ管理
// ====================

/**
 * 全シフトを取得（管理者用・クライアント側から呼び出し）
 * @returns {Object} シフトデータ
 */
function getAllShiftsForAdmin() {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    const shiftModel = new ShiftModel();
    const shifts = shiftModel.getAllShifts();

    return {
      success: true,
      data: shifts
    };

  } catch (error) {
    Logger.log('全シフト取得エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * シフトを保存（クライアント側から呼び出し）
 * @param {string} name - シフト名
 * @param {string} startTime - 開始時間
 * @param {string} endTime - 終了時間
 * @returns {Object} 保存結果
 */
function saveShift(name, startTime, endTime) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!name) {
      return {
        success: false,
        error: 'シフト名を指定してください'
      };
    }

    const shiftModel = new ShiftModel();
    const shiftId = shiftModel.addShift({
      name: name,
      startTime: startTime,
      endTime: endTime
    });

    Logger.log('シフトを保存しました: ' + shiftId);

    return {
      success: true,
      data: {
        shiftId: shiftId,
        message: 'シフトを保存しました'
      }
    };

  } catch (error) {
    Logger.log('シフト保存エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * シフトを更新（クライアント側から呼び出し）
 * @param {string} shiftId - シフトID
 * @param {string} name - シフト名
 * @param {string} startTime - 開始時間
 * @param {string} endTime - 終了時間
 * @returns {Object} 更新結果
 */
function updateShiftData(shiftId, name, startTime, endTime) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!shiftId || !name) {
      return {
        success: false,
        error: 'シフトIDとシフト名を指定してください'
      };
    }

    const shiftModel = new ShiftModel();
    const result = shiftModel.updateShift(shiftId, {
      name: name,
      startTime: startTime,
      endTime: endTime
    });

    if (!result) {
      return {
        success: false,
        error: 'シフトの更新に失敗しました'
      };
    }

    Logger.log('シフトを更新しました: ' + shiftId);

    return {
      success: true,
      data: {
        message: 'シフトを更新しました'
      }
    };

  } catch (error) {
    Logger.log('シフト更新エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * シフトを削除（クライアント側から呼び出し）
 * @param {string} shiftId - シフトID
 * @returns {Object} 削除結果
 */
function deleteShiftData(shiftId) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!shiftId) {
      return {
        success: false,
        error: 'シフトIDを指定してください'
      };
    }

    const shiftModel = new ShiftModel();
    const result = shiftModel.deleteShift(shiftId);

    if (!result) {
      return {
        success: false,
        error: 'シフトの削除に失敗しました'
      };
    }

    Logger.log('シフトを削除しました: ' + shiftId);

    return {
      success: true,
      data: {
        message: 'シフトを削除しました'
      }
    };

  } catch (error) {
    Logger.log('シフト削除エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ====================
// ルールマスタ管理
// ====================

/**
 * 全ルールを取得（管理者用・クライアント側から呼び出し）
 * @returns {Object} ルールデータ
 */
function getAllRulesForAdmin() {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    const ruleModel = new RuleModel();
    const rules = ruleModel.getAllRules();

    return {
      success: true,
      data: rules
    };

  } catch (error) {
    Logger.log('全ルール取得エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ルールを保存（クライアント側から呼び出し）
 * @param {string} name - ルール名
 * @param {string} content - 内容
 * @param {string} priority - 重要度
 * @returns {Object} 保存結果
 */
function saveRule(name, content, priority) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!name || !content) {
      return {
        success: false,
        error: 'ルール名と内容を指定してください'
      };
    }

    const ruleModel = new RuleModel();
    const ruleId = ruleModel.addRule({
      name: name,
      content: content,
      priority: priority || '中'
    });

    Logger.log('ルールを保存しました: ' + ruleId);

    return {
      success: true,
      data: {
        ruleId: ruleId,
        message: 'ルールを保存しました'
      }
    };

  } catch (error) {
    Logger.log('ルール保存エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ルールを更新（クライアント側から呼び出し）
 * @param {string} ruleId - ルールID
 * @param {string} name - ルール名
 * @param {string} content - 内容
 * @param {string} priority - 重要度
 * @returns {Object} 更新結果
 */
function updateRuleData(ruleId, name, content, priority) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!ruleId || !name || !content) {
      return {
        success: false,
        error: 'ルールID、ルール名、内容を指定してください'
      };
    }

    const ruleModel = new RuleModel();
    const result = ruleModel.updateRule(ruleId, {
      name: name,
      content: content,
      priority: priority
    });

    if (!result) {
      return {
        success: false,
        error: 'ルールの更新に失敗しました'
      };
    }

    Logger.log('ルールを更新しました: ' + ruleId);

    return {
      success: true,
      data: {
        message: 'ルールを更新しました'
      }
    };

  } catch (error) {
    Logger.log('ルール更新エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ルールを削除（クライアント側から呼び出し）
 * @param {string} ruleId - ルールID
 * @returns {Object} 削除結果
 */
function deleteRuleData(ruleId) {
  try {
    const user = getSessionUser();
    if (!user || user.role !== '管理者') {
      return {
        success: false,
        error: '管理者権限が必要です'
      };
    }

    if (!ruleId) {
      return {
        success: false,
        error: 'ルールIDを指定してください'
      };
    }

    const ruleModel = new RuleModel();
    const result = ruleModel.deleteRule(ruleId);

    if (!result) {
      return {
        success: false,
        error: 'ルールの削除に失敗しました'
      };
    }

    Logger.log('ルールを削除しました: ' + ruleId);

    return {
      success: true,
      data: {
        message: 'ルールを削除しました'
      }
    };

  } catch (error) {
    Logger.log('ルール削除エラー: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
