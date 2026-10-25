import React, { useState } from 'react';
import { X, Calculator, BookOpen, Atom, Trash2, Plus } from 'lucide-react';
import { PERIODIC_ELEMENTS, CORE_FORMULAS } from '../data/periodicElements';

export default function LabToolsModal({ isOpen, onClose, initialTab = 'periodic' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedElement, setSelectedElement] = useState(PERIODIC_ELEMENTS[0]);
  const [compoundTray, setCompoundTray] = useState([]);

  // Calculator state
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('0');
  const [calcHistory, setCalcHistory] = useState([]);

  if (!isOpen) return null;

  const addElementToTray = (el) => {
    setSelectedElement(el);
    setCompoundTray((prev) => {
      const existing = prev.find((item) => item.symbol === el.symbol);
      if (existing) {
        return prev.map((item) =>
          item.symbol === el.symbol ? { ...item, count: item.count + 1 } : item
        );
      }
      return [...prev, { ...el, count: 1 }];
    });
  };

  const updateTrayCount = (symbol, delta) => {
    setCompoundTray((prev) =>
      prev
        .map((item) => (item.symbol === symbol ? { ...item, count: item.count + delta } : item))
        .filter((item) => item.count > 0)
    );
  };

  const totalMolecularMass = compoundTray.reduce((sum, item) => sum + item.mass * item.count, 0);

  const handleCalcButton = (val) => {
    if (val === 'C') {
      setCalcExpr('');
      setCalcResult('0');
      return;
    }
    if (val === '=') {
      try {
        const sanitized = calcExpr.replace(/[^0-9+\-*/.() ]/g, '');
        if (!sanitized) return;
        // eslint-disable-next-line no-new-func
        const evaluated = Function(`"use strict"; return (${sanitized})`)();
        const formatted = Number.isFinite(evaluated)
          ? Number(evaluated.toFixed(4)).toString()
          : 'Error';
        setCalcResult(formatted);
        setCalcHistory((h) => [`${calcExpr} = ${formatted}`, ...h.slice(0, 7)]);
      } catch {
        setCalcResult('รูปแบบไม่ถูกต้อง');
      }
      return;
    }
    setCalcExpr((prev) => prev + val);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-tabs">
            <button
              className={`tab-btn ${activeTab === 'periodic' ? 'active' : ''}`}
              onClick={() => setActiveTab('periodic')}
            >
              <Atom size={18} />
              <span>ตารางธาตุ & คำนวณมวลโมเลกุล</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculator')}
            >
              <Calculator size={18} />
              <span>เครื่องคิดเลขทดเลขเคมี</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'formulas' ? 'active' : ''}`}
              onClick={() => setActiveTab('formulas')}
            >
              <BookOpen size={18} />
              <span>คัมภีร์สูตรเคมี ม.4</span>
            </button>
          </div>
          <button className="icon-close-btn" onClick={onClose} title="ปิดหน้าต่าง">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'periodic' && (
            <div className="periodic-layout">
              <div className="periodic-grid-section">
                <p className="helper-note">
                  💡 คลิกที่ธาตุเพื่อดูมวลอะตอม และกดสะสมลงในถาดด้านขวาเพื่อคำนวณมวลโมเลกุลรวมอัตโนมัติ
                </p>
                <div className="elements-grid">
                  {PERIODIC_ELEMENTS.map((el) => (
                    <button
                      key={el.symbol}
                      className={`element-tile ${selectedElement?.symbol === el.symbol ? 'selected' : ''}`}
                      style={{ borderColor: el.color }}
                      onClick={() => addElementToTray(el)}
                    >
                      <span className="el-z">{el.z}</span>
                      <strong className="el-sym" style={{ color: el.color }}>
                        {el.symbol}
                      </strong>
                      <span className="el-name">{el.nameTh}</span>
                      <span className="el-mass">{el.mass}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="periodic-sidebar">
                {selectedElement && (
                  <div className="selected-element-card" style={{ borderColor: selectedElement.color }}>
                    <div className="sec-header">
                      <span className="sec-sym" style={{ color: selectedElement.color }}>
                        {selectedElement.symbol}
                      </span>
                      <div>
                        <h4>
                          {selectedElement.nameTh} ({selectedElement.nameEn})
                        </h4>
                        <span className="badge-tag">{selectedElement.group}</span>
                      </div>
                    </div>
                    <div className="sec-stats">
                      <div>
                        <span>เลขอะตอม (Z):</span>
                        <strong>{selectedElement.z}</strong>
                      </div>
                      <div>
                        <span>มวลอะตอมมาตรฐาน:</span>
                        <strong className="highlight-cyan">{selectedElement.mass} g/mol</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="molecular-tray-card">
                  <div className="tray-header">
                    <h4>🧪 ถาดผสมอะตอมหามวลโมเลกุล</h4>
                    {compoundTray.length > 0 && (
                      <button className="clear-btn" onClick={() => setCompoundTray([])}>
                        <Trash2 size={14} /> ล้างถาด
                      </button>
                    )}
                  </div>

                  {compoundTray.length === 0 ? (
                    <div className="empty-tray">คลิกธาตุจากตารางด้านซ้ายเพื่อเริ่มคำนวณมวลโมเลกุล</div>
                  ) : (
                    <>
                      <div className="tray-formula-preview">
                        สูตรที่กำลังคำนวณ:{' '}
                        <strong>
                          {compoundTray.map((i) => `${i.symbol}${i.count > 1 ? i.count : ''}`).join('')}
                        </strong>
                      </div>
                      <div className="tray-list">
                        {compoundTray.map((item) => (
                          <div key={item.symbol} className="tray-row">
                            <span>
                              <strong>{item.symbol}</strong> ({item.mass}) × {item.count} อะตอม
                            </span>
                            <div className="tray-controls">
                              <button onClick={() => updateTrayCount(item.symbol, -1)}>-</button>
                              <button onClick={() => updateTrayCount(item.symbol, 1)}>+</button>
                              <strong className="row-sum">= {item.mass * item.count}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="tray-total">
                    <span>มวลโมเลกุลรวม (M):</span>
                    <strong>{totalMolecularMass} g/mol</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="calculator-layout">
              <div className="calc-main">
                <div className="calc-screen">
                  <div className="calc-expr">{calcExpr || 'พิมพ์นิพจน์หรือกดปุ่มด้านล่าง...'}</div>
                  <div className="calc-res">= {calcResult}</div>
                </div>

                <div className="calc-quick-chem">
                  <span>ปุ่มลัดค่าคงที่เคมี ม.4:</span>
                  <div className="quick-btns">
                    <button onClick={() => handleCalcButton('*22.4')}>× 22.4 (STP)</button>
                    <button onClick={() => handleCalcButton('/22.4')}>÷ 22.4 (STP)</button>
                    <button onClick={() => handleCalcButton('*6.02')}>× 6.02 (Nₐ)</button>
                    <button onClick={() => handleCalcButton('/6.02')}>÷ 6.02 (Nₐ)</button>
                    <button onClick={() => handleCalcButton('/18')}>÷ 18 (H₂O)</button>
                    <button onClick={() => handleCalcButton('/44')}>÷ 44 (CO₂)</button>
                  </div>
                </div>

                <div className="calc-keypad">
                  {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '(', '+', ')', 'C', '='].map(
                    (key) => (
                      <button
                        key={key}
                        className={`calc-key ${key === '=' ? 'key-equals' : ''} ${key === 'C' ? 'key-clear' : ''}`}
                        onClick={() => handleCalcButton(key)}
                      >
                        {key === '*' ? '×' : key === '/' ? '÷' : key}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="calc-history-panel">
                <h4>📝 ประวัติการทดเลข</h4>
                {calcHistory.length === 0 ? (
                  <p className="muted-text">ยังไม่มีประวัติการกดเครื่องคิดเลข</p>
                ) : (
                  <ul className="history-list">
                    {calcHistory.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="formulas-grid">
              {CORE_FORMULAS.map((f, idx) => (
                <div key={idx} className="formula-card">
                  <h4>{f.title}</h4>
                  <div className="formula-box">{f.formula}</div>
                  <p className="formula-unit">📌 {f.unit}</p>
                  <p className="formula-example">✨ ตัวอย่าง: {f.example}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
