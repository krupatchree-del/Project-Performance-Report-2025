import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_STAGES,
  DEFAULT_QUESTIONS,
  DEFAULT_STUDENTS
} from '../data/defaultSeedData';

const LS_SUPABASE_URL = 'chemquest_supabase_url';
const LS_SUPABASE_KEY = 'chemquest_supabase_anon_key';
const LS_FALLBACK_STUDENTS = 'chemquest_fallback_students';
const LS_FALLBACK_QUESTIONS = 'chemquest_fallback_questions';
const LS_FALLBACK_LOGS = 'chemquest_fallback_logs';

let supabaseClient = null;
let activeBackendMode = 'detecting'; // 'supabase' | 'sqlite' | 'local'
let sqliteAvailableCache = null;

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const savedUrl = typeof window !== 'undefined' ? localStorage.getItem(LS_SUPABASE_URL) || '' : '';
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem(LS_SUPABASE_KEY) || '' : '';

  const url = (savedUrl || envUrl).trim();
  const anonKey = (savedKey || envKey).trim();
  const isConfigured =
    Boolean(url && anonKey) &&
    !url.includes('your-project-id') &&
    !anonKey.includes('your-supabase-anon');

  return {
    url,
    anonKey,
    isConfigured,
    source: savedUrl ? 'custom_ui' : envUrl ? 'env' : 'none'
  };
}

export function initSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    supabaseClient = null;
    return null;
  }
  try {
    supabaseClient = createClient(url, anonKey);
    return supabaseClient;
  } catch (err) {
    console.error('Supabase init error:', err);
    supabaseClient = null;
    return null;
  }
}

export function saveSupabaseCredentials(url, anonKey) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_SUPABASE_URL, (url || '').trim());
  localStorage.setItem(LS_SUPABASE_KEY, (anonKey || '').trim());
  sqliteAvailableCache = null;
  initSupabaseClient();
}

export function clearSupabaseCredentials() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_SUPABASE_URL);
  localStorage.removeItem(LS_SUPABASE_KEY);
  supabaseClient = null;
  sqliteAvailableCache = null;
}

async function checkLocalSqliteServer() {
  if (sqliteAvailableCache !== null) return sqliteAvailableCache;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      sqliteAvailableCache = Boolean(data && data.status === 'ok');
      return sqliteAvailableCache;
    }
  } catch {
    // Ignore when running on Vercel static hosting without local Express server
  }
  sqliteAvailableCache = false;
  return false;
}

export async function resolveBackendMode() {
  const supaCfg = getSupabaseConfig();
  if (supaCfg.isConfigured) {
    if (!supabaseClient) initSupabaseClient();
    if (supabaseClient) {
      activeBackendMode = 'supabase';
      return 'supabase';
    }
  }

  const isDesktopSqlite = await checkLocalSqliteServer();
  if (isDesktopSqlite) {
    activeBackendMode = 'sqlite';
    return 'sqlite';
  }

  activeBackendMode = 'local';
  return 'local';
}

export function getActiveBackendInfo() {
  const supaCfg = getSupabaseConfig();
  const isElectron =
    typeof window !== 'undefined' &&
    Boolean(window.chemApp?.isDesktop || navigator.userAgent.includes('Electron'));

  return {
    mode: activeBackendMode,
    isElectron,
    supabaseUrl: supaCfg.url,
    supabaseConfigured: supaCfg.isConfigured,
    label:
      activeBackendMode === 'supabase'
        ? 'Supabase Cloud (PostgreSQL)'
        : activeBackendMode === 'sqlite'
        ? 'Desktop SQLite (Node.js)'
        : 'Web Demo Mode (LocalStorage)'
  };
}

// ============================================================================
// LocalStorage Fallback Helpers (ใช้งานได้ทันทีแม้ยังไม่ผูก Supabase บน Vercel)
// ============================================================================
function getLocalStudents() {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_STUDENTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  localStorage.setItem(LS_FALLBACK_STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  return DEFAULT_STUDENTS;
}

function saveLocalStudents(list) {
  localStorage.setItem(LS_FALLBACK_STUDENTS, JSON.stringify(list));
}

function getLocalQuestions() {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_QUESTIONS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  localStorage.setItem(LS_FALLBACK_QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
  return DEFAULT_QUESTIONS;
}

function saveLocalQuestions(list) {
  localStorage.setItem(LS_FALLBACK_QUESTIONS, JSON.stringify(list));
}

function getLocalLogs() {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_LOGS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveLocalLogs(list) {
  localStorage.setItem(LS_FALLBACK_LOGS, JSON.stringify(list.slice(0, 300)));
}

// ============================================================================
// Auto-Seed Supabase Database (กรณีเพิ่งสร้างตารางใน Supabase หรือกดปุ่ม Seed)
// ============================================================================
export async function seedSupabaseDatabase() {
  const client = supabaseClient || initSupabaseClient();
  if (!client) {
    throw new Error('ยังไม่ได้ตั้งค่าเชื่อมต่อ Supabase URL และ Anon Key');
  }

  // 1. Upsert 5 Stages
  const { error: stageErr } = await client
    .from('stages')
    .upsert(DEFAULT_STAGES, { onConflict: 'id' });
  if (stageErr) throw stageErr;

  // 2. Check if questions exist; if empty, insert all 25 questions
  const { count: qCount, error: qCheckErr } = await client
    .from('questions')
    .select('*', { count: 'exact', head: true });
  if (qCheckErr) throw qCheckErr;

  if (!qCount || qCount === 0) {
    const questionsPayload = DEFAULT_QUESTIONS.map(({ id, ...rest }) => rest);
    const { error: qInsErr } = await client.from('questions').insert(questionsPayload);
    if (qInsErr) throw qInsErr;
  }

  // 3. Check if students exist; if empty, insert demo students
  const { count: sCount } = await client
    .from('students')
    .select('*', { count: 'exact', head: true });

  if (!sCount || sCount === 0) {
    const { data: insertedStudents } = await client
      .from('students')
      .insert([
        {
          student_code: '6740101',
          name: 'ด.ช. ธนกร นักเคมีรุ่นเยาว์',
          class_room: 'ม.4/1',
          student_number: 1,
          avatar: '🧑‍🔬',
          total_score: 620
        },
        {
          student_code: '6740102',
          name: 'น.ส. พิมพ์ชนก อะตอมอัจฉริยะ',
          class_room: 'ม.4/1',
          student_number: 12,
          avatar: '👩‍🔬',
          total_score: 1150
        }
      ])
      .select();

    if (insertedStudents && insertedStudents.length >= 2) {
      await client.from('stage_progress').insert([
        {
          student_id: insertedStudents[0].id,
          stage_id: 1,
          best_score: 520,
          stars: 3,
          accuracy_pct: 100,
          attempts_count: 1
        },
        {
          student_id: insertedStudents[0].id,
          stage_id: 2,
          best_score: 100,
          stars: 1,
          accuracy_pct: 40,
          attempts_count: 1
        },
        {
          student_id: insertedStudents[1].id,
          stage_id: 1,
          best_score: 590,
          stars: 3,
          accuracy_pct: 100,
          attempts_count: 2
        },
        {
          student_id: insertedStudents[1].id,
          stage_id: 2,
          best_score: 560,
          stars: 3,
          accuracy_pct: 80,
          attempts_count: 1
        }
      ]);
    }
  }

  return { success: true };
}

// ============================================================================
// Unified Data API Functions
// ============================================================================

export async function fetchStages() {
  const mode = await resolveBackendMode();

  if (mode === 'supabase' && supabaseClient) {
    try {
      let { data: stages, error } = await supabaseClient
        .from('stages')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // Auto-seed if Supabase stages table is empty
      if (!stages || stages.length === 0) {
        await seedSupabaseDatabase();
        const retry = await supabaseClient
          .from('stages')
          .select('*')
          .order('id', { ascending: true });
        stages = retry.data || DEFAULT_STAGES;
      }

      const { data: qRows } = await supabaseClient.from('questions').select('id, stage_id');
      return (stages || DEFAULT_STAGES).map((st) => ({
        ...st,
        question_count: qRows
          ? qRows.filter((q) => Number(q.stage_id) === Number(st.id)).length
          : 5
      }));
    } catch (err) {
      console.warn('Supabase fetchStages fallback:', err.message);
    }
  }

  if (mode === 'sqlite') {
    const res = await fetch('/api/stages');
    return await res.json();
  }

  // LocalStorage fallback
  const localQs = getLocalQuestions();
  return DEFAULT_STAGES.map((st) => ({
    ...st,
    question_count: localQs.filter((q) => Number(q.stage_id) === Number(st.id)).length
  }));
}

export async function fetchStudents() {
  const mode = await resolveBackendMode();

  if (mode === 'supabase' && supabaseClient) {
    try {
      const [{ data: students, error: sErr }, { data: progressAll }] = await Promise.all([
        supabaseClient.from('students').select('*'),
        supabaseClient.from('stage_progress').select('*')
      ]);
      if (sErr) throw sErr;

      const progList = progressAll || [];
      const enriched = (students || []).map((st) => {
        const myProg = progList.filter((p) => Number(p.student_id) === Number(st.id));
        const calcScore = myProg.reduce((sum, p) => sum + Number(p.best_score || 0), 0);
        const totalStars = myProg.reduce((sum, p) => sum + Number(p.stars || 0), 0);
        const stagesCleared = myProg.filter((p) => Number(p.stars || 0) > 0).length;
        return {
          ...st,
          total_score: calcScore || st.total_score || 0,
          total_stars: totalStars,
          stages_cleared: stagesCleared,
          progress: myProg
        };
      });

      enriched.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
      return enriched;
    } catch (err) {
      console.warn('Supabase fetchStudents fallback:', err.message);
    }
  }

  if (mode === 'sqlite') {
    const res = await fetch('/api/students');
    return await res.json();
  }

  const list = getLocalStudents();
  return [...list].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
}

export async function createStudent(payload) {
  const mode = await resolveBackendMode();
  const clean = {
    student_code: (payload.student_code || '').trim(),
    name: (payload.name || '').trim(),
    class_room: (payload.class_room || 'ม.4/1').trim(),
    student_number: Number(payload.student_number) || 1,
    avatar: payload.avatar || '🧑‍🔬'
  };

  if (mode === 'supabase' && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('students')
      .insert([{ ...clean, total_score: 0 }])
      .select()
      .single();
    if (error) throw error;
    return { ...data, total_stars: 0, stages_cleared: 0, progress: [] };
  }

  if (mode === 'sqlite') {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean)
    });
    return await res.json();
  }

  const students = getLocalStudents();
  const created = {
    id: Date.now(),
    ...clean,
    total_score: 0,
    total_stars: 0,
    stages_cleared: 0,
    progress: []
  };
  saveLocalStudents([...students, created]);
  return created;
}

export async function fetchQuestions(stageId = null) {
  const mode = await resolveBackendMode();

  if (mode === 'supabase' && supabaseClient) {
    try {
      let query = supabaseClient
        .from('questions')
        .select('*')
        .order('stage_id', { ascending: true })
        .order('difficulty', { ascending: true })
        .order('id', { ascending: true });

      if (stageId && stageId !== 'all') {
        query = query.eq('stage_id', Number(stageId));
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((q) => ({
        ...q,
        choices: Array.isArray(q.choices)
          ? q.choices
          : (() => {
              try {
                return JSON.parse(q.choices || '[]');
              } catch {
                return [];
              }
            })()
      }));
    } catch (err) {
      console.warn('Supabase fetchQuestions fallback:', err.message);
    }
  }

  if (mode === 'sqlite') {
    const url =
      stageId && stageId !== 'all' ? `/api/questions?stage_id=${stageId}` : '/api/questions';
    const res = await fetch(url);
    return await res.json();
  }

  const all = getLocalQuestions();
  if (stageId && stageId !== 'all') {
    return all.filter((q) => Number(q.stage_id) === Number(stageId));
  }
  return all;
}

export async function createQuestion(payload) {
  const mode = await resolveBackendMode();
  const choicesArr = Array.isArray(payload.choices) ? payload.choices : [];

  if (mode === 'supabase' && supabaseClient) {
    const row = {
      stage_id: Number(payload.stage_id) || 1,
      topic: payload.topic || 'การหามวลโมเลกุลของสาร',
      difficulty: Number(payload.difficulty) || 1,
      question_type: payload.question_type || 'choice',
      question_text: payload.question_text,
      chemical_formula: payload.chemical_formula || '',
      given_atomic_masses: payload.given_atomic_masses || '',
      choices: choicesArr,
      correct_answer: String(payload.correct_answer),
      numeric_answer:
        payload.numeric_answer !== null && payload.numeric_answer !== ''
          ? Number(payload.numeric_answer)
          : null,
      hint: payload.hint || '',
      explanation: payload.explanation || '',
      points: Number(payload.points) || 100
    };
    const { data, error } = await supabaseClient.from('questions').insert([row]).select().single();
    if (error) throw error;
    return data;
  }

  if (mode === 'sqlite') {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  const current = getLocalQuestions();
  const created = {
    id: Date.now(),
    stage_id: Number(payload.stage_id) || 1,
    topic: payload.topic,
    difficulty: Number(payload.difficulty) || 1,
    question_type: payload.question_type || 'choice',
    question_text: payload.question_text,
    chemical_formula: payload.chemical_formula || '',
    given_atomic_masses: payload.given_atomic_masses || '',
    choices: choicesArr,
    correct_answer: String(payload.correct_answer),
    numeric_answer:
      payload.numeric_answer !== null && payload.numeric_answer !== ''
        ? Number(payload.numeric_answer)
        : null,
    hint: payload.hint || '',
    explanation: payload.explanation || '',
    points: Number(payload.points) || 100
  };
  saveLocalQuestions([...current, created]);
  return created;
}

export async function deleteQuestionById(id) {
  const mode = await resolveBackendMode();

  if (mode === 'supabase' && supabaseClient) {
    const { error } = await supabaseClient.from('questions').delete().eq('id', Number(id));
    if (error) throw error;
    return { success: true };
  }

  if (mode === 'sqlite') {
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    return await res.json();
  }

  const filtered = getLocalQuestions().filter((q) => Number(q.id) !== Number(id));
  saveLocalQuestions(filtered);
  return { success: true };
}

export async function recordStageCompletion(payload) {
  const mode = await resolveBackendMode();
  const { student_id, stage_id, score, stars, accuracy_pct, logs = [] } = payload;

  if (mode === 'supabase' && supabaseClient) {
    // 1. Insert attempt logs
    if (logs.length > 0) {
      const logRows = logs.map((l) => ({
        student_id: Number(student_id),
        stage_id: Number(stage_id),
        question_id: l.question_id ? Number(l.question_id) : null,
        topic: l.topic || '',
        student_answer: String(l.student_answer ?? ''),
        is_correct: Boolean(l.is_correct),
        points_earned: Number(l.points_earned || 0),
        time_spent_sec: Number(l.time_spent_sec || 0),
        used_hint: Boolean(l.used_hint)
      }));
      await supabaseClient.from('attempt_logs').insert(logRows);
    }

    // 2. Upsert stage_progress
    const { data: existing } = await supabaseClient
      .from('stage_progress')
      .select('*')
      .eq('student_id', Number(student_id))
      .eq('stage_id', Number(stage_id))
      .maybeSingle();

    if (!existing) {
      await supabaseClient.from('stage_progress').insert([
        {
          student_id: Number(student_id),
          stage_id: Number(stage_id),
          best_score: Number(score),
          stars: Number(stars),
          accuracy_pct: Number(accuracy_pct),
          attempts_count: 1
        }
      ]);
    } else {
      await supabaseClient
        .from('stage_progress')
        .update({
          best_score: Math.max(Number(existing.best_score || 0), Number(score)),
          stars: Math.max(Number(existing.stars || 0), Number(stars)),
          accuracy_pct: Math.max(Number(existing.accuracy_pct || 0), Number(accuracy_pct)),
          attempts_count: Number(existing.attempts_count || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    }

    // 3. Recalculate student's total_score
    const { data: allProg } = await supabaseClient
      .from('stage_progress')
      .select('best_score')
      .eq('student_id', Number(student_id));

    const newTotal = (allProg || []).reduce((acc, r) => acc + Number(r.best_score || 0), 0);
    await supabaseClient
      .from('students')
      .update({ total_score: newTotal })
      .eq('id', Number(student_id));

    return { success: true, new_total_score: newTotal };
  }

  if (mode === 'sqlite') {
    const res = await fetch('/api/stage-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  // LocalStorage fallback
  const students = getLocalStudents();
  const targetStudent = students.find((s) => Number(s.id) === Number(student_id));
  if (targetStudent) {
    const progList = targetStudent.progress || [];
    const existingProg = progList.find((p) => Number(p.stage_id) === Number(stage_id));
    if (!existingProg) {
      progList.push({
        student_id: Number(student_id),
        stage_id: Number(stage_id),
        best_score: Number(score),
        stars: Number(stars),
        accuracy_pct: Number(accuracy_pct),
        attempts_count: 1
      });
    } else {
      existingProg.best_score = Math.max(existingProg.best_score || 0, Number(score));
      existingProg.stars = Math.max(existingProg.stars || 0, Number(stars));
      existingProg.accuracy_pct = Math.max(existingProg.accuracy_pct || 0, Number(accuracy_pct));
      existingProg.attempts_count = (existingProg.attempts_count || 1) + 1;
    }
    targetStudent.progress = progList;
    targetStudent.total_score = progList.reduce((sum, p) => sum + (p.best_score || 0), 0);
    targetStudent.total_stars = progList.reduce((sum, p) => sum + (p.stars || 0), 0);
    targetStudent.stages_cleared = progList.filter((p) => (p.stars || 0) > 0).length;
    saveLocalStudents(students);
  }

  const existingLogs = getLocalLogs();
  const newLogs = logs.map((l, idx) => ({
    id: Date.now() + idx,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    student_id: Number(student_id),
    student_name: targetStudent?.name || 'นักเรียน',
    class_room: targetStudent?.class_room || 'ม.4/1',
    stage_id: Number(stage_id),
    question_id: l.question_id,
    topic: l.topic,
    chemical_formula: l.chemical_formula || '',
    student_answer: l.student_answer,
    is_correct: l.is_correct ? 1 : 0,
    points_earned: l.points_earned,
    time_spent_sec: l.time_spent_sec
  }));
  saveLocalLogs([...newLogs, ...existingLogs]);

  return { success: true };
}

export async function fetchAnalyticsData() {
  const mode = await resolveBackendMode();

  if (mode === 'supabase' && supabaseClient) {
    try {
      const [
        { data: logs },
        { data: stages },
        { data: progressAll },
        { data: students },
        { data: questions }
      ] = await Promise.all([
        supabaseClient
          .from('attempt_logs')
          .select('*')
          .order('id', { ascending: false })
          .limit(200),
        supabaseClient.from('stages').select('*').order('id', { ascending: true }),
        supabaseClient.from('stage_progress').select('*'),
        supabaseClient.from('students').select('*'),
        supabaseClient.from('questions').select('id, chemical_formula')
      ]);

      const logList = logs || [];
      const studentMap = new Map((students || []).map((s) => [Number(s.id), s]));
      const questionMap = new Map((questions || []).map((q) => [Number(q.id), q]));

      // Compute topicStats
      const topicGroups = {};
      for (const l of logList) {
        if (!l.topic) continue;
        if (!topicGroups[l.topic]) {
          topicGroups[l.topic] = { total: 0, correct: 0, totalTime: 0 };
        }
        topicGroups[l.topic].total += 1;
        if (l.is_correct) topicGroups[l.topic].correct += 1;
        topicGroups[l.topic].totalTime += Number(l.time_spent_sec || 0);
      }

      const topicStats = Object.entries(topicGroups).map(([topic, g]) => ({
        topic,
        total_attempts: g.total,
        correct_count: g.correct,
        accuracy_rate: Number(((g.correct / g.total) * 100).toFixed(1)),
        avg_time_sec: Number((g.totalTime / g.total).toFixed(1))
      }));
      topicStats.sort((a, b) => b.accuracy_rate - a.accuracy_rate);

      // Compute stageStats
      const progList = progressAll || [];
      const stageStats = (stages || DEFAULT_STAGES).map((st) => {
        const sp = progList.filter((p) => Number(p.stage_id) === Number(st.id));
        const count = sp.length;
        const avgScore =
          count > 0
            ? Math.round(sp.reduce((s, p) => s + Number(p.best_score || 0), 0) / count)
            : 0;
        const avgAcc =
          count > 0
            ? Number(
                (sp.reduce((s, p) => s + Number(p.accuracy_pct || 0), 0) / count).toFixed(1)
              )
            : 0;
        return {
          stage_id: st.id,
          title: st.title,
          subtitle: st.subtitle,
          students_attempted: count,
          avg_best_score: avgScore,
          avg_accuracy: avgAcc
        };
      });

      const recentLogs = logList.map((l) => {
        const st = studentMap.get(Number(l.student_id));
        const q = questionMap.get(Number(l.question_id));
        return {
          ...l,
          created_at: l.created_at
            ? new Date(l.created_at).toLocaleString('th-TH')
            : '-',
          student_name: st?.name || 'นักเรียน',
          class_room: st?.class_room || '-',
          chemical_formula: q?.chemical_formula || '-'
        };
      });

      return { topicStats, stageStats, recentLogs };
    } catch (err) {
      console.warn('Supabase fetchAnalytics fallback:', err.message);
    }
  }

  if (mode === 'sqlite') {
    const res = await fetch('/api/analytics');
    return await res.json();
  }

  // LocalStorage fallback analytics
  const localLogs = getLocalLogs();
  const localStudents = getLocalStudents();
  const topicGroups = {};

  for (const l of localLogs) {
    if (!l.topic) continue;
    if (!topicGroups[l.topic]) {
      topicGroups[l.topic] = { total: 0, correct: 0, totalTime: 0 };
    }
    topicGroups[l.topic].total += 1;
    if (l.is_correct) topicGroups[l.topic].correct += 1;
    topicGroups[l.topic].totalTime += Number(l.time_spent_sec || 0);
  }

  const topicStats = Object.entries(topicGroups).map(([topic, g]) => ({
    topic,
    total_attempts: g.total,
    correct_count: g.correct,
    accuracy_rate: Number(((g.correct / g.total) * 100).toFixed(1)),
    avg_time_sec: Number((g.totalTime / g.total).toFixed(1))
  }));

  const allProgress = localStudents.flatMap((s) => s.progress || []);
  const stageStats = DEFAULT_STAGES.map((st) => {
    const sp = allProgress.filter((p) => Number(p.stage_id) === Number(st.id));
    const count = sp.length;
    return {
      stage_id: st.id,
      title: st.title,
      subtitle: st.subtitle,
      students_attempted: count,
      avg_best_score:
        count > 0 ? Math.round(sp.reduce((s, p) => s + (p.best_score || 0), 0) / count) : 0,
      avg_accuracy:
        count > 0
          ? Number((sp.reduce((s, p) => s + (p.accuracy_pct || 0), 0) / count).toFixed(1))
          : 0
    };
  });

  return {
    topicStats,
    stageStats,
    recentLogs: localLogs
  };
}
