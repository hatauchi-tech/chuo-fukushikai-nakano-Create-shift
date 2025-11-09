/**
 * サンプルデータ投入スクリプト
 *
 * @file utils/SampleData.gs
 */

/**
 * サンプルデータを投入
 */
function insertSampleData() {
  Logger.log('サンプルデータの投入を開始します');

  try {
    // 1. 職員マスタのサンプルデータ
    insertSampleStaffs();

    // 2. シフトマスタのサンプルデータ
    insertSampleShifts();

    // 3. ルールマスタのサンプルデータ
    insertSampleRules();

    Logger.log('サンプルデータの投入が完了しました');

    SpreadsheetApp.getUi().alert(
      '完了',
      'サンプルデータの投入が完了しました。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    Logger.log('サンプルデータ投入エラー: ' + error.toString());
    SpreadsheetApp.getUi().alert(
      'エラー',
      'サンプルデータの投入に失敗しました: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * 職員マスタのサンプルデータを投入
 */
function insertSampleStaffs() {
  Logger.log('職員マスタのサンプルデータを投入中...');

  const staffModel = new StaffModel();

  // ヘッダーを初期化
  staffModel.initializeHeaders();

  const sampleStaffs = [
    // 管理者（リーダー）
    {
      name: '山田 太郎',
      department: '介護部',
      position: 'ユニットリーダー',
      groups: ['1', '2'],
      unit: 'A棟',
      isSuctionCertified: true,
      workConsiderations: '',
      role: '管理者',
      employmentType: '常勤',
      isActive: true,
      password: 'leader123'
    },
    {
      name: '佐藤 花子',
      department: '介護部',
      position: 'ユニットリーダー',
      groups: ['3', '4'],
      unit: 'B棟',
      isSuctionCertified: true,
      workConsiderations: '',
      role: '管理者',
      employmentType: '常勤',
      isActive: true,
      password: 'leader123'
    },

    // 一般職員（グループ1）
    {
      name: '鈴木 一郎',
      department: '介護部',
      position: '介護職員',
      groups: ['1'],
      unit: 'A棟',
      isSuctionCertified: true,
      workConsiderations: '',
      role: '一般',
      employmentType: '常勤',
      isActive: true,
      password: 'staff123'
    },
    {
      name: '田中 美咲',
      department: '介護部',
      position: '介護職員',
      groups: ['1'],
      unit: 'A棟',
      isSuctionCertified: false,
      workConsiderations: '腰痛のため夜勤配慮',
      role: '一般',
      employmentType: '常勤',
      isActive: true,
      password: 'staff123'
    },
    {
      name: '高橋 健太',
      department: '介護部',
      position: '介護職員',
      groups: ['1'],
      unit: 'A棟',
      isSuctionCertified: true,
      workConsiderations: '',
      role: '一般',
      employmentType: '常勤',
      isActive: true,
      password: 'staff123'
    },
    {
      name: '伊藤 由美',
      department: '介護部',
      position: '介護職員',
      groups: ['1'],
      unit: 'A棟',
      isSuctionCertified: false,
      workConsiderations: '',
      role: '一般',
      employmentType: '派遣',
      isActive: true,
      password: 'staff123'
    },

    // 一般職員（グループ2）
    {
      name: '渡辺 翔太',
      department: '介護部',
      position: '介護職員',
      groups: ['2'],
      unit: 'A棟',
      isSuctionCertified: true,
      workConsiderations: '',
      role: '一般',
      employmentType: '常勤',
      isActive: true,
      password: 'staff123'
    },
    {
      name: '中村 愛',
      department: '介護部',
      position: '介護職員',
      groups: ['2'],
      unit: 'A棟',
      isSuctionCertified: false,
      workConsiderations: '',
      role: '一般',
      employmentType: '常勤',
      isActive: true,
      password: 'staff123'
    },
    {
      name: '小林 大輔',
      department: '介護部',
      position: '介護職員',
      groups: ['2'],
      unit: 'A棟',
      isSuctionCertified: true,
      workConsiderations: '',
      role: '一般',
      employmentType: '常勤',
      isActive: true,
      password: 'staff123'
    },
    {
      name: '加藤 優子',
      department: '介護部',
      position: '介護職員',
      groups: ['2'],
      unit: 'A棟',
      isSuctionCertified: false,
      workConsiderations: '',
      role: '一般',
      employmentType: '派遣',
      isActive: true,
      password: 'staff123'
    },

    // 一般職員（グループ3）
    {
      name: '吉田 修',
      department: '介護部',
      position: '介護職員',
      groups: ['3'],
      unit: 'B棟',
      isSuctionCertified: true,
      workConsiderations: '',
      role: '一般',
      employmentType: '常勤',
      isActive: true,
      password: 'staff123'
    },
    {
      name: '山本 さくら',
      department: '介護部',
      position: '介護職員',
      groups: ['3'],
      unit: 'B棟',
      isSuctionCertified: false,
      workConsiderations: '',
      role: '一般',
      employmentType: '常勤',
      isActive: true,
      password: 'staff123'
    }
  ];

  sampleStaffs.forEach(staff => {
    staffModel.addStaff(staff);
  });

  Logger.log(`職員マスタに${sampleStaffs.length}件のサンプルデータを投入しました`);
}

/**
 * シフトマスタのサンプルデータを投入
 */
function insertSampleShifts() {
  Logger.log('シフトマスタのサンプルデータを投入中...');

  const shiftModel = new ShiftModel();

  // ヘッダーを初期化
  shiftModel.initializeHeaders();

  const sampleShifts = [
    {
      name: '早出',
      startTime: '07:00',
      endTime: '16:00'
    },
    {
      name: '日勤',
      startTime: '09:00',
      endTime: '18:00'
    },
    {
      name: '遅出',
      startTime: '11:00',
      endTime: '20:00'
    },
    {
      name: '夜勤',
      startTime: '16:00',
      endTime: '09:00'
    },
    {
      name: '休み',
      startTime: '',
      endTime: ''
    }
  ];

  sampleShifts.forEach(shift => {
    shiftModel.addShift(shift);
  });

  Logger.log(`シフトマスタに${sampleShifts.length}件のサンプルデータを投入しました`);
}

/**
 * ルールマスタのサンプルデータを投入
 */
function insertSampleRules() {
  Logger.log('ルールマスタのサンプルデータを投入中...');

  const ruleModel = new RuleModel();

  // ヘッダーを初期化
  ruleModel.initializeHeaders();

  const sampleRules = [
    {
      name: '休み希望の反映',
      content: '職員から提出された休み希望は必ず反映すること。休み希望日は「休み」を割り当てる。',
      priority: '最高'
    },
    {
      name: '夜勤の配置',
      content: '毎日、夜勤の職員を最低2名配置すること。うち1名は喀痰吸引資格者であることが望ましい。',
      priority: '最高'
    },
    {
      name: '連勤制限',
      content: '同一職員が5日以上連続で勤務しないようにすること。4日勤務後は最低1日の休みを入れる。',
      priority: '高'
    },
    {
      name: '夜勤後の休み',
      content: '夜勤の翌日は必ず休みを入れること。',
      priority: '最高'
    },
    {
      name: '公平な休日配分',
      content: '月間の休日数が職員間で偏らないようにすること。常勤職員は月8〜10日、派遣職員は月6〜8日程度を目安とする。',
      priority: '中'
    },
    {
      name: '早出・遅出の配置',
      content: '早出は毎日1〜2名、遅出は毎日1〜2名配置すること。',
      priority: '高'
    },
    {
      name: '日勤の配置',
      content: '日勤は毎日3〜4名配置すること。',
      priority: '高'
    },
    {
      name: '喀痰吸引資格者の配置',
      content: '各勤務帯（早出、日勤、遅出、夜勤）に最低1名の喀痰吸引資格者を配置すること。',
      priority: '最高'
    },
    {
      name: '勤務配慮の考慮',
      content: '職員の勤務配慮（腰痛のため夜勤配慮など）を可能な限り考慮すること。',
      priority: '中'
    },
    {
      name: '土日の配置',
      content: '土日も平日と同様の人員配置を行うこと。',
      priority: '高'
    }
  ];

  sampleRules.forEach(rule => {
    ruleModel.addRule(rule);
  });

  Logger.log(`ルールマスタに${sampleRules.length}件のサンプルデータを投入しました`);
}

/**
 * すべてのデータをクリア（テスト用）
 */
function clearAllData() {
  if (SpreadsheetApp.getUi().alert(
    '確認',
    'すべてのデータをクリアします。よろしいですか？',
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  ) !== SpreadsheetApp.getUi().Button.YES) {
    return;
  }

  try {
    const config = new Config();
    const ss = config.getSpreadsheet();

    const sheetNames = [
      'T_シフト表',
      'T_シフト表詳細',
      'T_シフト希望',
      'T_シフト希望詳細',
      'T_イベント',
      'M_職員',
      'M_シフト',
      'M_ルール'
    ];

    sheetNames.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        sheet.clear();
        Logger.log(`${sheetName} をクリアしました`);
      }
    });

    SpreadsheetApp.getUi().alert(
      '完了',
      'すべてのデータをクリアしました。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    Logger.log('データクリアエラー: ' + error.toString());
    SpreadsheetApp.getUi().alert(
      'エラー',
      'データのクリアに失敗しました: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
