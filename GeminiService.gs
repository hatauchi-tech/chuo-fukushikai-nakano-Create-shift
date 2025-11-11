/**
 * Gemini APIサービス
 *
 * @file services/GeminiService.gs
 * @class GeminiService
 */
class GeminiService {
  constructor() {
    this.config = new Config();
    this.apiKey = this.config.getGeminiApiKey();
    this.model = this.config.getGeminiModel();
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  /**
   * Gemini APIを呼び出してシフトを生成
   * @param {Object} params - パラメータ
   * @param {Array<Object>} params.staffs - 職員データの配列
   * @param {Object} params.requests - 職員ごとの休み希望 {staffName: [dates]}
   * @param {Array<Date>} params.dates - 対象日付の配列
   * @param {string} params.rulesText - ルールテキスト
   * @returns {Object} 生成結果 {success, data, feedback}
   */
  generateShift(params) {
    try {
      Logger.log('Gemini APIでシフト生成を開始します');

      const prompt = this._buildPrompt(params);
      Logger.log('プロンプトを作成しました');

      const response = this._callGeminiApi(prompt);
      Logger.log('Gemini APIから応答を受信しました');

      const result = this._parseResponse(response, params.staffs, params.dates);
      Logger.log('応答を解析しました');

      return result;

    } catch (error) {
      Logger.log('Gemini APIエラー: ' + error.toString());
      return {
        success: false,
        error: error.toString(),
        feedback: 'APIの呼び出しに失敗しました: ' + error.toString()
      };
    }
  }

  /**
   * プロンプトを構築
   * @param {Object} params - パラメータ
   * @returns {string} プロンプト
   * @private
   */
  _buildPrompt(params) {
    const { staffs, requests, dates, rulesText } = params;

    // 職員情報の整形
    const staffInfo = staffs.map(staff => {
      const requestDates = requests[staff.name] || [];
      const requestDatesStr = requestDates.map(d => formatDate(d)).join(', ');

      return `- ${staff.name}（グループ: ${staff.groups.join(',')}、ユニット: ${staff.unit}、雇用形態: ${staff.employmentType}、喀痰吸引資格: ${staff.isSuctionCertified ? '有' : '無'}）
  休み希望日: ${requestDatesStr || 'なし'}
  勤務配慮: ${staff.workConsiderations || 'なし'}`;
    }).join('\n');

    // 日付情報の整形
    const dateInfo = dates.map(date => {
      return `${formatDate(date)}（${getJapaneseWeekday(date)}）`;
    }).join('\n');

    const prompt = `# シフト作成依頼

あなたは介護施設のシフト作成AIアシスタントです。
以下の情報を元に、1ヶ月分のシフトを作成してください。

## 対象期間
${dateInfo}

## 職員情報
${staffInfo}

## シフト作成ルール
${rulesText}

## 出力形式
以下の形式で、純粋なJSON形式のみで出力してください。日付はYYYY/MM/DD形式で指定してください：
{"shifts":{"職員名1":{"YYYY/MM/DD":"シフト種別"},"職員名2":{...}},"feedback":"注意事項"}

## シフト種別
- 早出
- 日勤
- 遅出
- 夜勤
- 休み

## 重要な指示
1. すべての職員のすべての日付に対してシフトを割り当ててください
2. 休み希望は最優先で反映してください
3. ルールに従ってシフトを作成してください
4. ルールを完全に守れない場合は、feedbackフィールドにその理由を記載してください
5. **必ず純粋なJSON形式のみで出力してください（マークダウンのコードブロック記号やその他の説明文は一切含めないでください）**
6. 出力の最初の文字は必ず「{」で、最後の文字は必ず「}」にしてください

それでは、シフトを作成してください。`;

    return prompt;
  }

  /**
   * Gemini APIを呼び出し
   * @param {string} prompt - プロンプト
   * @returns {Object} APIレスポンス
   * @private
   */
  _callGeminiApi(prompt) {
    const url = `${this.endpoint}?key=${this.apiKey}`;

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    Logger.log('Gemini APIを呼び出しています...');

    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      throw new Error(`API Error: ${statusCode} - ${response.getContentText()}`);
    }

    const jsonResponse = JSON.parse(response.getContentText());

    if (!jsonResponse.candidates || jsonResponse.candidates.length === 0) {
      throw new Error('APIから有効な応答が得られませんでした');
    }

    // レスポンスの完全性をチェック
    const candidate = jsonResponse.candidates[0];
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      Logger.log('警告: レスポンスが途中で終了しました。理由: ' + candidate.finishReason);
      if (candidate.finishReason === 'MAX_TOKENS') {
        Logger.log('トークン数の上限に達しました。maxOutputTokensの増加を検討してください。');
      }
    }

    return jsonResponse;
  }

  /**
   * APIレスポンスを解析
   * @param {Object} response - APIレスポンス
   * @param {Array<Object>} staffs - 職員データ
   * @param {Array<Date>} dates - 日付配列
   * @returns {Object} 解析結果
   * @private
   */
  _parseResponse(response, staffs, dates) {
    try {
      const content = response.candidates[0].content.parts[0].text;
      Logger.log('APIレスポンス長: ' + content.length + ' 文字');
      Logger.log('APIレスポンステキスト（最初の500文字）: ' + content.substring(0, 500));
      Logger.log('APIレスポンステキスト（最後の200文字）: ' + content.substring(Math.max(0, content.length - 200)));

      // JSONブロックを抽出（より堅牢な方法）
      let jsonText = content.trim();

      // ```json ... ``` または ``` ... ``` のパターンを除去
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
      }

      jsonText = jsonText.trim();

      Logger.log('パース対象のJSONテキスト（最初の200文字）: ' + jsonText.substring(0, 200));

      const parsedData = JSON.parse(jsonText);

      if (!parsedData.shifts) {
        throw new Error('shifts フィールドが見つかりません');
      }

      // シフトデータを配列形式に変換
      const shiftArray = [];

      staffs.forEach(staff => {
        const staffShifts = parsedData.shifts[staff.name];

        if (!staffShifts) {
          Logger.log(`警告: ${staff.name} のシフトが見つかりません`);
          // デフォルトで休みを設定
          dates.forEach(date => {
            shiftArray.push({
              date: date,
              staffName: staff.name,
              shiftName: '休み'
            });
          });
          return;
        }

        dates.forEach(date => {
          const dateStr = formatDate(date);
          const shiftName = staffShifts[dateStr] || '休み';

          shiftArray.push({
            date: date,
            staffName: staff.name,
            shiftName: shiftName
          });
        });
      });

      return {
        success: true,
        data: shiftArray,
        feedback: parsedData.feedback || '特になし'
      };

    } catch (error) {
      Logger.log('レスポンス解析エラー: ' + error.toString());
      return {
        success: false,
        error: error.toString(),
        feedback: 'レスポンスの解析に失敗しました: ' + error.toString()
      };
    }
  }

  /**
   * テスト用: 簡単なプロンプトでAPIをテスト
   * @returns {string} レスポンステキスト
   */
  testApi() {
    try {
      const response = this._callGeminiApi('こんにちは。あなたの名前を教えてください。');
      const content = response.candidates[0].content.parts[0].text;
      Logger.log('テスト成功: ' + content);
      return content;
    } catch (error) {
      Logger.log('テスト失敗: ' + error.toString());
      throw error;
    }
  }
}
