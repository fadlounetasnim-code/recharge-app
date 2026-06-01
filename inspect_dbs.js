const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const conversationsDir = 'C:\\Users\\ayoub\\.gemini\\antigravity\\conversations';

function inspectDb(filePath) {
  return new Promise((resolve) => {
    console.log(`Opening DB: ${filePath}`);
    const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error(`  Error opening DB:`, err.message);
        return resolve();
      }
    });

    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
      if (err) {
        console.error(`  Error listing tables:`, err.message);
        db.close();
        return resolve();
      }
      
      const tables = rows.map(r => r.name);
      console.log(`  Tables: ${tables.join(', ')}`);
      
      let pending = tables.length;
      if (pending === 0) {
        db.close();
        return resolve();
      }

      tables.forEach(table => {
        db.get(`SELECT COUNT(*) as cnt FROM "${table}"`, [], (err, row) => {
          if (err) {
            console.error(`    Error counting table ${table}:`, err.message);
          } else {
            console.log(`    Table "${table}": ${row.cnt} rows`);
          }
          pending--;
          if (pending === 0) {
            db.close();
            resolve();
          }
        });
      });
    });
  });
}

async function main() {
  const files = fs.readdirSync(conversationsDir).filter(f => f.endsWith('.db'));
  for (const file of files) {
    const fullPath = path.join(conversationsDir, file);
    await inspectDb(fullPath);
  }
  console.log('Done inspecting databases.');
}

main();
