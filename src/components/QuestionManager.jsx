import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, BookOpen, Filter } from 'lucide-react';

export default function QuestionManager({ stages }) {
  const [questions, setQuestions] = useState([]);
  const [filterStage, setFilterStage] = useState('all');
  const [form, setForm] = useState({
    stage_id: 1,
    topic: 'การหามวลโมเลกุลของสาร',
    difficulty: 1,
    question_type: 'choice',
    question_text: '',
    chemical_formula: '',
    given_atomic_masses: '',
    choiceA: '',
    choiceB: '',
    choiceC: '',
    choiceD: '',
    correct_answer: '',
    numeric_answer: '',
    hint: '',
    explanation: '',
    points: 120
  });
  const [message, setMessage] = useState('');

  const loadQuestions = async () => {
    const url =
      filterStage === 'all' ? '/api/questions' : `/api/questions?stage_id=${filterStage}`;
    const res = await fetch(url);
    const data = await res.json();
    setQuestions(data || []);
  };

  useEffect(() => {
    loadQuestions();
  }, [filterStage]);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    const choices =
      form.question_type === 'choice'
        ? [form.choiceA, form.choiceB, form.choiceC, form.choiceD].filter((c) => c.trim() !== '')
        : [];

    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        choices
      })
    });

    if (res.ok) {
      setMessage('✅ เพิ่มโจทย์ใหม่ลงฐานข้อมูล SQLite สำเร็จ!');
      setForm({
        ...form,
        question_text: '',
        chemical_formula: '',
        given_atomic_masses: '',
        choiceA: '',
        choiceB: '',
        choiceC: '',
        choiceD: '',
        correct_answer: '',
        numeric_answer: '',
        hint: '',
        explanation: ''
      });
      loadQuestions();
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    loadQuestions();
  };

  return (
    <div className="qmanager-container">
      <div className="qmanager-grid">
        {/* Left: Add Question Form */}
        <div className="dash-card">
          <h3>
            <PlusCircle size={20} /> เพิ่มโจทย์การคำนวณทางเคมีใหม่ลง SQLite
          </h3>

          {message && <div className="alert-success">{message}</div>}

          <form onSubmit={handleCreateQuestion} className="q-form">
            <div className="form-row-2">
              <div>
                <label>เลือกด่าน (Stage)</label>
                <select
                  value={form.stage_id}
                  onChange={(e) => setForm({ ...form, stage_id: Number(e.target.value) })}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>หัวข้อทักษะการคำนวณ</label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                >
                  <option value="การหามวลโมเลกุลของสาร">การหามวลโมเลกุลของสาร</option>
                  <option value="การหามวลของสารจากโมล">การหามวลของสารจากโมล</option>
                  <option value="การคำนวณโมลจากมวลของสาร">การคำนวณโมลจากมวลของสาร</option>
                  <option value="การคำนวณจำนวนอนุภาค">การคำนวณจำนวนอนุภาค</option>
                  <option value="ปริมาตรของแก๊ส">ปริมาตรของแก๊สที่ STP</option>
                  <option value="บูรณาการการคำนวณเคมี">บูรณาการการคำนวณเคมี</option>
                </select>
              </div>
            </div>

            <div className="form-row-3">
              <div>
                <label>รูปแบบคำถาม</label>
                <select
                  value={form.question_type}
                  onChange={(e) => setForm({ ...form, question_type: e.target.value })}
                >
                  <option value="choice">ปรนัย 4 ตัวเลือก (Multiple Choice)</option>
                  <option value="numeric">เติมคำตอบตัวเลขจากการคำนวณ (Numeric)</option>
                </select>
              </div>
              <div>
                <label>ความยาก (1-3 ดาว)</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
                >
                  <option value={1}>⭐ พื้นฐาน (1 ดาว)</option>
                  <option value={2}>⭐⭐ ปานกลาง (2 ดาว)</option>
                  <option value={3}>⭐⭐⭐ ท้าทาย (3 ดาว)</option>
                </select>
              </div>
              <div>
                <label>คะแนนประจำข้อ</label>
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div>
                <label>สูตรเคมีเด่นประจำข้อ (เช่น H₂SO₄, CO₂)</label>
                <input
                  type="text"
                  placeholder="เช่น CaCO₃"
                  value={form.chemical_formula}
                  onChange={(e) => setForm({ ...form, chemical_formula: e.target.value })}
                />
              </div>
              <div>
                <label>มวลอะตอม/ค่าคงที่ที่กำหนดให้</label>
                <input
                  type="text"
                  placeholder="เช่น Ca = 40, C = 12, O = 16"
                  value={form.given_atomic_masses}
                  onChange={(e) => setForm({ ...form, given_atomic_masses: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label>โจทย์คำถาม *</label>
              <textarea
                rows={2}
                required
                placeholder="ระบุโจทย์การคำนวณทางเคมี..."
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              />
            </div>

            {form.question_type === 'choice' && (
              <div className="form-row-2">
                <input
                  type="text"
                  placeholder="ตัวเลือก A"
                  value={form.choiceA}
                  onChange={(e) => setForm({ ...form, choiceA: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="ตัวเลือก B"
                  value={form.choiceB}
                  onChange={(e) => setForm({ ...form, choiceB: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="ตัวเลือก C"
                  value={form.choiceC}
                  onChange={(e) => setForm({ ...form, choiceC: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="ตัวเลือก D"
                  value={form.choiceD}
                  onChange={(e) => setForm({ ...form, choiceD: e.target.value })}
                />
              </div>
            )}

            <div className="form-row-2">
              <div>
                <label>คำตอบที่ถูกต้อง (ตรงกับตัวเลือก หรือตัวเลข) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 100 g/mol หรือ 44.8"
                  value={form.correct_answer}
                  onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                />
              </div>
              <div>
                <label>ค่าตัวเลขสำหรับตรวจคำตอบทศนิยม (ถ้ามี)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="เช่น 44.8"
                  value={form.numeric_answer}
                  onChange={(e) => setForm({ ...form, numeric_answer: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label>คำใบ้ (Hint)</label>
              <input
                type="text"
                placeholder="แนะแนวสูตรที่ใช้ เช่น ใช้สูตร n = g / M"
                value={form.hint}
                onChange={(e) => setForm({ ...form, hint: e.target.value })}
              />
            </div>

            <div>
              <label>เฉลยวิธีทำละเอียด (แสดงเมื่อนักเรียนตอบเสร็จ)</label>
              <textarea
                rows={2}
                placeholder="แสดงวิธีแทนค่าในสูตรอย่างละเอียด..."
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              />
            </div>

            <button type="submit" className="primary-btn">
              <PlusCircle size={18} /> บันทึกโจทย์ลงฐานข้อมูล SQLite
            </button>
          </form>
        </div>

        {/* Right: Existing Question Bank */}
        <div className="dash-card">
          <div className="qbank-header">
            <h3>
              <BookOpen size={20} /> คลังโจทย์ทั้งหมดในระบบ ({questions.length} ข้อ)
            </h3>
            <div className="filter-box">
              <Filter size={16} />
              <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
                <option value="all">ทุกด่าน (1-5)</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    ด่านที่ {s.id}: {s.subtitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="qbank-list">
            {questions.map((q) => (
              <div key={q.id} className="qbank-item">
                <div className="qb-top">
                  <span className="code-badge">ด่าน {q.stage_id}</span>
                  <span className="q-topic-badge">{q.topic}</span>
                  <span className="muted-text">
                    {q.question_type === 'numeric' ? '🔢 เติมตัวเลข' : '☑️ ตัวเลือก'} • {q.points} pts
                  </span>
                  <button
                    className="del-icon-btn"
                    onClick={() => handleDelete(q.id)}
                    title="ลบโจทย์ข้อนี้"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="qb-question">
                  <strong>{q.chemical_formula ? `[${q.chemical_formula}] ` : ''}</strong>
                  {q.question_text}
                </p>
                <div className="qb-ans">
                  <span>เฉลย: </span>
                  <strong className="text-emerald">{q.correct_answer}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
