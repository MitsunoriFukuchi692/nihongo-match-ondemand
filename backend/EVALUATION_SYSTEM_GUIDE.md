# 📋 日本語会話マッチングシステム - 評価システム実装ガイド

## 🎯 実装概要

SQLiteを使用した評価システムを実装しました。以下の機能が含まれています：

### ✅ 実装した機能

1. **評価データベース** - SQLiteで評価を永続保存
2. **評価送信機能** - Socket.ioで`submit_evaluation`イベント
3. **評価取得機能** - 講師・学習者の評価一覧を取得
4. **評価統計API** - 平均評価やレーティング集計

## 🔧 セットアップ手順

### ステップ1: パッケージのインストール

```bash
cd C:\Users\mfuku\nihongo-match-ondemand\backend

# 古いmongooseを削除
npm uninstall mongoose

# SQLiteをインストール
npm install sqlite3@5.1.6

# または、package.jsonを置き換えて実行
npm install
```

### ステップ2: ファイルを置き換え

```bash
# 古いserver.jsをバックアップ
ren server.js server.js.bak

# 新しいserver.jsをコピー
# （今回作成したserver.jsを使用）
```

## 📊 データベーススキーマ

SQLiteは`evaluation.db`というファイルで自動作成されます。

**テーブル: evaluations**

```sql
CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evaluatorId TEXT NOT NULL,              -- 評価者のSocket ID
  evaluatorRole TEXT NOT NULL,            -- 'teacher' or 'student'
  evaluatorName TEXT NOT NULL,            -- 評価者の名前
  targetId TEXT NOT NULL,                 -- 評価対象者のSocket ID
  targetRole TEXT NOT NULL,               -- 'teacher' or 'student'
  targetName TEXT NOT NULL,               -- 評価対象者の名前
  rating INTEGER NOT NULL,                -- 1-5の評価
  comment TEXT,                           -- コメント（任意）
  timestamp TEXT NOT NULL,                -- ISO形式のタイムスタンプ
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 🔌 Socket.io イベント

### 1. 評価を送信

**イベント**: `submit_evaluation`

```javascript
// クライアント側（EvaluationForm.js）
socket.emit('submit_evaluation', evaluationData, (response) => {
  console.log('✅ 評価送信成功:', response);
  // response.success === true なら成功
  // response.id で保存されたID取得
});
```

**サーバー側での処理**:
- 評価データをSQLiteに保存
- コールバックで成功/失敗を返す

### 2. 講師の評価一覧を取得

**イベント**: `get_teacher_evaluations`

```javascript
socket.emit('get_teacher_evaluations', teacherId, (response) => {
  if (response.success) {
    console.log('✅ 評価取得成功:', response.evaluations);
    // response.evaluations は評価オブジェクトの配列
  }
});
```

### 3. 学習者の評価一覧を取得

**イベント**: `get_student_evaluations`

```javascript
socket.emit('get_student_evaluations', studentId, (response) => {
  if (response.success) {
    console.log('✅ 評価取得成功:', response.evaluations);
  }
});
```

## 🌐 REST API エンドポイント

### 講師の平均評価を取得

```http
GET http://localhost:5000/api/teacher/:teacherId/rating
```

**レスポンス例**:
```json
{
  "teacherId": "socket-id-123",
  "totalRatings": 5,
  "averageRating": 4.2
}
```

## 📝 評価データの構造

```javascript
{
  id: 1,                                    // DB自動採番
  evaluatorId: "socket-id-abc",            // 評価者
  evaluatorRole: "student",                // student or teacher
  evaluatorName: "田中太郎",                // 評価者の名前
  targetId: "socket-id-xyz",               // 評価対象
  targetRole: "teacher",                   // 対象のロール
  targetName: "佐藤講師",                   // 対象の名前
  rating: 5,                               // 1-5の評価
  comment: "とても良い講師です！",          // コメント（最大200字）
  timestamp: "2025-11-12T10:30:00.000Z",  // ISO形式
  createdAt: "2025-11-12 10:30:00"        // SQLite自動記録
}
```

## ✨ EvaluationForm.js との連携

現在のEvaluationForm.jsは既に以下の機能を実装しています：

1. ✅ 5段階評価（星形UI）
2. ✅ コメント入力（最大200字）
3. ✅ `submit_evaluation`イベント送信
4. ✅ コールバック処理

### 改善案（フロントエンド）

以下をLessonRoom.jsなどで実装するとより完全です：

```javascript
// レッスン終了後に評価フォームを表示
<EvaluationForm
  socket={socket}
  userRole={userRole}
  currentUserName={currentUserName}
  otherUserSocketId={otherUserSocketId}
  otherUserName={otherUserName}
  onSubmit={() => {
    // 評価送信後の処理
    socket.emit('get_teacher_evaluations', otherUserSocketId, (response) => {
      if (response.success) {
        console.log('最新評価:', response.evaluations);
      }
    });
  }}
/>
```

## 🧪 テスト方法

### 方法1: 開発者ツール（ブラウザ）

```javascript
// コンソールで評価を送信
socket.emit('submit_evaluation', {
  evaluatorId: socket.id,
  evaluatorRole: 'student',
  evaluatorName: 'テスト学習者',
  targetId: 'teacher-socket-id',
  targetRole: 'teacher',
  targetName: 'テスト講師',
  rating: 5,
  comment: 'テストコメント',
  timestamp: new Date().toISOString()
}, (response) => {
  console.log('レスポンス:', response);
});
```

### 方法2: SQLiteの直接確認

```bash
# SQLiteコマンドラインツールをインストール
# https://www.sqlite.org/download.html

# データベースを確認
sqlite3 C:\Users\mfuku\nihongo-match-ondemand\backend\evaluation.db

# SQLコマンド例
> SELECT * FROM evaluations;
> SELECT targetName, AVG(rating) FROM evaluations GROUP BY targetName;
> SELECT * FROM evaluations WHERE targetRole = 'teacher' ORDER BY createdAt DESC;
```

## 🐛 トラブルシューティング

### Q: `evaluation.db`が作成されない

**A**: 以下を確認してください：
- backendフォルダに対する書き込み権限
- Node.jsサーバーが起動している
- ポート5000が利用可能

### Q: 評価がデータベースに保存されない

**A**: 以下をチェック：
1. ブラウザコンソールでエラーを確認
2. Node.jsターミナルでログを確認（「⭐ ========== 評価受信 ==========」が出ているか）
3. SQLiteファイルの権限を確認

### Q: "mongoose is not defined" エラーが出る

**A**: package.jsonを新しいものに更新してください：
```bash
npm uninstall mongoose
npm install
```

## 📈 次のステップ

1. **フロントエンド改善**
   - 講師プロフィールに平均評価を表示
   - 受講者が評価一覧を見られるUI

2. **統計ダッシュボード**
   - 講師ランキング
   - 評価の分布グラフ

3. **本番運用対応**
   - データベースのバックアップ機能
   - 不適切な評価のモデレーション

## 💡 注意点

- 現在のシステムはメモリ内でレッスン管理（activeLessons）を行っています
- 本番環境ではレッスン履歴もSQLiteに保存することをお勧めします
- 複数サーバー運用の場合、SQLiteではなくMySQL/PostgreSQLへの移行を検討してください

---

何か質問があれば、いつでもお聞きください！
