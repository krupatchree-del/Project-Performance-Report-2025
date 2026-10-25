export const PERIODIC_ELEMENTS = [
  { z: 1, symbol: 'H', nameTh: 'ไฮโดรเจน', nameEn: 'Hydrogen', mass: 1, group: 'อโลหะ', color: '#38bdf8' },
  { z: 2, symbol: 'He', nameTh: 'ฮีเลียม', nameEn: 'Helium', mass: 4, group: 'แก๊สมีตระกูล', color: '#c084fc' },
  { z: 3, symbol: 'Li', nameTh: 'ลิเทียม', nameEn: 'Lithium', mass: 7, group: 'โลหะแอลคาไล', color: '#f87171' },
  { z: 6, symbol: 'C', nameTh: 'คาร์บอน', nameEn: 'Carbon', mass: 12, group: 'อโลหะ', color: '#38bdf8' },
  { z: 7, symbol: 'N', nameTh: 'ไนโตรเจน', nameEn: 'Nitrogen', mass: 14, group: 'อโลหะ', color: '#38bdf8' },
  { z: 8, symbol: 'O', nameTh: 'ออกซิเจน', nameEn: 'Oxygen', mass: 16, group: 'อโลหะ', color: '#38bdf8' },
  { z: 9, symbol: 'F', nameTh: 'ฟลูออรีน', nameEn: 'Fluorine', mass: 19, group: 'แฮโลเจน', color: '#34d399' },
  { z: 10, symbol: 'Ne', nameTh: 'นีออน', nameEn: 'Neon', mass: 20, group: 'แก๊สมีตระกูล', color: '#c084fc' },
  { z: 11, symbol: 'Na', nameTh: 'โซเดียม', nameEn: 'Sodium', mass: 23, group: 'โลหะแอลคาไล', color: '#f87171' },
  { z: 12, symbol: 'Mg', nameTh: 'แมกนีเซียม', nameEn: 'Magnesium', mass: 24, group: 'แอลคาไลน์เอิร์ท', color: '#fb923c' },
  { z: 13, symbol: 'Al', nameTh: 'อะลูมิเนียม', nameEn: 'Aluminium', mass: 27, group: 'โลหะหลังแทรนซิชัน', color: '#94a3b8' },
  { z: 14, symbol: 'Si', nameTh: 'ซิลิคอน', nameEn: 'Silicon', mass: 28, group: 'กึ่งโลหะ', color: '#fbbf24' },
  { z: 15, symbol: 'P', nameTh: 'ฟอสฟอรัส', nameEn: 'Phosphorus', mass: 31, group: 'อโลหะ', color: '#38bdf8' },
  { z: 16, symbol: 'S', nameTh: 'กำมะถัน (ซัลเฟอร์)', nameEn: 'Sulfur', mass: 32, group: 'อโลหะ', color: '#38bdf8' },
  { z: 17, symbol: 'Cl', nameTh: 'คลอรีน', nameEn: 'Chlorine', mass: 35.5, group: 'แฮโลเจน', color: '#34d399' },
  { z: 18, symbol: 'Ar', nameTh: 'อาร์กอน', nameEn: 'Argon', mass: 40, group: 'แก๊สมีตระกูล', color: '#c084fc' },
  { z: 19, symbol: 'K', nameTh: 'โพแทสเซียม', nameEn: 'Potassium', mass: 39, group: 'โลหะแอลคาไล', color: '#f87171' },
  { z: 20, symbol: 'Ca', nameTh: 'แคลเซียม', nameEn: 'Calcium', mass: 40, group: 'แอลคาไลน์เอิร์ท', color: '#fb923c' },
  { z: 26, symbol: 'Fe', nameTh: 'เหล็ก', nameEn: 'Iron', mass: 56, group: 'โลหะแทรนซิชัน', color: '#facc15' },
  { z: 29, symbol: 'Cu', nameTh: 'ทองแดง', nameEn: 'Copper', mass: 63.5, group: 'โลหะแทรนซิชัน', color: '#facc15' },
  { z: 30, symbol: 'Zn', nameTh: 'สังกะสี', nameEn: 'Zinc', mass: 65, group: 'โลหะแทรนซิชัน', color: '#facc15' },
  { z: 35, symbol: 'Br', nameTh: 'โบรมีน', nameEn: 'Bromine', mass: 80, group: 'แฮโลเจน', color: '#34d399' },
  { z: 47, symbol: 'Ag', nameTh: 'เงิน', nameEn: 'Silver', mass: 108, group: 'โลหะแทรนซิชัน', color: '#facc15' },
  { z: 53, symbol: 'I', nameTh: 'ไอโอดีน', nameEn: 'Iodine', mass: 127, group: 'แฮโลเจน', color: '#34d399' },
  { z: 56, symbol: 'Ba', nameTh: 'แบเรียม', nameEn: 'Barium', mass: 137, group: 'แอลคาไลน์เอิร์ท', color: '#fb923c' }
];

export const CORE_FORMULAS = [
  {
    title: '1. การหามวลโมเลกุล (Molecular Mass: M)',
    formula: 'M = ∑ (จำนวนอะตอม × มวลอะตอมของธาตุ)',
    unit: 'กรัมต่อโมล (g/mol)',
    example: 'เช่น H₂SO₄ = (2×1) + (1×32) + (4×16) = 98 g/mol'
  },
  {
    title: '2. ความสัมพันธ์ระหว่าง โมล (n) กับ มวลของสาร (g)',
    formula: 'n = g / M     หรือ     g = n × M',
    unit: 'n = โมล (mol), g = มวล (กรัม), M = มวลโมเลกุล (g/mol)',
    example: 'เช่น น้ำ (H₂O) 36 กรัม → n = 36 / 18 = 2 โมล'
  },
  {
    title: '3. ความสัมพันธ์ระหว่าง โมล (n) กับ จำนวนอนุภาค (N)',
    formula: 'n = N / (6.02 × 10²³)     หรือ     N = n × 6.02 × 10²³',
    unit: 'N = จำนวนอะตอม / โมเลกุล / ไอออน',
    example: 'เช่น He 2 โมล → N = 2 × 6.02 × 10²³ = 1.204 × 10²⁴ อะตอม'
  },
  {
    title: '4. ความสัมพันธ์ระหว่าง โมล (n) กับ ปริมาตรแก๊สที่ STP (V)',
    formula: 'n = V(dm³) / 22.4     หรือ     V(dm³) = n × 22.4',
    unit: 'ที่ STP (0 °C, 1 atm): แก๊ส 1 โมล = 22.4 dm³ (ลิตร) = 22,400 cm³',
    example: 'เช่น แก๊ส O₂ 0.5 โมล ที่ STP → V = 0.5 × 22.4 = 11.2 dm³'
  },
  {
    title: '5. สูตรหัวใจหลักเชื่อมโยงทุกหน่วย (Master Formula)',
    formula: 'n = g / M = N / (6.02 × 10²³) = V(stp) / 22.4',
    unit: 'ใช้แปลงข้ามหน่วยระหว่าง มวล ↔ โมล ↔ อนุภาค ↔ ปริมาตรแก๊สที่ STP',
    example: 'หาโมล (n) เป็นตัวกลางก่อน แล้วแปลงไปเป็นหน่วยที่โจทย์ถามเสมอ!'
  }
];
