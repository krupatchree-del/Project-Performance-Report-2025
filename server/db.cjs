const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const { STAGES, QUESTIONS } = require('./seedData.cjs');

const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'chem_quest.sqlite');
const db = new DatabaseSync(dbPath);

function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_code TEXT,
      name TEXT NOT NULL,
      class_room TEXT NOT NULL DEFAULT 'ม.4/1',
      student_number INTEGER DEFAULT 1,
      avatar TEXT DEFAULT '🧪',
      total_score INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT,
      formula_highlight TEXT,
      boss_name TEXT,
      theme_color TEXT,
      unlock_score INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      difficulty INTEGER DEFAULT 1,
      question_type TEXT DEFAULT 'choice',
      question_text TEXT NOT NULL,
      chemical_formula TEXT,
      given_atomic_masses TEXT,
      choices TEXT DEFAULT '[]',
      correct_answer TEXT NOT NULL,
      numeric_answer REAL,
      hint TEXT,
      explanation TEXT,
      points INTEGER DEFAULT 100,
      FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stage_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      stage_id INTEGER NOT NULL,
      best_score INTEGER DEFAULT 0,
      stars INTEGER DEFAULT 0,
      accuracy_pct REAL DEFAULT 0,
      attempts_count INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, stage_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempt_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      stage_id INTEGER NOT NULL,
      question_id INTEGER,
      topic TEXT,
      student_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      points_earned INTEGER DEFAULT 0,
      time_spent_sec REAL DEFAULT 0,
      used_hint INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  // Seed stages if empty
  const stageCount = db.prepare('SELECT COUNT(*) as count FROM stages').get().count;
  if (stageCount === 0) {
    const insertStage = db.prepare(`
      INSERT INTO stages (id, code, title, subtitle, description, formula_highlight, boss_name, theme_color, unlock_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of STAGES) {
      insertStage.run(
        s.id,
        s.code,
        s.title,
        s.subtitle,
        s.description,
        s.formula_highlight,
        s.boss_name,
        s.theme_color,
        s.unlock_score
      );
    }
  }

  // Seed questions if empty
  const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
  if (questionCount === 0) {
    const insertQ = db.prepare(`
      INSERT INTO questions (
        stage_id, topic, difficulty, question_type, question_text,
        chemical_formula, given_atomic_masses, choices, correct_answer,
        numeric_answer, hint, explanation, points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const q of QUESTIONS) {
      insertQ.run(
        q.stage_id,
        q.topic,
        q.difficulty,
        q.question_type,
        q.question_text,
        q.chemical_formula,
        q.given_atomic_masses,
        q.choices,
        q.correct_answer,
        q.numeric_answer,
        q.hint,
        q.explanation,
        q.points
      );
    }
  }

  // Seed sample student profiles if empty
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  if (studentCount === 0) {
    const insertStudent = db.prepare(`
      INSERT INTO students (student_code, name, class_room, student_number, avatar, total_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStudent.run('6740101', 'ด.ช. ธนกร นักเคมีรุ่นเยาว์', 'ม.4/1', 1, '🧑‍🔬', 620);
    insertStudent.run('6740102', 'น.ส. พิมพ์ชนก อะตอมอัจฉริยะ', 'ม.4/1', 12, '👩‍🔬', 1150);

    // Seed initial progress for demo students
    const insertProg = db.prepare(`
      INSERT INTO stage_progress (student_id, stage_id, best_score, stars, accuracy_pct, attempts_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertProg.run(1, 1, 520, 3, 100, 1);
    insertProg.run(1, 2, 100, 1, 40, 1);
    insertProg.run(2, 1, 590, 3, 100, 2);
    insertProg.run(2, 2, 560, 3, 80, 1);
  }
}

initDatabase();

module.exports = { db, dbPath };
