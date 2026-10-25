const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { db, dbPath } = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Node.js + SQLite (node:sqlite)',
    databasePath: dbPath,
    timestamp: new Date().toISOString()
  });
});

// 2. Get all students + their progress
app.get('/api/students', (req, res) => {
  try {
    const students = db.prepare(`
      SELECT s.*,
        COALESCE((SELECT SUM(best_score) FROM stage_progress sp WHERE sp.student_id = s.id), s.total_score) AS calculated_score,
        COALESCE((SELECT SUM(stars) FROM stage_progress sp WHERE sp.student_id = s.id), 0) AS total_stars,
        COALESCE((SELECT COUNT(*) FROM stage_progress sp WHERE sp.student_id = s.id AND sp.stars > 0), 0) AS stages_cleared
      FROM students s
      ORDER BY calculated_score DESC, s.id ASC
    `).all();

    const progressAll = db.prepare(`SELECT * FROM stage_progress`).all();
    const result = students.map((st) => ({
      ...st,
      total_score: st.calculated_score || st.total_score || 0,
      progress: progressAll.filter((p) => p.student_id === st.id)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create new student profile
app.post('/api/students', (req, res) => {
  try {
    const { student_code = '', name, class_room = 'ม.4/1', student_number = 1, avatar = '🧑‍🔬' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุชื่อ-นามสกุลนักเรียน' });
    }
    const stmt = db.prepare(`
      INSERT INTO students (student_code, name, class_room, student_number, avatar, total_score)
      VALUES (?, ?, ?, ?, ?, 0)
    `);
    const info = stmt.run(student_code.trim(), name.trim(), class_room.trim(), Number(student_number) || 1, avatar);
    const created = db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid);
    res.json({ ...created, total_stars: 0, stages_cleared: 0, progress: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete student profile
app.delete('/api/students/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM students WHERE id = ?').run(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get stages with question counts
app.get('/api/stages', (req, res) => {
  try {
    const stages = db.prepare(`
      SELECT st.*,
        (SELECT COUNT(*) FROM questions q WHERE q.stage_id = st.id) AS question_count
      FROM stages st
      ORDER BY st.id ASC
    `).all();
    res.json(stages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get questions (all or by stage_id)
app.get('/api/questions', (req, res) => {
  try {
    const { stage_id } = req.query;
    let rows;
    if (stage_id) {
      rows = db.prepare('SELECT * FROM questions WHERE stage_id = ? ORDER BY difficulty ASC, id ASC').all(Number(stage_id));
    } else {
      rows = db.prepare('SELECT * FROM questions ORDER BY stage_id ASC, difficulty ASC, id ASC').all();
    }
    const parsed = rows.map((q) => ({
      ...q,
      choices: (() => {
        try {
          return JSON.parse(q.choices || '[]');
        } catch {
          return [];
        }
      })()
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Create a new question (Teacher CRUD)
app.post('/api/questions', (req, res) => {
  try {
    const {
      stage_id = 1,
      topic = 'การหามวลโมเลกุลของสาร',
      difficulty = 1,
      question_type = 'choice',
      question_text,
      chemical_formula = '',
      given_atomic_masses = '',
      choices = [],
      correct_answer,
      numeric_answer = null,
      hint = '',
      explanation = '',
      points = 100
    } = req.body;

    if (!question_text || !correct_answer) {
      return res.status(400).json({ error: 'กรุณากรอกโจทย์และคำตอบที่ถูกต้อง' });
    }

    const stmt = db.prepare(`
      INSERT INTO questions (
        stage_id, topic, difficulty, question_type, question_text,
        chemical_formula, given_atomic_masses, choices, correct_answer,
        numeric_answer, hint, explanation, points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      Number(stage_id),
      topic,
      Number(difficulty),
      question_type,
      question_text,
      chemical_formula,
      given_atomic_masses,
      JSON.stringify(Array.isArray(choices) ? choices : []),
      String(correct_answer),
      numeric_answer !== null && numeric_answer !== '' ? Number(numeric_answer) : null,
      hint,
      explanation,
      Number(points) || 100
    );

    const created = db.prepare('SELECT * FROM questions WHERE id = ?').get(info.lastInsertRowid);
    res.json({
      ...created,
      choices: JSON.parse(created.choices || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete a question
app.delete('/api/questions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM questions WHERE id = ?').run(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Record Stage Completion & Attempt Logs
app.post('/api/stage-complete', (req, res) => {
  try {
    const {
      student_id,
      stage_id,
      score,
      stars,
      accuracy_pct,
      logs = []
    } = req.body;

    if (!student_id || !stage_id) {
      return res.status(400).json({ error: 'ต้องระบุ student_id และ stage_id' });
    }

    // Insert individual question attempt logs
    const insertLog = db.prepare(`
      INSERT INTO attempt_logs (
        student_id, stage_id, question_id, topic,
        student_answer, is_correct, points_earned, time_spent_sec, used_hint
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const log of logs) {
      insertLog.run(
        Number(student_id),
        Number(stage_id),
        log.question_id || null,
        log.topic || '',
        String(log.student_answer ?? ''),
        log.is_correct ? 1 : 0,
        Number(log.points_earned || 0),
        Number(log.time_spent_sec || 0),
        log.used_hint ? 1 : 0
      );
    }

    // Upsert stage_progress
    const existing = db.prepare(
      'SELECT * FROM stage_progress WHERE student_id = ? AND stage_id = ?'
    ).get(Number(student_id), Number(stage_id));

    if (!existing) {
      db.prepare(`
        INSERT INTO stage_progress (student_id, stage_id, best_score, stars, accuracy_pct, attempts_count, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(Number(student_id), Number(stage_id), Number(score), Number(stars), Number(accuracy_pct));
    } else {
      const newBestScore = Math.max(existing.best_score, Number(score));
      const newBestStars = Math.max(existing.stars, Number(stars));
      const newBestAcc = Math.max(existing.accuracy_pct, Number(accuracy_pct));
      db.prepare(`
        UPDATE stage_progress
        SET best_score = ?, stars = ?, accuracy_pct = ?, attempts_count = attempts_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newBestScore, newBestStars, newBestAcc, existing.id);
    }

    // Update student's total_score
    const totalRow = db.prepare(
      'SELECT COALESCE(SUM(best_score), 0) AS total FROM stage_progress WHERE student_id = ?'
    ).get(Number(student_id));

    db.prepare('UPDATE students SET total_score = ? WHERE id = ?').run(totalRow.total, Number(student_id));

    res.json({
      success: true,
      new_total_score: totalRow.total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Get Analytics & Research Dashboard Data
app.get('/api/analytics', (req, res) => {
  try {
    const topicStats = db.prepare(`
      SELECT
        topic,
        COUNT(*) AS total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_count,
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END), 1) AS accuracy_rate,
        ROUND(AVG(time_spent_sec), 1) AS avg_time_sec
      FROM attempt_logs
      WHERE topic IS NOT NULL AND topic != ''
      GROUP BY topic
      ORDER BY accuracy_rate DESC
    `).all();

    const stageStats = db.prepare(`
      SELECT
        st.id AS stage_id,
        st.title,
        st.subtitle,
        COUNT(sp.id) AS students_attempted,
        ROUND(AVG(sp.best_score), 0) AS avg_best_score,
        ROUND(AVG(sp.accuracy_pct), 1) AS avg_accuracy
      FROM stages st
      LEFT JOIN stage_progress sp ON sp.stage_id = st.id
      GROUP BY st.id
      ORDER BY st.id ASC
    `).all();

    const recentLogs = db.prepare(`
      SELECT
        al.*,
        s.name AS student_name,
        s.class_room,
        s.student_number,
        q.chemical_formula
      FROM attempt_logs al
      LEFT JOIN students s ON s.id = al.student_id
      LEFT JOIN questions q ON q.id = al.question_id
      ORDER BY al.id DESC
      LIMIT 200
    `).all();

    res.json({
      topicStats,
      stageStats,
      recentLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend in production mode
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distDir, 'index.html'));
    }
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[ChemQuest Backend] Server running at http://localhost:${PORT}`);
    console.log(`[ChemQuest SQLite] Database file: ${dbPath}`);
  });
}

module.exports = { app, PORT };
