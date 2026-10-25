import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Heart,
  Flame,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Trophy,
  Star,
  Atom,
  Calculator,
  BookOpen,
  Sparkles,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { fetchQuestions, recordStageCompletion } from '../services/dataService';

export default function GameplayArena({
  stage,
  student,
  backendLabel = 'Supabase / SQLite',
  onBackToMap,
  onStageCompleted,
  onOpenLabTool
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [numericInput, setNumericInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [bossHp, setBossHp] = useState(100);
  const [attemptLogs, setAttemptLogs] = useState([]);
  const [stageFinished, setStageFinished] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchQuestions(stage.id)
      .then((data) => {
        if (!mounted) return;
        setQuestions(data || []);
        setLoading(false);
        questionStartRef.current = Date.now();
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [stage.id]);

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = (e) => {
    if (e) e.preventDefault();
    if (!currentQ || feedback) return;

    const rawAnswer =
      currentQ.question_type === 'numeric' ? numericInput.trim() : selectedChoice.trim();
    if (!rawAnswer) return;

    const timeSpentSec = Math.max(
      1,
      Number(((Date.now() - questionStartRef.current) / 1000).toFixed(1))
    );

    let isCorrect = false;
    if (currentQ.question_type === 'numeric') {
      const parsedUser = parseFloat(rawAnswer.replace(/,/g, ''));
      const targetNum =
        currentQ.numeric_answer !== null && currentQ.numeric_answer !== undefined
          ? Number(currentQ.numeric_answer)
          : parseFloat(currentQ.correct_answer);
      if (!Number.isNaN(parsedUser) && !Number.isNaN(targetNum)) {
        isCorrect = Math.abs(parsedUser - targetNum) <= 0.05;
      } else {
        isCorrect = rawAnswer === String(currentQ.correct_answer).trim();
      }
    } else {
      isCorrect = rawAnswer === String(currentQ.correct_answer).trim();
    }

    const basePoints = currentQ.points || 100;
    const hintPenalty = showHint ? 20 : 0;
    const comboBonus = isCorrect ? combo * 15 : 0;
    const earnedPoints = isCorrect ? Math.max(50, basePoints - hintPenalty + comboBonus) : 0;

    if (isCorrect) {
      setScore((prev) => prev + earnedPoints);
      setCombo((prev) => prev + 1);
      const hpDamage = Math.ceil(100 / Math.max(1, questions.length));
      setBossHp((prev) => Math.max(0, prev - hpDamage));
    } else {
      setCombo(0);
      setHearts((prev) => Math.max(0, prev - 1));
    }

    const newLog = {
      question_id: currentQ.id,
      topic: currentQ.topic,
      chemical_formula: currentQ.chemical_formula || '',
      student_answer: rawAnswer,
      is_correct: isCorrect,
      points_earned: earnedPoints,
      time_spent_sec: timeSpentSec,
      used_hint: showHint
    };

    setAttemptLogs((prev) => [...prev, newLog]);
    setFeedback({
      isCorrect,
      earnedPoints,
      userAnswer: rawAnswer,
      correctAnswer: currentQ.correct_answer,
      explanation: currentQ.explanation
    });
  };

  const handleNextQuestion = async () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) {
      setStageFinished(true);
      setSavingResult(true);

      const correctCount = attemptLogs.filter((l) => l.is_correct).length;
      const accuracyPct =
        questions.length > 0 ? Number(((correctCount / questions.length) * 100).toFixed(1)) : 0;
      const stars = accuracyPct >= 80 ? 3 : accuracyPct >= 60 ? 2 : accuracyPct >= 40 ? 1 : 0;

      try {
        await recordStageCompletion({
          student_id: student.id,
          stage_id: stage.id,
          score,
          stars,
          accuracy_pct: accuracyPct,
          logs: attemptLogs
        });
        if (onStageCompleted) await onStageCompleted();
      } catch (err) {
        console.error('Error saving stage result:', err);
      } finally {
        setSavingResult(false);
      }
    } else {
      setCurrentIndex(nextIdx);
      setSelectedChoice('');
      setNumericInput('');
      setShowHint(false);
      setFeedback(null);
      questionStartRef.current = Date.now();
    }
  };

  const handleRestartStage = () => {
    setCurrentIndex(0);
    setSelectedChoice('');
    setNumericInput('');
    setShowHint(false);
    setFeedback(null);
    setScore(0);
    setCombo(0);
    setHearts(3);
    setBossHp(100);
    setAttemptLogs([]);
    setStageFinished(false);
    questionStartRef.current = Date.now();
  };

  if (loading) {
    return (
      <div className="arena-loading">
        <div className="spinner-ring" />
        <p>กำลังเตรียมสารเคมีและโหลดโจทย์ประจำด่าน...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="arena-empty">
        <h3>ยังไม่มีโจทย์ในด่านนี้</h3>
        <button className="primary-btn" onClick={onBackToMap}>
          กลับสู่แผนที่ห้องแล็บ
        </button>
      </div>
    );
  }

  if (stageFinished) {
    const correctCount = attemptLogs.filter((l) => l.is_correct).length;
    const accuracyPct = Number(((correctCount / questions.length) * 100).toFixed(1));
    const stars = accuracyPct >= 80 ? 3 : accuracyPct >= 60 ? 2 : accuracyPct >= 40 ? 1 : 0;

    return (
      <div className="stage-summary-card">
        <div className="summary-badge">
          <Trophy size={48} color="#fbbf24" />
        </div>
        <h2>สรุปภารกิจ: {stage.title}</h2>
        <p className="summary-sub">{stage.subtitle}</p>

        <div className="stars-row">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              size={42}
              fill={s <= stars ? '#fbbf24' : 'transparent'}
              color={s <= stars ? '#fbbf24' : '#475569'}
            />
          ))}
        </div>

        <div className="summary-metrics">
          <div className="metric-box">
            <span>คะแนนที่ทำได้</span>
            <strong className="text-cyan">{score.toLocaleString()} pts</strong>
          </div>
          <div className="metric-box">
            <span>ตอบถูก</span>
            <strong className="text-emerald">
              {correctCount} / {questions.length} ข้อ
            </strong>
          </div>
          <div className="metric-box">
            <span>ความแม่นยำ</span>
            <strong className="text-amber">{accuracyPct}%</strong>
          </div>
        </div>

        <p className="db-saved-status">
          {savingResult
            ? `⏳ กำลังบันทึกผลการทดลองลงฐานข้อมูล (${backendLabel})...`
            : `✅ บันทึกคะแนนและประวัติการทำโจทย์ลงฐานข้อมูล (${backendLabel}) เรียบร้อยแล้ว`}
        </p>

        <div className="summary-actions">
          <button className="secondary-btn" onClick={handleRestartStage}>
            <RotateCcw size={18} /> เล่นด่านนี้อีกครั้ง
          </button>
          <button className="primary-btn" onClick={onBackToMap}>
            กลับสู่แผนที่ห้องแล็บ <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="arena-container">
      {/* Top Battle Bar */}
      <div className="arena-topbar">
        <button className="back-btn" onClick={onBackToMap}>
          <ArrowLeft size={18} /> ออกจากการทดลอง
        </button>

        <div className="arena-stage-info">
          <span className="stage-pill" style={{ backgroundColor: stage.theme_color }}>
            ด่านที่ {stage.id}
          </span>
          <h3>{stage.subtitle}</h3>
        </div>

        <div className="arena-quick-tools">
          <button className="tool-chip" onClick={() => onOpenLabTool('periodic')}>
            <Atom size={16} /> ตารางธาตุ
          </button>
          <button className="tool-chip" onClick={() => onOpenLabTool('calculator')}>
            <Calculator size={16} /> เครื่องคิดเลข
          </button>
          <button className="tool-chip" onClick={() => onOpenLabTool('formulas')}>
            <BookOpen size={16} /> สูตรเคมี
          </button>
        </div>
      </div>

      {/* RPG Status Bar: Player vs Lab Boss */}
      <div className="battle-hud">
        <div className="hud-player">
          <div className="hud-avatar">{student.avatar || '🧑‍🔬'}</div>
          <div className="hud-details">
            <div className="hud-name">
              <strong>{student.name}</strong>
              <span className="hud-class">{student.class_room}</span>
            </div>
            <div className="hud-hearts">
              {[1, 2, 3].map((h) => (
                <Heart
                  key={h}
                  size={20}
                  fill={h <= hearts ? '#ef4444' : 'transparent'}
                  color={h <= hearts ? '#ef4444' : '#475569'}
                />
              ))}
              {combo > 1 && (
                <span className="combo-badge">
                  <Flame size={15} /> Combo x{combo}!
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="hud-score-center">
          <span className="score-label">SCORE</span>
          <strong className="score-value">{score.toLocaleString()}</strong>
          <span className="q-counter">
            ข้อที่ {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="hud-boss">
          <div className="hud-details align-right">
            <div className="hud-name">
              <strong>{stage.boss_name}</strong>
            </div>
            <div className="boss-hp-track">
              <div
                className="boss-hp-fill"
                style={{ width: `${bossHp}%`, backgroundColor: stage.theme_color }}
              />
            </div>
            <span className="boss-hp-text">เกราะป้องกันบอส: {bossHp}%</span>
          </div>
          <div className="hud-avatar boss-avatar">🤖</div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="question-card">
        <div className="q-meta-row">
          <span className="q-topic-badge">🧪 {currentQ.topic}</span>
          <span className="q-diff-badge">
            ระดับความยาก: {'⭐'.repeat(currentQ.difficulty || 1)}
          </span>
          <span className="q-points-badge">+{currentQ.points} คะแนน</span>
        </div>

        <div className="chem-formula-banner">
          <div className="cf-box">
            <span>สารเคมี / ระบบ:</span>
            <strong className="cf-main">{currentQ.chemical_formula || 'General'}</strong>
          </div>
          {currentQ.given_atomic_masses && (
            <div className="cf-masses">
              <span>ข้อมูลที่กำหนดให้:</span>
              <strong>{currentQ.given_atomic_masses}</strong>
            </div>
          )}
        </div>

        <h2 className="q-prompt">{currentQ.question_text}</h2>

        {/* Answer Input Area */}
        <form onSubmit={handleSubmitAnswer} className="q-answer-Section">
          {currentQ.question_type === 'choice' ? (
            <div className="choices-grid">
              {(currentQ.choices || []).map((choice, idx) => {
                const isSelected = selectedChoice === choice;
                let statusClass = '';
                if (feedback) {
                  if (choice === currentQ.correct_answer) statusClass = 'correct-choice';
                  else if (isSelected && !feedback.isCorrect) statusClass = 'wrong-choice';
                }
                return (
                  <button
                    type="button"
                    key={idx}
                    disabled={!!feedback}
                    className={`choice-btn ${isSelected ? 'selected' : ''} ${statusClass}`}
                    onClick={() => setSelectedChoice(choice)}
                  >
                    <span className="choice-letter">{['A', 'B', 'C', 'D'][idx] || idx + 1}</span>
                    <span className="choice-text">{choice}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="numeric-input-wrapper">
              <label>กรอกคำตอบจากการคำนวณ (ตัวเลขหรือทศนิยม):</label>
              <div className="numeric-row">
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={!!feedback}
                  placeholder="เช่น 18, 0.5, 44.8 ..."
                  value={numericInput}
                  onChange={(e) => setNumericInput(e.target.value)}
                  className="numeric-field"
                  autoFocus
                />
                {!feedback && (
                  <button
                    type="submit"
                    className="primary-btn submit-ans-btn"
                    disabled={!numericInput.trim()}
                  >
                    ส่งคำตอบการคำนวณ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Row for Choice Questions & Hint */}
          {!feedback && (
            <div className="q-actions-bar">
              <button
                type="button"
                className="hint-btn"
                onClick={() => setShowHint(true)}
                disabled={showHint}
              >
                <Lightbulb size={18} />
                {showHint ? 'เปิดคำใบ้แล้ว (-20 คะแนนโบนัส)' : 'ขอคำใบ้แนวคิด (-20 คะแนนโบนัส)'}
              </button>

              {currentQ.question_type === 'choice' && (
                <button
                  type="submit"
                  className="primary-btn submit-ans-btn"
                  disabled={!selectedChoice}
                >
                  <Sparkles size={18} /> ยืนยันคำตอบ
                </button>
              )}
            </div>
          )}
        </form>

        {/* Hint Box */}
        {showHint && !feedback && (
          <div className="hint-callout">
            <Lightbulb size={20} color="#fbbf24" />
            <div>
              <strong>คำใบ้จากผู้ช่วยห้องแล็บ:</strong>
              <p>{currentQ.hint}</p>
            </div>
          </div>
        )}

        {/* Step-by-Step Solution & Feedback Box */}
        {feedback && (
          <div className={`feedback-panel ${feedback.isCorrect ? 'is-correct' : 'is-wrong'}`}>
            <div className="fb-header">
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 size={28} color="#10b981" />
                  <div>
                    <h4>ถูกต้องแม่นยำ! โจมตีบอสสำเร็จ (+{feedback.earnedPoints} คะแนน)</h4>
                    <p>คำตอบของคุณ: {feedback.userAnswer}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={28} color="#ef4444" />
                  <div>
                    <h4>คำนวณคลาดเคลื่อน! คำตอบที่ถูกต้องคือ: {feedback.correctAnswer}</h4>
                    <p>คำตอบของคุณ: {feedback.userAnswer}</p>
                  </div>
                </>
              )}
            </div>

            <div className="fb-explanation">
              <strong>📐 เฉลยวิธีทำและแนวคิดทางเคมี:</strong>
              <pre>{feedback.explanation}</pre>
            </div>

            <div className="fb-footer">
              <button className="primary-btn" onClick={handleNextQuestion}>
                {currentIndex + 1 >= questions.length ? 'ดูสรุปผลคะแนนประจำด่าน' : 'ลุยข้อต่อไป'}{' '}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
