# 🎯 Renderデプロイメント実施ガイド

## 📌 修正内容のサマリー

修正版ファイルをダウンロードしました：

```
✅ package.json      → Node.js 18.x 指定を追加
✅ server.js         → CORS_ORIGIN 環境変数対応に修正
✅ .env              → ローカル開発用環境変数
✅ .env.production   → 本番環境用環境変数
✅ RENDER_DEPLOYMENT_GUIDE.md → 完全デプロイメントガイド
```

---

## 🚀 実施手順（全5ステップ）

### **ステップ1: ローカルファイルの置き換え**

修正版ファイルを C:\Users\mfuku\nihongo-match-ondemand に上書き：

1. サーバーを一度停止：`Ctrl + C`
2. `/mnt/user-data/outputs` から以下をコピー：
   - `package.json` → プロジェクトルートに上書き
   - `server.js` → プロジェクトルートに上書き
   - `.env` → プロジェクトルートに作成
   - `.env.production` → プロジェクトルートに作成

3. 確認：
   ```bash
   npm install
   npm start
   ```
   ✅ ローカルで起動確認

---

### **ステップ2: .gitignore と Git 設定**

プロジェクトルートに `.gitignore` を作成：

```bash
# Content:
node_modules/
.env
.env.local
.env.*.local
*.db
evaluation.db
.DS_Store
```

**重要**: `.env` ファイルを Git にコミットしないこと！

---

### **ステップ3: GitHub にプッシュ**

```bash
cd C:\Users\mfuku\nihongo-match-ondemand

# Git リポジトリ初期化（初回のみ）
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"

# ファイル追加とコミット
git add .
git commit -m "Initial backend setup for Render deployment"

# GitHub にプッシュ（GitHub のリポジトリを先に作成必要）
git remote add origin https://github.com/YOUR_USERNAME/nihongo-match-ondemand.git
git branch -M main
git push -u origin main
```

---

### **ステップ4: Render でデプロイメント**

#### 4-1. Render にサインアップ
- https://render.com
- 「Sign Up」→ GitHub で認証

#### 4-2. Web Service を作成
1. Renderダッシュボード → 「New +」
2. 「Web Service」を選択
3. GitHub を接続
4. `nihongo-match-ondemand` を検索・選択

#### 4-3. デプロイメント設定

| 項目 | 値 |
|------|-----|
| Name | `nihongo-match-backend` |
| Environment | `Node` |
| Region | `Singapore` |
| Branch | `main` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | `Free` |

#### 4-4. 「Create Web Service」クリック

ビルドとデプロイが自動開始。5〜10分待機。

---

### **ステップ5: 環境変数を設定**

Renderダッシュボードで Web Service を開いて：

1. 左メニュー「Environment」をクリック
2. 以下を追加：

```
NODE_ENV          = production
CORS_ORIGIN       = https://robostudy.jp
```

3. 「Save」をクリック → サーバー自動再起動

---

## ✅ デプロイメント成功の確認

### 確認1: Renderのログを見る

Renderダッシュボード → Logs タブで以下が表示されるか確認：

```
✅ SQLiteデータベースに接続しました
✅ evaluationsテーブルが準備されました
🚀 日本語オンデマンドシステム
    サーバー起動成功！
    ポート: (自動割り当て)
    環境: production
```

### 確認2: Render の URL を確認

Renderダッシュボード → Web Service の上部に URL が表示される例：
```
https://nihongo-match-backend.onrender.com
```

### 確認3: API エンドポイントをテスト

ブラウザで以下にアクセス：
```
https://nihongo-match-backend.onrender.com/api/stats
```

以下のような JSON が返ってくることを確認：
```json
{
  "onlineTeachers": 0,
  "activeLessons": 0,
  "waitingStudents": 0
}
```

---

## 🔗 フロントエンドとの接続

### フロントエンドの環境変数設定

フロントエンドプロジェクト（`nihongo-match-ondemand/src` と同階層）の `.env` ファイル：

**ローカル開発用 (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

**本番用 (.env.production)**
```env
REACT_APP_BACKEND_URL=https://nihongo-match-backend.onrender.com
```

### フロントエンド Socket.io 接続設定

React コンポーネント内で Socket.io を初期化する箇所：

```javascript
import io from 'socket.io-client';

// 環境に応じてバックエンド URL を自動選択
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL);
```

---

## 🆘 トラブルシューティング

### ❌ エラー: CORS エラーが出る

```
Access to XMLHttpRequest at 'https://...' from origin 'https://robostudy.jp' 
has been blocked by CORS policy
```

**解決策**:
1. Renderダッシュボード → Environment
2. `CORS_ORIGIN` を再確認：`https://robostudy.jp`（http ではなく https）
3. 値を修正 → 「Save」クリック

---

### ❌ エラー: Socket が接続できない

**症状**: ブラウザコンソール:
```
WebSocket is closed before the connection is established
```

**解決策**:
1. フロントエンドの `.env.production` を確認
2. URL が正しい Render URL か確認
3. 末尾に `/` がないか確認

---

### ❌ エラー: ビルドが失敗する

Renderのログで：
```
ERR! npm ERR! 404  Not Found - GET https://registry.npmjs.org/...
```

**解決策**:
1. ローカルで `npm install` を再実行
2. Git に `package-lock.json` がコミットされているか確認
3. Renderで再度デプロイ（Renderダッシュボード → Manual Deploy）

---

### ⚠️ 注意: データが消える（Render Free プラン）

Render Free プランはコンテナが定期的に再起動されるため、`evaluation.db` などのローカルファイルが失われます。

**将来の対応**:
- MongoDB などクラウドデータベースに移行
- または Render Paid プラン使用

---

## 📊 確認チェックリスト

| 項目 | ✅ |
|------|-----|
| ローカルで `npm start` が成功 | □ |
| `.gitignore` に `.env` が含まれている | □ |
| GitHub にプッシュ完了 | □ |
| Render で Web Service 作成完了 | □ |
| Renderの環境変数設定完了 | □ |
| Render のログに `サーバー起動成功！` が表示 | □ |
| `/api/stats` エンドポイントが動作 | □ |
| フロントエンド環境変数が設定済み | □ |
| Socket.io が接続される | □ |

---

## 📞 次のステップ

✅ **ステップ1: バックエンド Render デプロイメント** ← **今ここ**

⏭️ **ステップ2: フロントエンド デプロイメント**
- robostudy.jp/nihongo が自動的に Render バックエンドと通信

⏭️ **ステップ3: 本番テスト**
- teacher role でオンライン登録
- student role でマッチングリクエスト
- 実際に音声通話テスト

⏭️ **ステップ4: セキュリティ強化**
- 認証機能の実装
- HTTPS 確認
- 入力値検証

---

## 💡 ポイント

- 環境変数は **Git にコミットしない** ✅
- 本番 URL は `http://` ではなく `https://` ✅
- CORS_ORIGIN は フロントエンドのドメイン に合わせる ✅
- Render logs で エラーを常にチェック ✅

