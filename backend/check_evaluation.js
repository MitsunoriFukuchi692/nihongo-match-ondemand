const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'evaluation.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ DB接続エラー:', err);
    process.exit(1);
  }
  console.log('✅ DBに接続しました');
  
  // テーブルの構造を確認
  console.log('\n📋 テーブル情報:');
  db.all("PRAGMA table_info(evaluations);", (err, rows) => {
    if (err) {
      console.error('❌ テーブル情報取得エラー:', err);
    } else {
      rows.forEach(col => {
        console.log(`  - ${col.name}: ${col.type}`);
      });
    }
    
    // 全データを表示
    console.log('\n⭐ 全ての評価データ:');
    db.all("SELECT * FROM evaluations;", (err, rows) => {
      if (err) {
        console.error('❌ データ取得エラー:', err);
      } else {
        console.log(`\n📊 総数: ${rows.length}件\n`);
        rows.forEach((row, index) => {
          console.log(`【評価 ${index + 1}】`);
          console.log(`  ID: ${row.id}`);
          console.log(`  評価者: ${row.evaluatorName} (${row.evaluatorRole})`);
          console.log(`  対象者: ${row.targetName} (${row.targetRole})`);
          console.log(`  評価: ${row.rating}星`);
          console.log(`  コメント: ${row.comment || 'なし'}`);
          console.log(`  タイムスタンプ: ${row.timestamp}`);
          console.log(`  作成日時: ${row.createdAt}\n`);
        });
      }
      
      // 講師別の平均評価を表示
      console.log('📈 講師別の平均評価:');
      db.all(`
        SELECT 
          targetName, 
          COUNT(*) as 件数,
          ROUND(AVG(rating), 2) as 平均評価,
          MIN(rating) as 最低,
          MAX(rating) as 最高
        FROM evaluations 
        WHERE targetRole = 'teacher'
        GROUP BY targetName;
      `, (err, rows) => {
        if (err) {
          console.error('❌ 統計取得エラー:', err);
        } else {
          rows.forEach(row => {
            console.log(`\n${row.targetName}:`);
            console.log(`  件数: ${row.件数}`);
            console.log(`  平均: ${row.平均評価}星`);
            console.log(`  範囲: ${row.最低}～${row.最高}星`);
          });
        }
        
        db.close();
        process.exit(0);
      });
    });
  });
});