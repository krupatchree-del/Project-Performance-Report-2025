import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Map,
  BarChart3,
  Settings,
  Atom,
  Calculator,
  BookOpen,
  UserPlus,
  Star,
  Play,
  Trophy,
  Sparkles,
  CheckCircle2,
  Database
} from 'lucide-react';
import GameplayArena from './components/GameplayArena';
import LabToolsModal from './components/LabToolsModal';
import TeacherDashboard from './components/TeacherDashboard';
import QuestionManager from './components/QuestionManager';

const AVATARS = ['🧑‍🔬', '👩‍🔬', '🧙‍♂️', '🦸‍♀️', '🤖', '🦊', '🐱‍🚀'];

export default function App() {
  const [activeNav, setActiveNav] = useState('map'); // 'map' | 'arena' | 'dashboard' | 'questions'
  const [stages, setStages] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);

  // Lab Tools Modal
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labModalTab, setLabModalTab] = useState('periodic');

  // Student Profile Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    student_code: '',
    name: '',
    class_room: 'ม.4/1',
    student_number: 1,
    avatar: '🧑‍🔬'
  });

  const loadInitialData = async () => {
    try {
      const [stagesRes, studentsRes] = await Promise.all([
        fetch('/api/stages'),
        fetch('/api/students')
      ]);
      const stagesData = await stagesRes.json();
      const studentsData = await studentsRes.json();
      setStages(stagesData || []);
      setStudents(studentsData || []);

      if (studentsData && studentsData.length > 0) {
        setCurrentStudent((prev) => {
          if (!prev) return studentsData[0];
          const updated = studentsData.find((s) => s.id === prev.id);
          return updated || studentsData[0];
        });
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const openLabTool = (tab) => {
    setLabModalTab(tab);
    setLabModalOpen(true);
  };

  const handleStartStage = (stage) => {
    if (!currentStudent) {
      setProfileModalOpen(true);
      return;
    }
    setSelectedStage(stage);
    setActiveNav('arena');
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) return;
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudentForm)
      });
      const created = await res.json();
      if (res.ok) {
        await loadInitialData();
        setCurrentStudent(created);
        setNewStudentForm({
          student_code: '',
          name: '',
          class_room: 'ม.4/1',
          student_number: 1,
          avatar: '🧑‍🔬'
        });
        setProfileModalOpen(false);
      }
    } catch (err) {
      console.error('Error creating student:', err);
    }
  };

  const getStageProgressForStudent = (stageId) => {
    if (!currentStudent || !currentStudent.progress) return null;
    return currentStudent.progress.find((p) => p.stage_id === stageId) || null;
  };

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="top-navbar">
        <div className="brand-area" onClick={() => setActiveNav('map')}>
          <div className="brand-icon">
            <FlaskConical size={26} color="#38bdf8" />
          </div>
          <div>
            <h1>ChemQuest ม.4</h1>
            <span>ปฏิบัติการคำนวณทางเคมี (Mole • Mass • Gas • Particle)</span>
          </div>
        </div>

        <nav className="main-nav">
          <button
            className={`nav-btn ${activeNav === 'map' || activeNav === 'arena' ? 'active' : ''}`}
            onClick={() => setActiveNav('map')}
          >
            <Map size={18} />
            <span>ตะลุยด่านห้องแล็บ</span>
          </button>
          <button
            className={`nav-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveNav('dashboard')}
          >
            <BarChart3 size={18} />
            <span>สถิติ & Leaderboard</span>
          </button>
          <button
            className={`nav-btn ${activeNav === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveNav('questions')}
          >
            <Settings size={18} />
            <span>คลังโจทย์ (ครู)</span>
          </button>
        </nav>

        <div className="toolbar-right">
          <button className="lab-util-btn" onClick={() => openLabTool('periodic')}>
            <Atom size={17} /> ตารางธาตุ
          </button>
          <button className="lab-util-btn" onClick={() => openLabTool('calculator')}>
            <Calculator size={17} /> ทดเลข
          </button>
          <button className="lab-util-btn" onClick={() => openLabTool('formulas')}>
            <BookOpen size={17} /> สูตรเคมี
          </button>

          {currentStudent && (
            <button
              className="student-profile-pill"
              onClick={() => setProfileModalOpen(true)}
              title="คลิกเพื่อสลับหรือเพิ่มโปรไฟล์นักเรียน"
            >
              <span className="sp-avatar">{currentStudent.avatar}</span>
              <div className="sp-info">
                <strong>{currentStudent.name}</strong>
                <small>
                  {currentStudent.class_room} • {(currentStudent.total_score || 0).toLocaleString()} pts
                </small>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeNav === 'map' && (
          <div className="quest-map-view">
            {/* Hero Banner */}
            <div className="hero-banner">
              <div className="hero-left">
                <div className="sqlite-pill">
                  <Database size={14} /> บันทึกผลลงฐานข้อมูล SQLite อัตโนมัติ
                </div>
                <h2>ยินดีต้อนรับสู่ศูนย์วิจัยปริมาณสัมพันธ์ทางเคมี ม.4</h2>
                <p>
                  ฝึกฝนทักษะการคำนวณ <strong>มวลโมเลกุล, โมลกับมวลของสาร, จำนวนอนุภาค และปริมาตรแก๊สที่ STP</strong>{' '}
                  ผ่านภารกิจพิชิตบอสทั้ง 5 ห้องปฏิบัติการ!
                </p>

                <div className="master-formula-strip">
                  <span>⚡ สูตรหัวใจหลัก:</span>
                  <code>n (mol) = g / M = N / (6.02 × 10²³) = V(stp) / 22.4 dm³</code>
                </div>
              </div>

              {currentStudent && (
                <div className="hero-student-card">
                  <div className="hsc-top">
                    <span className="hsc-avatar">{currentStudent.avatar}</span>
                    <div>
                      <span className="hsc-label">นักเคมีประจำห้องแล็บ</span>
                      <h3>{currentStudent.name}</h3>
                      <p>
                        ชั้น {currentStudent.class_room} • เลขที่ {currentStudent.student_number}
                      </p>
                    </div>
                  </div>
                  <div className="hsc-stats">
                    <div>
                      <span>คะแนนสะสม</span>
                      <strong className="text-cyan">
                        {(currentStudent.total_score || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span>ดาวรวม</span>
                      <strong className="text-amber">⭐ {currentStudent.total_stars || 0} / 15</strong>
                    </div>
                    <div>
                      <span>ด่านที่ผ่าน</span>
                      <strong className="text-emerald">{currentStudent.stages_cleared || 0} / 5</strong>
                    </div>
                  </div>
                  <button
                    className="switch-user-btn"
                    onClick={() => setProfileModalOpen(true)}
                  >
                    <UserPlus size={15} /> สลับผู้เล่น / ลงทะเบียนนักเรียนใหม่
                  </button>
                </div>
              )}
            </div>

            {/* 5 Stage Cards Grid */}
            <div className="stages-section-header">
              <h3>🗺️ เลือกห้องปฏิบัติการเพื่อเริ่มทำภารกิจคำนวณเคมี (5 ด่าน)</h3>
              <span>สามารถเลือกฝึกตามหัวข้อที่ต้องการ หรือพิชิตเรียงด่าน 1 ถึง 5</span>
            </div>

            <div className="stages-grid">
              {stages.map((st) => {
                const prog = getStageProgressForStudent(st.id);
                const stars = prog ? prog.stars : 0;
                const bestScore = prog ? prog.best_score : 0;

                return (
                  <div
                    key={st.id}
                    className={`stage-card ${stars > 0 ? 'cleared' : ''}`}
                    style={{ '--stage-color': st.theme_color }}
                  >
                    <div className="sc-header">
                      <span className="sc-badge" style={{ backgroundColor: st.theme_color }}>
                        STAGE {st.id}
                      </span>
                      <div className="sc-stars">
                        {[1, 2, 3].map((idx) => (
                          <Star
                            key={idx}
                            size={18}
                            fill={idx <= stars ? '#fbbf24' : 'transparent'}
                            color={idx <= stars ? '#fbbf24' : '#475569'}
                          />
                        ))}
                      </div>
                    </div>

                    <h3 className="sc-title">{st.title}</h3>
                    <p className="sc-subtitle">{st.subtitle}</p>
                    <p className="sc-desc">{st.description}</p>

                    <div className="sc-formula-box">
                      <span>สูตรประจำด่าน:</span>
                      <code>{st.formula_highlight}</code>
                    </div>

                    <div className="sc-boss-row">
                      <span>🤖 บอสประจำห้องแล็บ:</span>
                      <strong>{st.boss_name}</strong>
                    </div>

                    <div className="sc-footer">
                      <div className="sc-score-info">
                        <span>จำนวน {st.question_count || 5} ข้อ</span>
                        {bestScore > 0 && (
                          <strong className="text-emerald">
                            <CheckCircle2 size={14} /> สถิติสูงสุด: {bestScore} pts
                          </strong>
                        )}
                      </div>

                      <button
                        className="play-stage-btn"
                        style={{ backgroundColor: st.theme_color }}
                        onClick={() => handleStartStage(st)}
                      >
                        <Play size={16} fill="#fff" /> เข้าสู่ห้องแล็บ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeNav === 'arena' && selectedStage && (
          <GameplayArena
            stage={selectedStage}
            student={currentStudent}
            onBackToMap={() => {
              loadInitialData();
              setActiveNav('map');
            }}
            onStageCompleted={loadInitialData}
            onOpenLabTool={openLabTool}
          />
        )}

        {activeNav === 'dashboard' && (
          <TeacherDashboard students={students} onRefreshStudents={loadInitialData} />
        )}

        {activeNav === 'questions' && <QuestionManager stages={stages} />}
      </main>

      {/* Lab Tools Modal (Periodic Table, Calculator, Formulas) */}
      <LabToolsModal
        isOpen={labModalOpen}
        onClose={() => setLabModalOpen(false)}
        initialTab={labModalTab}
      />

      {/* Student Profile Switcher / Registration Modal */}
      {profileModalOpen && (
        <div className="modal-backdrop" onClick={() => setProfileModalOpen(false)}>
          <div className="modal-panel profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👩‍🔬 เลือกโปรไฟล์นักเรียน หรือลงทะเบียนผู้เล่นใหม่ (บันทึกลง SQLite)</h3>
              <button className="icon-close-btn" onClick={() => setProfileModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body profile-modal-grid">
              <div>
                <h4>รายชื่อนักเรียนในระบบ ({students.length} คน)</h4>
                <div className="student-select-list">
                  {students.map((st) => (
                    <div
                      key={st.id}
                      className={`student-select-item ${
                        currentStudent?.id === st.id ? 'active' : ''
                      }`}
                      onClick={() => {
                        setCurrentStudent(st);
                        setProfileModalOpen(false);
                      }}
                    >
                      <span className="ssi-avatar">{st.avatar}</span>
                      <div className="ssi-info">
                        <strong>{st.name}</strong>
                        <small>
                          {st.class_room} (เลขที่ {st.student_number}) • ผ่าน {st.stages_cleared || 0}/5 ด่าน
                        </small>
                      </div>
                      <div className="ssi-score">
                        <Trophy size={14} color="#fbbf24" /> {(st.total_score || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="new-student-box">
                <h4>➕ ลงทะเบียนนักเรียนใหม่</h4>
                <form onSubmit={handleCreateStudent} className="q-form">
                  <div>
                    <label>เลือกไอคอนประจำตัว</label>
                    <div className="avatar-picker">
                      {AVATARS.map((av) => (
                        <button
                          type="button"
                          key={av}
                          className={`avatar-btn ${newStudentForm.avatar === av ? 'selected' : ''}`}
                          onClick={() => setNewStudentForm({ ...newStudentForm, avatar: av })}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label>ชื่อ-นามสกุล นักเรียน *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น นายกิตติภพ รักเคมี"
                      value={newStudentForm.name}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-row-3">
                    <div>
                      <label>รหัสนักเรียน</label>
                      <input
                        type="text"
                        placeholder="เช่น 6740105"
                        value={newStudentForm.student_code}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, student_code: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label>ชั้น/ห้อง</label>
                      <input
                        type="text"
                        placeholder="ม.4/1"
                        value={newStudentForm.class_room}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, class_room: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label>เลขที่</label>
                      <input
                        type="number"
                        min={1}
                        value={newStudentForm.student_number}
                        onChange={(e) =>
                          setNewStudentForm({
                            ...newStudentForm,
                            student_number: Number(e.target.value)
                          })
                        }
                      />
                    </div>
                  </div>

                  <button type="submit" className="primary-btn">
                    <Sparkles size={16} /> บันทึกและเริ่มเล่นด้วยโปรไฟล์นี้
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
