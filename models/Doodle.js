const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize the doodles table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS doodles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    uploader TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    original_path TEXT NOT NULL,
    processed_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT
  )`);
});

class Doodle {
  static create(data) {
    return new Promise((resolve, reject) => {
      const { filename, uploader, originalPath, processedPath, fileSize, mimeType } = data;
      const stmt = db.prepare(`
        INSERT INTO doodles (filename, uploader, original_path, processed_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([filename, uploader, originalPath, processedPath, fileSize, mimeType], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            filename,
            uploader,
            originalPath,
            processedPath,
            fileSize,
            mimeType,
            timestamp: new Date()
          });
        }
      });
      stmt.finalize();
    });
  }

  static findAll() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM doodles ORDER BY timestamp DESC", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM doodles WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static deleteById(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM doodles WHERE id = ?", [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deletedCount: this.changes });
        }
      });
    });
  }
}

module.exports = Doodle;
