import React, { useState, useEffect } from 'react';
import {
  Trophy,
  BarChart3,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  Star,
  Clock,
  Cloud
} from 'lucide-react';
import { fetchAnalyticsData } from '../services/dataService';

export default function TeacherDashboard({
  students,
  backendLabel = 'Supabase / SQLite',
  onRefreshStudents,
  onOpenCloudSetup
}) {
  const [analytics, setAnalytics] = useState({
    topicStats: [],
    stageStats: [],
    recentLogs: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fetchAnalyticsData();
      setAnalytics(
        data || {
          topicStats: [],
          stageStats: [],
          recentLogs: []
        }
      );
      if (onRefreshStudents) await onRefreshStudents();
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportStudentsCSV = () => {
    const headers = [
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ชั้น/ห้อง',
      'เลขที่',
      'ด่านที่ผ่าน',
      'จำนวนดาวรวม',
      'คะแนนรวมทั้งหมด'
    ];
    const rows = students.map((s) => [
      `"${s.student_code || '-'}"`,
      `"${s.name}"`,
      `"${s.class_room}"`,
      s.student_number,
      s.stages_cleared || 0,
      s.total_stars || 0,
      s.total_score || 0
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chemquest_student_scores_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLogsJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      backendEngine: backendLabel,
      students,
      topicStats: analytics.topicStats,
      stageStats: analytics.stageStats,
      recentLogs: analytics.recentLogs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chemquest_research_analytics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>📊 แดชบอร์ดสถิติคะแนนและวิเคราะห์ผลการเรียนรู้ ({backendLabel})</h2>
          <p className="muted-text">
            ติดตามผลสัมฤทธิ์ทางการเรียนรายบุคคลและรายหัวข้อการคำนวณเคมี ม.4 พร้อมส่งออกไฟล์สำหรับงานวิจัย
          </p>
        </div>

        <div className="dashboard-actions">
          {onOpenCloudSetup && (
            <button className="secondary-btn" onClick={onOpenCloudSetup}>
              <Cloud size={16} /> ตั้งค่า Supabase Cloud
            </button>
          )}
          <button className="secondary-btn" onClick={fetchAnalytics}>
            <RefreshCw size={16} /> รีเฟรชข้อมูล
          </button>
          <button className="secondary-btn" onClick={exportStudentsCSV}>
            <Download size={16} /> ส่งออกคะแนน (CSV / Excel)
          </button>
          <button className="primary-btn" onClick={exportLogsJSON}>
            <Download size={16} /> ส่งออกข้อมูลวิจัย (JSON)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <Users size={28} color="#38bdf8" />
          <div>
            <span>จำนวนนักเรียนทั้งหมด</span>
            <strong>{students.length} คน</strong>
          </div>
        </div>
        <div className="kpi-card">
          <Trophy size={28} color="#fbbf24" />
          <div>
            <span>คะแนนสูงสุดในระบบ</span>
            <strong>
              {students.length > 0
                ? Math.max(...students.map((s) => s.total_score || 0)).toLocaleString()
                : 0}{' '}
              pts
            </strong>
          </div>
        </div>
        <div className="kpi-card">
          <BarChart3 size={28} color="#10b981" />
          <div>
            <span>จำนวนครั้งการทำโจทย์สะสม</span>
            <strong>{analytics.recentLogs.length} ครั้ง</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-two-col">
        {/* Leaderboard Table */}
        <div className="dash-card">
          <h3>🏆 อันดับคะแนนนักเรียน (Leaderboard)</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>อันดับ</th>
                  <th>นักเรียน</th>
                  <th>ห้อง / เลขที่</th>
                  <th>ด่านที่ผ่าน</th>
                  <th>ดาวสะสม</th>
                  <th>คะแนนรวม</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st, idx) => (
                  <tr key={st.id}>
                    <td>
                      <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                    </td>
                    <td>
                      <div className="student-cell">
                        <span className="cell-avatar">{st.avatar}</span>
                        <div>
                          <strong>{st.name}</strong>
                          {st.student_code && <small>รหัส: {st.student_code}</small>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {st.class_room} (เลขที่ {st.student_number})
                    </td>
                    <td>{st.stages_cleared || 0} / 5 ด่าน</td>
                    <td>
                      <span className="star-inline">
                        <Star size={14} fill="#fbbf24" color="#fbbf24" /> {st.total_stars || 0}
                      </span>
                    </td>
                    <td>
                      <strong className="text-cyan">{(st.total_score || 0).toLocaleString()}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Topic Accuracy Breakdown */}
        <div className="dash-card">
          <h3>🎯 ความแม่นยำแยกตามทักษะการคำนวณทางเคมี ม.4</h3>
          {loading ? (
            <p className="muted-text">กำลังคำนวณสถิติ...</p>
          ) : analytics.topicStats.length === 0 ? (
            <p className="muted-text">
              ยังไม่มีประวัติการทำโจทย์รายข้อ ลองเข้าเล่นด่านเพื่อสะสมสถิติลงฐานข้อมูล ({backendLabel})
            </p>
          ) : (
            <div className="topic-bars-list">
              {analytics.topicStats.map((t, i) => (
                <div key={i} className="topic-stat-item">
                  <div className="ts-head">
                    <strong>{t.topic}</strong>
                    <span>
                      ถูกต้อง {t.correct_count}/{t.total_attempts} ข้อ ({t.accuracy_rate}%) • เฉลี่ย{' '}
                      {t.avg_time_sec} วินาที/ข้อ
                    </span>
                  </div>
                  <div className="ts-progress-bg">
                    <div
                      className="ts-progress-fill"
                      style={{
                        width: `${Math.min(100, t.accuracy_rate)}%`,
                        backgroundColor:
                          t.accuracy_rate >= 75
                            ? '#10b981'
                            : t.accuracy_rate >= 50
                            ? '#f59e0b'
                            : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: '1.5rem' }}>🧪 ค่าเฉลี่ยคะแนนจำแนกตามด่าน (Stage Analytics)</h3>
          <div className="stage-stats-mini">
            {analytics.stageStats.map((st) => (
              <div key={st.stage_id} className="ss-row">
                <div>
                  <strong>{st.title}</strong>
                  <small>{st.subtitle}</small>
                </div>
                <div className="ss-metrics">
                  <span>ผู้เล่น: {st.students_attempted} คน</span>
                  <span>เฉลี่ย: {st.avg_best_score || 0} pts</span>
                  <span className="text-emerald">แม่นยำ: {st.avg_accuracy || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Attempt Logs */}
      <div className="dash-card" style={{ marginTop: '1.5rem' }}>
        <h3>📝 ประวัติการตอบคำถามรายข้อล่าสุด ({backendLabel})</h3>
        {analytics.recentLogs.length === 0 ? (
          <p className="muted-text">ยังไม่มีรายการบันทึกการทำโจทย์</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>เวลา</th>
                  <th>นักเรียน</th>
                  <th>หัวข้อ</th>
                  <th>สารเคมี</th>
                  <th>คำตอบที่ส่ง</th>
                  <th>ผลลัพธ์</th>
                  <th>เวลาที่ใช้</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentLogs.slice(0, 15).map((log) => (
                  <tr key={log.id}>
                    <td>{log.created_at}</td>
                    <td>
                      {log.student_name} ({log.class_room})
                    </td>
                    <td>{log.topic}</td>
                    <td>
                      <span className="code-badge">{log.chemical_formula || '-'}</span>
                    </td>
                    <td>{log.student_answer}</td>
                    <td>
                      {log.is_correct ? (
                        <span className="status-ok">
                          <CheckCircle size={14} /> ถูกต้อง (+{log.points_earned})
                        </span>
                      ) : (
                        <span className="status-err">
                          <XCircle size={14} /> ผิดพลาด
                        </span>
                      )}
                    </td>
                    <td>
                      <Clock size={13} /> {log.time_spent_sec}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
