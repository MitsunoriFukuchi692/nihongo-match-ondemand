# 🚀 Renderデプロイメント完全ガイド

## 📋 目次
1. [Renderアカウント作成](#1-renderアカウント作成)
2. [GitHubリポジトリの準備](#2-githubリポジトリの準備)
3. [Renderでのデプロイメント](#3-renderでのデプロイメント)
4. [環境変数の設定](#4-環境変数の設定)
5. [フロントエンドとの接続](#5-フロントエンドとの接続)

---

## 1. Renderアカウント作成

### ステップ1-1: Renderへアクセス
- https://render.com に訪問
- 「Sign Up」をクリック
- GitHubアカウントで登録（推奨）

### ステップ1-2: GitHubリポジトリの接続
- Render ダッシュボードで「New +」をクリック
- 「Web Service」を選択
- GitHub を接続して、このプロジェクトのリポジトリを選択

---

## 2. GitHubリポジトリの準備

### ステップ2-1: ローカルでGitリポジトリ初期化

```bash
cd C:\Users\mfuku\nihongo-match-ondemand
git init
git add .
git commit -m "Initial commit - backend for nihongo-match-ondemand"
```

### ステップ2-2: .gitignore を作成

プロジェクトルートに `.gitignore` ファイルを作成：

```
node_modules/
.env
.env.local
.env.*.local
*.db
evaluation.db
.DS_Store
```

**重要**: `.env` ファイルは本番環境では `Render の環境変数設定` で管理するため、Gitにコミットしてはいけません。

### ステップ2-3: GitHub にプッシュ

```bash
git remote add origin https://github.com/YOUR_USERNAME/nihongo-match-ondemand.git
git branch -M main
git push -u origin main
```

---

## 3. Renderでのデプロイメント

### ステップ3-1: Renderダッシュボードで新規Webサービス作成

1. Renderダッシュボード → 「New +」
2. 「Web Service」を選択
3. 「GitHub」から接続
4. リポジトリを検索・選択：`nihongo-match-ondemand`

### ステップ3-2: デプロイメント設定

| 項目 | 設定値 |
|------|-------|
| **Name** | `nihongo-match-backend` |
| **Environment** | `Node` |
| **Region** | `Singapore` または `Tokyo` |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` または `Paid` |

### ステップ3-3: 「Create Web Service」をクリック

Renderがビルドとデプロイを開始します。ダッシュボードでログを確認できます。

---

## 4. 環境変数の設定

### ステップ4-1: Renderで環境変数を設定

デプロイメント後、Renderダッシュボードで：

1. Web Service を選択
2. 左メニュー「Environment」をクリック
3. 以下の環境変数を追加：

| キー | 値 | 説明 |
|------|-----|------|
| `NODE_ENV` | `production` | 本番環境を指定 |
| `CORS_ORIGIN` | `https://robostudy.jp` | フロントエンドのURL |
| `PORT` | （自動割り当て） | Renderが自動設定 |

### ステップ4-2: 環境変数を保存

「Save」をクリックして保存。自動的にサーバーが再起動します。

---

## 5. フロントエンドとの接続

### ステップ5-1: Renderサーバーの URL を確認

Renderダッシュボードで Web Service を開き、上部に表示される URL をメモ。例：
```
https://nihongo-match-backend.onrender.com
```

### ステップ5-2: フロントエンド環境変数を更新

フロントエンドプロジェクト（`nihongo-match-ondemand/src`）の環境変数を更新：

**`.env`（ローカル開発）**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

**`.env.production`（本番環境）**
```env
REACT_APP_BACKEND_URL=https://nihongo-match-backend.onrender.com
```

### ステップ5-3: フロントエンドのSocket.io接続を修正

React コンポーネントで Socket.io を接続する箇所を確認：

```javascript
import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL);
```

---

## 🔧 トラブルシューティング

### 問題1: CORS エラーが出る

**原因**: CORS_ORIGIN が正しく設定されていない

**解決策**:
1. Renderダッシュボード → Environment
2. `CORS_ORIGIN` を確認：`https://robostudy.jp`
3. サーバーが再起動されたか確認

### 問題2: Socket.io が接続できない

**原因**: フロントエンドの接続 URL が間違っている

**解決策**:
```javascript
// 正しい例
const socket = io('https://nihongo-match-backend.onrender.com');
```

### 問題3: データベースが消える

**原因**: Render の Free プランではコンテナが定期的に再起動され、ローカルファイルが失われます

**解決策**:
- 将来的には MongoDB などクラウドデータベースに移行を検討
- 現状は評価データなどは Render 上で保持されません

### 問題4: ビルドが失敗する

**原因**: Node.js バージョンが不一致

**解決策**:
1. ローカルで Node.js バージョンを確認：`node --version`
2. `package.json` を確認：`"engines": { "node": "18.x" }`
3. Renderで環境変数 `NODE_VERSION` を明示的に設定

---

## 📝 本番環境チェックリスト

✅ GitHub に `.gitignore` が設定されている
✅ `.env` ファイルが Git にコミットされていない
✅ Render で Web Service が作成されている
✅ 環境変数 `CORS_ORIGIN` が正しく設定されている
✅ フロントエンド環境変数が正しい Render URL を指している
✅ Socket.io が接続できることを確認
✅ API エンドポイントが動作することを確認

---

## 📊 本番環境での確認コマンド

### ステップ1: Renderのサーバーログを確認

```bash
# Renderダッシュボード → Logs タブで確認
```

### ステップ2: API エンドポイントをテスト

```bash
curl -X GET https://nihongo-match-backend.onrender.com/api/stats
```

### ステップ3: フロントエンドからの接続テスト

ブラウザコンソール（DevTools）を開いて、Socket.io が接続されていることを確認：

```
✅ Connected (Socket ID: xxxxx)
```

---

## 📞 次のステップ

1. ✅ バックエンド Render デプロイメント完了
2. ⏭️  フロントエンド（react build）を Render にデプロイ（オプション）
3. ⏭️  データベース永続化を検討（MongoDB など）
4. ⏭️  セキュリティ強化（認証、入力検証など）

