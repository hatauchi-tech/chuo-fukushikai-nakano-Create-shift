/**
 * PDF出力サービス
 *
 * @file services/PdfService.gs
 * @class PdfService
 */
class PdfService {
  constructor() {
    this.config = new Config();
  }

  /**
   * シフト表をPDF出力
   * @param {Object} params - パラメータ
   * @param {Date} params.yearMonth - 年月
   * @param {Array<string>} params.groups - グループ
   * @param {Array<Object>} params.shiftData - シフトデータ
   * @param {Array<Object>} params.staffs - 職員データ
   * @returns {Object} 結果 {success, fileId, filePath}
   */
  exportToPdf(params) {
    try {
      Logger.log('PDF出力を開始します');

      const { yearMonth, groups, shiftData, staffs } = params;

      // HTMLテーブルを作成
      const html = this._createShiftTableHtml(yearMonth, groups, shiftData, staffs);

      // HTMLをBlobに変換
      const htmlBlob = Utilities.newBlob(html, 'text/html', 'temp.html');

      // PDFに変換
      const pdfBlob = htmlBlob.getAs('application/pdf');

      // ファイル名を生成
      const year = yearMonth.getFullYear();
      const month = String(yearMonth.getMonth() + 1).padStart(2, '0');
      const groupStr = groups.join('');
      const fileName = `${year}年${month}月シフト表_グループ${groupStr}.pdf`;

      pdfBlob.setName(fileName);

      // Googleドライブに保存
      const folderId = this.config.getDriveId();
      const folder = DriveApp.getFolderById(folderId);
      const file = folder.createFile(pdfBlob);

      Logger.log('PDF出力完了: ' + fileName);

      return {
        success: true,
        fileId: file.getId(),
        filePath: file.getUrl(),
        fileName: fileName
      };

    } catch (error) {
      Logger.log('PDF出力エラー: ' + error.toString());
      return {
        success: false,
        error: error.toString()
      };
    }
  }

  /**
   * シフト表のHTMLを作成
   * @param {Date} yearMonth - 年月
   * @param {Array<string>} groups - グループ
   * @param {Array<Object>} shiftData - シフトデータ
   * @param {Array<Object>} staffs - 職員データ
   * @returns {string} HTML
   * @private
   */
  _createShiftTableHtml(yearMonth, groups, shiftData, staffs) {
    const year = yearMonth.getFullYear();
    const month = yearMonth.getMonth() + 1;
    const daysInMonth = getDaysInMonth(yearMonth);

    // 職員ごとにシフトデータを整理
    const shiftByStaff = {};
    shiftData.forEach(shift => {
      if (!shiftByStaff[shift.staffName]) {
        shiftByStaff[shift.staffName] = {};
      }
      const dateKey = formatDate(shift.date);
      shiftByStaff[shift.staffName][dateKey] = shift.shiftName;
    });

    // ヘッダー行（日付）
    let headerRow = '<tr><th>氏名</th>';
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const weekday = getJapaneseWeekday(date);
      const cellClass = (weekday === '土') ? 'saturday' : (weekday === '日') ? 'sunday' : '';
      headerRow += `<th class="${cellClass}">${day}<br/>(${weekday})</th>`;
    }
    headerRow += '</tr>';

    // データ行（職員ごと）
    let dataRows = '';
    staffs.forEach(staff => {
      let row = `<tr><td class="staff-name">${staff.name}</td>`;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dateKey = formatDate(date);
        const shiftName = shiftByStaff[staff.name]?.[dateKey] || '';

        const weekday = getJapaneseWeekday(date);
        const cellClass = (weekday === '土') ? 'saturday' : (weekday === '日') ? 'sunday' : '';

        // シフトの色分け
        let shiftClass = '';
        if (shiftName === '早出') shiftClass = 'shift-early';
        else if (shiftName === '日勤') shiftClass = 'shift-day';
        else if (shiftName === '遅出') shiftClass = 'shift-late';
        else if (shiftName === '夜勤') shiftClass = 'shift-night';
        else if (shiftName === '休み') shiftClass = 'shift-off';

        row += `<td class="${cellClass} ${shiftClass}">${shiftName}</td>`;
      }

      row += '</tr>';
      dataRows += row;
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'MS PGothic', sans-serif;
      font-size: 9pt;
    }
    h1 {
      text-align: center;
      font-size: 14pt;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 auto;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #333;
      padding: 3px;
      text-align: center;
      font-size: 8pt;
    }
    th {
      background-color: #e0e0e0;
      font-weight: bold;
    }
    .staff-name {
      font-weight: bold;
      white-space: nowrap;
    }
    .saturday {
      background-color: #e3f2fd;
    }
    .sunday {
      background-color: #ffebee;
    }
    .shift-early {
      background-color: #fff9c4;
    }
    .shift-day {
      background-color: #c8e6c9;
    }
    .shift-late {
      background-color: #ffe0b2;
    }
    .shift-night {
      background-color: #b3e5fc;
    }
    .shift-off {
      background-color: #f5f5f5;
      color: #999;
    }
  </style>
</head>
<body>
  <h1>${year}年${month}月 シフト表（グループ ${groups.join(', ')}）</h1>
  <table>
    ${headerRow}
    ${dataRows}
  </table>
</body>
</html>
`;

    return html;
  }
}
