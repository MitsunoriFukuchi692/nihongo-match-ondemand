# バックエンドセットアップガイド

## 📁 ファイル配置手順

### ステップ1️⃣：server.js をコピー

ダウンロードした `server.js` を以下の場所にコピーしてください：

```
C:\Users\mfuku\nihongo-match-ondemand\backend\server.js
```

### ステップ2️⃣：.env ファイルをコピー

ダウンロードした `.env` を以下の場所にコピーしてください：

```
C:\Users\mfuku\nihongo-match-ondemand\backend\.env
```

### ステップ3️⃣：package.json を置き換え

現在の `C:\Users\mfuku\nihongo-match-ondemand\backend\package.json` を、ダウンロードした `package_backend.json` で置き換えてください：

```
# 古いファイルを削除
C:\Users\mfuku\nihongo-match-ondemand\backend\package.json

# 新しいファイルをコピー＆リネーム
C:\Users\mfuku\nihongo-match-ondemand\backend\package_backend.json
    → package.json にリネーム
```

---

## ✅ ファイル配置確認

配置完了後、以下のフォルダ構成になっていることを確認：

```
C:\Users\mfuku\nihongo-match-ondemand\
├── backend\
│   ├── node_modules\     （既存）
│   ├── server.js         ✅ NEW
│   ├── .env              ✅ NEW
│   ├── package.json      ✅ 更新
│   └── package-lock.json
├── src\
├── public\
├── package.json
└── ...
```

---

## 🚀 サーバー起動

### ステップ1️⃣：backend フォルダに入る

```bash
cd C:\Users\mfuku\nihongo-match-ondemand\backend
```

### ステップ2️⃣：サーバーを起動

```bash
npm start
```

### ✨ 起動成功時の表示

以下のようなメッセージが表示されます：

```
╔════════════════════════════════════════╗
║  🚀 日本語オンデマンドシステム        ║
║                                        ║
║  サーバー起動成功！                    ║
║  ポート: 5000                         ║
║  環境: development                    ║
║                                        ║
║  http://localhost:5000                ║
╚════════════════════════════════════════╝
```

---

## 📊 サーバーの機能説明

### リアルタイム通信（Socket.io）

#### 教師がオンラインになった
```javascript
socket.on('teacher_online', (teacherData) => {
  // teacherData: { name, email, proficiency, timeSlots, ... }
  // → すべてのクライアントに通知
});
```

#### 学習者が「今すぐ開始」をリクエスト
```javascript
socket.on('request_lesson', (studentData) => {
  // 教師が空いているか確認
  // 空いていれば → マッチング成功
  // 忙しければ → 待機キューに追加
});
```

#### レッスン完了
```javascript
socket.on('lesson_complete', (data) => {
  // 待機キューから次の学習者を処理
});
```

### REST API エンドポイント

#### 教師一覧を取得
```bash
GET http://localhost:5000/api/teachers
```

**レスポンス例:**
```json
[
  {
    "teacherId": "socket_id_123",
    "name": "山田太郎",
    "email": "yamada@example.com",
    "proficiency": "初級",
    "timeSlots": "朝（6時～12時）"
  },
  ...
]
```

#### 統計情報を取得
```bash
GET http://localhost:5000/api/stats
```

**レスポンス例:**
```json
{
  "onlineTeachers": 3,
  "activeLessons": 1,
  "waitingStudents": 2
}
```

---

## 🔄 マッチングロジック

### フロー図

```
学習者が「今すぐ開始」をクリック
  ↓
教師がオンラインか確認
  ├─ NO → エラーメッセージ
  │
  └─ YES → 教師がレッスン中か確認
     ├─ YES → 待機キューに追加
     │        → 何番目かを表示
     │
     └─ NO → マッチング成功！
        ├─ 学習者に「開始」を通知
        ├─ 教師に「学習者情報」を通知
        └─ レッスン開始
```

---

## 📝 データ構造

### オンラインの教師 (Map)
```javascript
{
  socketId: {
    name: "山田太郎",
    email: "yamada@example.com",
    proficiencyLevel: "初級",
    timeSlots: "朝（6時～12時）",
    onlineAt: Date
  }
}
```

### 待機キュー (Array)
```javascript
[
  {
    studentId: "socket_id_456",
    studentName: "太郎",
    studentLevel: "少し話せる",
    wantedTeacherId: "socket_id_123",
    requestedAt: Date
  },
  ...
]
```

### アクティブなレッスン (Map)
```javascript
{
  "lesson_1699267800000": {
    lessonId: "lesson_1699267800000",
    teacherId: "socket_id_123",
    studentId: "socket_id_456",
    studentName: "太郎",
    teacherName: "山田太郎",
    startTime: Date,
    duration: 15
  }
}
```

---

## ⚠️ トラブルシューティング

### ❌ エラー: "Cannot find module 'express'"

**解決方法:**
```bash
npm install
```

### ❌ エラー: "EADDRINUSE: address already in use :::5000"

**解決方法:**
```
別のプロセスがポート5000を使用している
  ↓
タスクマネージャーで node.exe を終了
  ↓
もう一度 npm start を実行
```

### ❌ エラー: "Cannot find .env file"

**解決方法:**
```
.env ファイルが backend フォルダにあるか確認
C:\Users\mfuku\nihongo-match-ondemand\backend\.env
```

---

## 🧪 サーバーのテスト方法

### ブラウザで確認

```
http://localhost:5000/api/stats
```

ブラウザを開いて上記にアクセス。以下のようなJSONが表示されれば成功：

```json
{
  "onlineTeachers": 0,
  "activeLessons": 0,
  "waitingStudents": 0
}
```

### コンソールでの確認

サーバー起動時にコンソールに以下のようなログが出ます：

```
✅ クライアント接続: socket_id_xyz
📚 教師がオンラインになりました: 山田太郎
🎓 学習者がレッスンをリクエストしました: 太郎
✅ マッチング成功！レッスン開始: lesson_123
✅ レッスン完了: lesson_123
```

---

## 🎯 次のステップ

1. ✅ backend/server.js 配置
2. ✅ backend/.env 配置
3. ✅ backend/package.json 更新
4. ✅ npm start で起動確認
5. 次 → フロントエンド（React）の修正

---

## 📚 ファイル説明

### server.js
- Express + Socket.io のメインサーバーファイル
- リアルタイム通信、マッチングロジック、API エンドポイントが実装されている

### .env
- 環境変数設定ファイル
- ポート、環境設定、MongoDB URL など

### package.json
- Node.js のプロジェクト設定
- 依存パッケージとスクリプトコマンドを定義

---

**では、ファイルをコピーして、サーバー起動をテストしてみてください！** 🚀
