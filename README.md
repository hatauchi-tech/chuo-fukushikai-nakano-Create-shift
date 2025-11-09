# AIシフト作成アプリ

介護施設向けのAIシフト自動生成Webアプリケーション。Google Apps Script (GAS) と Gemini API を活用して、複雑なシフト作成業務を自動化します。

## 概要

本システムは、以下の機能を提供します：

- **職員向け機能**
  - 休み希望の提出
  - イベントカレンダーの閲覧

- **リーダー向け機能**
  - AIによるシフト自動生成
  - シフトの手動修正（プルダウン方式）
  - PDF出力（Googleドライブへ保存）
  - マスタ管理（職員、シフト、ルール、イベント）

## 技術スタック

- **バックエンド**: Google Apps Script (GAS)
- **データベース**: Google スプレッドシート
- **AI**: Gemini API
- **フロントエンド**: HTML + Tailwind CSS
- **アーキテクチャ**: MVC風の構成

## ファイル構成

全てのファイルは同一階層に配置されています（GASエディタで手動デプロイしやすくするため）。

```
chuo-fukushikai-nakano-Create-shift/
├── appsscript.json                  # GASプロジェクト設定
├── シフトアプリ_要件定義書.md      # 要件定義書
├── README.md                        # このファイル
│
├── Code.gs                          # メインエントリーポイント
├── Config.gs                        # 設定管理
│
├── BaseModel.gs                     # モデル層: ベースモデル
├── StaffModel.gs                    # モデル層: 職員マスタ
├── ShiftModel.gs                    # モデル層: シフトマスタ・シフト表
├── RequestModel.gs                  # モデル層: 休み希望
├── EventModel.gs                    # モデル層: イベント
├── RuleModel.gs                     # モデル層: ルールマスタ
│
├── AuthController.gs                # コントローラー層: 認証
├── ShiftController.gs               # コントローラー層: シフト管理
├── RequestController.gs             # コントローラー層: 休み希望・イベント
│
├── GeminiService.gs                 # サービス層: Gemini API連携
├── PdfService.gs                    # サービス層: PDF出力
│
├── DateUtils.gs                     # ユーティリティ: 日付処理
├── StringUtils.gs                   # ユーティリティ: 文字列処理
├── SampleData.gs                    # ユーティリティ: サンプルデータ投入
│
├── Login.html                       # ビュー層: ログイン画面
├── StaffDashboard.html              # ビュー層: 職員用ダッシュボード
├── LeaderDashboard.html             # ビュー層: リーダー用ダッシュボード
└── MasterManagement.html            # ビュー層: マスタ管理画面
```

## セットアップ手順

### 1. Google スプレッドシートの作成

1. Google スプレッドシートを新規作成
2. スプレッドシートIDをメモ（URLの `/d/` と `/edit` の間の文字列）

### 2. Google ドライブフォルダの作成

1. PDF出力先となるフォルダをGoogle ドライブ上に作成
2. フォルダIDをメモ（フォルダのURLの最後の文字列）

### 3. Gemini API キーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. APIキーを作成してメモ

### 4. GASプロジェクトの作成

1. Google スプレッドシートから「拡張機能」→「Apps Script」を開く
2. プロジェクト名を「AIシフト作成アプリ」に変更

### 5. ソースコードのデプロイ

GASエディタで手動でファイルを作成し、コピー＆ペーストします。

**全20ファイル**を作成する必要があります。詳細は `DEPLOY_CHECKLIST.md` を参照してください。

#### 手順:

1. GASエディタで各ファイルを作成
2. 各 `.gs` ファイルと `.html` ファイルをコピー＆ペースト
   - **ファイル名は拡張子を除いた名前にする**
   - 例: `Code.gs` → ファイル名 `Code`、`Login.html` → ファイル名 `Login`

#### ファイル作成方法:

**スクリプトファイル (.gs):**
- GASエディタで「+」ボタン → 「スクリプト」を選択
- ファイル名を入力（拡張子なし）
- ファイルの内容をコピー＆ペースト

**HTMLファイル (.html):**
- GASエディタで「+」ボタン → 「HTML」を選択
- ファイル名を入力（拡張子なし）
- ファイルの内容をコピー＆ペースト

**appsscript.json:**
- GASエディタの「プロジェクトの設定」→「appsscript.jsonをエディタで表示する」をON
- `appsscript.json`ファイルが表示されるので内容を上書き

#### ファイル一覧（全20ファイル）:

- **基本**: Config, Code
- **ユーティリティ**: DateUtils, StringUtils, SampleData
- **モデル**: BaseModel, StaffModel, ShiftModel, RequestModel, EventModel, RuleModel
- **サービス**: GeminiService, PdfService
- **コントローラー**: AuthController, ShiftController, RequestController
- **ビュー**: Login, StaffDashboard, LeaderDashboard, MasterManagement

### 6. スクリプトプロパティの設定

GASエディタのスクリプトエディタで、以下のスクリプトを実行：

```javascript
// スクリプトプロパティを設定
Config.setProperties(
  'YOUR_SPREADSHEET_ID',      // 手順1で作成したスプレッドシートID
  'YOUR_DRIVE_FOLDER_ID',     // 手順2で作成したフォルダID
  'YOUR_GEMINI_API_KEY',      // 手順3で取得したAPIキー
  'gemini-1.5-flash'          // 使用するGeminiモデル
);
```

### 7. スプレッドシートの初期化

1. スプレッドシートを開く
2. メニューに「シフトアプリ設定」が表示されることを確認
3. 「シフトアプリ設定」→「スプレッドシート初期化」を実行
4. 「シフトアプリ設定」→「サンプルデータ投入」を実行

### 8. Webアプリとしてデプロイ

1. GASエディタで「デプロイ」→「新しいデプロイ」
2. 種類: 「ウェブアプリ」
3. 説明: 任意
4. 次のユーザーとして実行: 「自分」
5. アクセスできるユーザー: 「全員」または組織内に限定
6. 「デプロイ」をクリック
7. デプロイされたURLをメモ

### 9. 動作確認

1. デプロイされたURLにアクセス
2. ログイン画面が表示されることを確認
3. サンプルデータで作成されたユーザーでログイン：
   - **リーダー**: 氏名 `山田 太郎`、パスワード `leader123`
   - **一般職員**: 氏名 `鈴木 一郎`、パスワード `staff123`

## 使用方法

### 職員（一般ユーザー）

1. ログイン画面で所属グループ、氏名、パスワードを入力
2. カレンダーから休み希望日を選択
3. 「休み希望を提出」ボタンをクリック

### リーダー（管理者）

1. ログイン画面で管理者アカウントでログイン
2. 対象月とグループを選択
3. 「シフト自動生成」ボタンをクリック（数分かかる場合があります）
4. 生成されたシフトを確認し、必要に応じてプルダウンで修正
5. 「PDF出力」ボタンでGoogleドライブにPDFを保存

### マスタ管理

1. リーダーダッシュボードから「マスタ管理」をクリック
2. 各タブで職員、シフト、ルール、イベントを管理

## データベース構造

### マスタテーブル

- **M_職員**: 職員情報（氏名、グループ、資格など）
- **M_シフト**: シフト種別（早出、日勤、遅出、夜勤、休み）
- **M_ルール**: AIが参照するシフト作成ルール

### トランザクションテーブル

- **T_シフト希望**: 職員が提出した休み希望（親）
- **T_シフト希望詳細**: 休み希望日（子）
- **T_シフト表**: 生成されたシフト表（親）
- **T_シフト表詳細**: シフトの詳細データ（子）
- **T_イベント**: 共有イベント（会議など）

## トラブルシューティング

### スクリプトプロパティが設定されていないエラー

```
Config.setProperties()を実行してください
```

### Gemini APIエラー

- APIキーが正しいか確認
- API利用制限に達していないか確認
- [Google AI Studio](https://makersuite.google.com/)で確認

### シフト生成が6分以内に完了しない

- 対象職員数を減らす
- ルールを簡略化する
- Geminiモデルを`gemini-1.5-flash`に変更（高速）

## 開発者向け情報

### ログの確認

GASエディタの「実行ログ」でログを確認できます。

### デバッグ

各関数は単体で実行可能です：

```javascript
// Gemini APIのテスト
const geminiService = new GeminiService();
geminiService.testApi();

// 職員データの取得
const staffModel = new StaffModel();
const staffs = staffModel.getActiveStaffs();
Logger.log(staffs);
```

### カスタマイズ

- ルールマスタにルールを追加することでAIの挙動を調整可能
- シフトマスタで勤務時間帯を変更可能
- HTMLファイルでUIをカスタマイズ可能

## ライセンス

このプロジェクトは中央福祉会中野様向けに開発されたものです。

## サポート

問題が発生した場合は、以下を確認してください：

1. スクリプトプロパティが正しく設定されているか
2. スプレッドシートの初期化とサンプルデータ投入が完了しているか
3. 実行ログにエラーメッセージが出ていないか

---

**開発日**: 2025年11月
**開発者**: Claude (Anthropic AI)
**バージョン**: 1.0.0
