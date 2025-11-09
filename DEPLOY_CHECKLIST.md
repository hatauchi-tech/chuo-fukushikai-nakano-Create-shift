# GASエディタへのデプロイチェックリスト

以下の全20ファイルをGASエディタにコピー＆ペーストしてください。

## チェックリスト

### 基本ファイル (2ファイル)
- [ ] Config (.gs)
- [ ] Code (.gs)

### ユーティリティ (3ファイル)
- [ ] DateUtils (.gs)
- [ ] StringUtils (.gs)
- [ ] SampleData (.gs)

### モデル層 (6ファイル)
- [ ] BaseModel (.gs)
- [ ] StaffModel (.gs)
- [ ] ShiftModel (.gs)
- [ ] RequestModel (.gs)
- [ ] EventModel (.gs)
- [ ] RuleModel (.gs)

### サービス層 (2ファイル)
- [ ] GeminiService (.gs)
- [ ] PdfService (.gs)

### コントローラー層 (3ファイル)
- [ ] AuthController (.gs)
- [ ] ShiftController (.gs)
- [ ] RequestController (.gs)

### ビュー層 (4ファイル)
- [ ] Login (.html)
- [ ] StaffDashboard (.html)
- [ ] LeaderDashboard (.html)
- [ ] MasterManagement (.html)

## 注意事項

1. **ファイル名は拡張子なし**
   - ファイル: `Code.gs` → GASでの名前: `Code`
   - ファイル: `Login.html` → GASでの名前: `Login`

2. **HTMLファイルの作成方法**
   - GASエディタで「+」ボタン → 「HTML」を選択
   - ファイル名を入力（例: `Login`）
   - 内容をコピー＆ペースト

3. **スクリプトファイルの作成方法**
   - GASエディタで「+」ボタン → 「スクリプト」を選択
   - ファイル名を入力（例: `Config`）
   - 内容をコピー＆ペースト

4. **デフォルトのCode.gsを削除しない**
   - 初期状態で存在する`Code.gs`はそのまま上書きしてOK

5. **appsscript.jsonについて**
   - GASエディタの「プロジェクトの設定」→「appsscript.jsonをエディタで表示する」をON
   - `appsscript.json`ファイルが表示されるので内容を上書き

## デプロイ後の確認

- [ ] 全20ファイルが作成されている
- [ ] `appsscript.json`が正しく設定されている
- [ ] `Config.setProperties()`でスクリプトプロパティを設定
- [ ] スプレッドシート初期化を実行
- [ ] サンプルデータ投入を実行
- [ ] Webアプリとしてデプロイ
- [ ] ログイン画面が表示される
