# 🧪 ChemQuest ม.4 — เกมตะลุยด่านห้องแล็บการคำนวณทางเคมี (Hybrid Web App & Desktop Edition)

แอปพลิเคชันเกมเพื่อการเรียนรู้วิชาเคมี สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4 เรื่อง **"การคำนวณทางเคมี (ปริมาณสัมพันธ์)"** ที่ออกแบบเป็นระบบ **Hybrid Architecture** รองรับการใช้งานได้ถึง 2 รูปแบบในโปรเจกต์เดียว:

1. 🌐 **Web Application Mode**: รันหน้าบ้านผ่าน **Vercel (Vite + React)** และเชื่อมหลังบ้าน/ฐานข้อมูล Cloud ผ่าน **Supabase (PostgreSQL)** นักเรียนสามารถเข้าเล่นผ่านคอมพิวเตอร์ แท็บเล็ต หรือสมาร์ตโฟนได้ทันที
2. 🖥️ **Desktop Application Mode**: รันบนคอมพิวเตอร์แบบออฟไลน์ด้วย **Electron + Node.js + SQLite** (`database/chem_quest.sqlite`)

---

## 🎯 เป้าหมายการเรียนรู้และด่านการทดลองทั้ง 5 ด่าน

1. **ด่านที่ 1: ห้องแล็บวิเคราะห์มวลโมเลกุล (`molecular_mass`)**
   - การหามวลโมเลกุลหรือมวลสูตรของสารจากผลรวมมวลอะตอมของธาตุองค์ประกอบ
2. **ด่านที่ 2: ห้องปฏิบัติการโมลและมวลของสาร (`mole_mass`)**
   - การคำนวณจำนวนโมล ($n = \frac{g}{M}$) และการหามวลของสารจากโมล ($g = n \times M$)
3. **ด่านที่ 3: ห้องเร่งอนุภาคอาโวกาโดร (`particles`)**
   - การคำนวณจำนวนอนุภาค (อะตอม โมเลกุล ไอออน) โดยใช้เลขอาโวกาโดร ($6.02 \times 10^{23}$)
4. **ด่านที่ 4: หอคอยปริมาตรแก๊สที่ STP (`gas_volume`)**
   - ความสัมพันธ์ระหว่างโมลและปริมาตรแก๊สที่ภาวะมาตรฐาน STP ($1\text{ mol} = 22.4\text{ dm}^3$)
5. **ด่านที่ 5: ห้องทดลองบอสใหญ่ — ปริมาณสัมพันธ์บูรณาการ (`master_synthesis`)**
   - โจทย์เชื่อมโยงหลายขั้นตอนด้วยสูตรหัวใจหลัก:
     $$n = \frac{g}{M} = \frac{N}{6.02 \times 10^{23}} = \frac{V_{\text{STP}}}{22.4}$$

---

## ☁️ คู่มือการติดตั้งและเผยแพร่เป็น Web App (Vercel + Supabase) อย่างละเอียด

### ขั้นตอนที่ 1: ตั้งค่าฐานข้อมูลบน Supabase (ใช้เวลาประมาณ 3 นาที)
1. ไปที่เว็บไซต์ [https://supabase.com](https://supabase.com) และเข้าสู่ระบบ (Sign In ด้วย GitHub ได้เลย)
2. กดปุ่ม **"New project"** ตั้งชื่อโปรเจกต์ เช่น `chemquest-m4` กำหนดรหัสผ่าน Database และเลือก Region (เช่น `Southeast Asia (Singapore)`) แล้วกด **Create new project**
3. เมื่อโปรเจกต์พร้อมแล้ว ให้ไปที่เมนูด้านซ้ายเลือก **"SQL Editor"** -> กด **"New query"**
4. เปิดไฟล์ **`supabase/schema_and_seed.sql`** ในโปรเจกต์นี้ คัดลอกโค้ด SQL ทั้งหมดไปวางในช่อง SQL Editor แล้วกดปุ่ม **"Run"**
   - สคริปต์จะสร้างตารางทั้ง 5 ตาราง (`stages`, `students`, `questions`, `stage_progress`, `attempt_logs`), ตั้งค่าสิทธิ์ RLS และเพิ่มข้อมูลตั้งต้น 5 ด่าน + โจทย์เคมี ม.4 จำนวน 25 ข้อให้อัตโนมัติ
5. ไปที่เมนูด้านซ้าย **"Project Settings"** (รูปฟันเฟือง) -> เลือกเมนู **"API"** แล้วคัดลอกค่า 2 ค่านี้เก็บไว้:
   - **Project URL** (เช่น `https://xxxxxxxxxxxx.supabase.co`)
   - **Project API Keys -> `anon` `public`** (รหัสยาวๆ ที่ขึ้นต้นด้วย `eyJ...`)

---

### ขั้นตอนที่ 2: นำหน้าบ้านขึ้นออนไลน์ผ่าน Vercel
1. ไปที่เว็บไซต์ [https://vercel.com](https://vercel.com) และเข้าสู่ระบบด้วยบัญชี GitHub
2. กดปุ่ม **"Add New..."** -> เลือก **"Project"**
3. เลือก Repository **`Project-Performance-Report-2025`** แล้วกด **"Import"**
4. ในหน้าตั้งค่าก่อนกด Deploy:
   - **Framework Preset**: เลือกเป็น `Vite`
   - เปิดหัวข้อ **"Environment Variables"** แล้วเพิ่มตัวแปร 2 ตัวดังนี้:
     - ชื่อ `VITE_SUPABASE_URL` = วางค่า **Project URL** ที่ได้จาก Supabase
     - ชื่อ `VITE_SUPABASE_ANON_KEY` = วางค่า **anon public key** ที่ได้จาก Supabase
5. กดปุ่ม **"Deploy"** รอประมาณ 1 นาที จะได้ลิงก์เว็บไซต์ (`https://....vercel.app`) สำหรับให้นักเรียนเข้าใช้งานได้ทันที!

> 💡 **ทิปพิเศษ**: แม้ยังไม่ได้ใส่ Environment Variables ตอน Deploy ครั้งแรก ตัวเว็บก็สามารถเปิดเล่นได้ทันทีในโหมดสาธิต (Web Demo Mode) และครูสามารถกดปุ่ม **"ตั้งค่าฐานข้อมูล"** บนแถบเมนูด้านบนของเว็บเพื่อวาง `Supabase URL` และ `Anon Key` จากหน้าเว็บโดยตรงได้เช่นกัน!

---

## 🖥️ วิธีเปิดใช้งานแบบโปรแกรม Desktop (Electron + SQLite)

### วิธีที่ 1: ดับเบิลคลิกไฟล์ Launcher
- ดับเบิลคลิกไฟล์ **`Start-ChemQuest-Desktop.bat`** ในโฟลเดอร์โปรเจกต์เพื่อเปิดแอปพลิเคชันแบบหน้าต่าง Desktop (Electron) ได้ทันที

### วิธีที่ 2: รันผ่านคำสั่ง npm
```bash
# ติดตั้งแพ็กเกจ (ครั้งแรกครั้งเดียว)
npm install

# รันเฉพาะเว็บในเครื่อง (Vite Dev Server)
npm run dev:client

# รันโหมดโปรแกรม Desktop (Build Vite + เปิด Electron + SQLite)
npm start
```

---

## 🗂️ โครงสร้างโปรเจกต์
- `supabase/schema_and_seed.sql` — สคริปต์ SQL สำหรับสร้างตารางและข้อมูลโจทย์เคมี ม.4 ทั้งหมดบน **Supabase PostgreSQL**
- `vercel.json` & `.env.example` — ไฟล์กำหนดค่าสำหรับ Deploy ขึ้น **Vercel**
- `src/services/dataService.js` — ระบบสลับฐานข้อมูลอัตโนมัติ (Hybrid Data Layer) รองรับทั้ง **Supabase Cloud**, **Node.js + SQLite** และ **LocalStorage Fallback**
- `src/components/CloudSetupModal.jsx` — หน้าต่างตั้งค่าการเชื่อมต่อ Supabase และปุ่ม Auto-Seed ข้อมูลขึ้น Cloud จากหน้าเว็บ
- `electron/main.cjs` — โปรเซสหลักของ Electron สำหรับเวอร์ชัน Desktop
- `server/index.cjs` & `server/db.cjs` — เซิร์ฟเวอร์ Node.js + SQLite สำหรับเวอร์ชัน Desktop
