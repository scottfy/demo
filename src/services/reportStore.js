// Local Storage Persistence & Mock Store for AI Procurement Assistant

const STORAGE_KEYS = {
  REPORTS: 'ai_procurement_reports_v1',
  SESSIONS: 'ai_procurement_sessions_v1',
  API_KEY: 'gemini_api_key'
};

// Initial Sample Reports to impress user on first launch
const INITIAL_REPORTS = [
  {
    id: 'report-ergonomic-chairs-2026',
    title: '2026 企業級高階 Ergonomics 辦公椅詢價比價評估報告',
    category: '辦公設備與家具',
    targetItem: '人體工學網椅 (高階調節款)',
    quantity: 50,
    budgetPerUnit: 15000,
    currency: 'TWD',
    createdAt: '2026-08-08T14:30:00Z',
    updatedAt: '2026-08-09T09:15:00Z',
    status: 'completed',
    itemCount: 24,
    recommendedPrice: 12800,
    credibilityScore: 96,
    activeVersionId: 'v2',
    versions: [
      {
        versionId: 'v1',
        versionLabel: 'V1 - 初步市場廣泛調查草案',
        createdAt: '2026-08-08T14:30:00Z',
        htmlContent: generateSampleErgonomicReportHtml('V1')
      },
      {
        versionId: 'v2',
        versionLabel: 'V2 - 規格精準對齊與總成本(TCO)最佳化版',
        createdAt: '2026-08-09T09:15:00Z',
        htmlContent: generateSampleErgonomicReportHtml('V2')
      }
    ]
  },
  {
    id: 'report-ups-system-2026',
    title: '企業資料中心 100kVA 模組化 UPS 不斷電系統採購與風險評估',
    category: 'IT 基礎建設',
    targetItem: '100kVA 三相模組化 UPS 主機與電池櫃',
    quantity: 2,
    budgetPerUnit: 450000,
    currency: 'TWD',
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-06T16:20:00Z',
    status: 'completed',
    itemCount: 20,
    recommendedPrice: 418000,
    credibilityScore: 98,
    activeVersionId: 'v1',
    versions: [
      {
        versionId: 'v1',
        versionLabel: 'V1 - 完工驗收與供應鏈可靠度評估最終版',
        createdAt: '2026-08-06T16:20:00Z',
        htmlContent: generateSampleUpsReportHtml()
      }
    ]
  },
  {
    id: 'report-laptop-fleet-2026',
    title: '研發團隊 AI 算力公務筆電 (Core Ultra / 32GB RAM) 50 台採購案',
    category: '硬體設備',
    targetItem: '16吋 AI 處理器高階商務筆記型電腦',
    quantity: 50,
    budgetPerUnit: 48000,
    currency: 'TWD',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-02T11:45:00Z',
    status: 'completed',
    itemCount: 22,
    recommendedPrice: 43500,
    credibilityScore: 94,
    activeVersionId: 'v1',
    versions: [
      {
        versionId: 'v1',
        versionLabel: 'V1 - 代理商保固與三年維護合約方案',
        createdAt: '2026-08-02T11:45:00Z',
        htmlContent: generateSampleLaptopReportHtml()
      }
    ]
  }
];

export const getStoredApiKey = () => {
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
};

export const setStoredApiKey = (key) => {
  if (key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  }
};

export const getReports = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load reports from localStorage', e);
    return INITIAL_REPORTS;
  }
};

export const saveReport = (report) => {
  const reports = getReports();
  const index = reports.findIndex(r => r.id === report.id);
  let updated;
  if (index >= 0) {
    updated = [...reports];
    updated[index] = { ...report, updatedAt: new Date().toISOString() };
  } else {
    updated = [report, ...reports];
  }
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  return updated;
};

export const deleteReport = (id) => {
  const reports = getReports();
  const updated = reports.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  return updated;
};

export const getReportById = (id) => {
  const reports = getReports();
  return reports.find(r => r.id === id) || null;
};

// Chat Sessions Store
export const getSessions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) {
      const defaultSession = {
        id: 'session-default',
        title: '辦公椅詢價比價採購討論',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg-1',
            sender: 'agent',
            text: '您好！我是您的 **AI 採購比價助手**。\n\n請直接說明您的採購目標（例如：採購品項、數量、單價預算、期望到貨時間），我將為您執行廣泛多平台 (Google, 1688, Amazon, 蝦皮等) 比價搜尋，整理 20~50 項方案，並動態繪製互動式 HTML5 採購報告。',
            timestamp: new Date().toISOString()
          }
        ]
      };
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([defaultSession]));
      return [defaultSession];
    }
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const saveSessions = (sessions) => {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

// Helper: Generates realistic rich HTML reports for samples
function generateSampleErgonomicReportHtml(version = 'V2') {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>2026 企業級高階 Ergonomics 辦公椅詢價比價評估報告</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #ffffff; color: #1e293b; line-height: 1.6; padding: 2.5rem; }
    .report-header { border-bottom: 3px solid #2563eb; padding-bottom: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; }
    .report-title { font-size: 1.875rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .report-subtitle { font-size: 1rem; color: #64748b; margin-top: 0.25rem; font-weight: 500; }
    .badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .badge-primary { background: #dbeafe; color: #1d4ed8; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .grid-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }
    .stat-label { font-size: 0.8125rem; font-weight: 600; color: #64748b; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem; }
    .stat-trend { font-size: 0.75rem; font-weight: 600; color: #16a34a; margin-top: 0.25rem; }
    
    .section-title { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 2rem 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; border-left: 4px solid #2563eb; padding-left: 0.75rem; }
    
    .card-top3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
    .recommend-card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; position: relative; background: #fff; transition: transform 0.2s, box-shadow 0.2s; }
    .recommend-card.rank-1 { border-color: #2563eb; background: linear-gradient(to bottom, #eff6ff, #ffffff); }
    .rank-tag { position: absolute; top: -12px; right: 16px; background: #2563eb; color: #fff; padding: 0.25rem 0.875rem; border-radius: 20px; font-size: 0.75rem; font-weight: 800; }
    .rank-1 .rank-tag { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
    
    .table-container { width: 100%; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
    th { background: #f1f5f9; padding: 0.875rem 1rem; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1; }
    td { padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tr:hover { background: #f8fafc; }
    
    .calc-box { background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; border-radius: 16px; padding: 1.75rem; margin-bottom: 2.5rem; }
    .calc-slider { width: 100%; height: 8px; border-radius: 4px; background: #334155; outline: none; margin: 1rem 0; accent-color: #38bdf8; }
    
    .external-link { color: #2563eb; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; }
    .external-link:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .grid-stats { grid-template-columns: repeat(2, 1fr); }
      .card-top3 { grid-template-columns: 1fr; }
      body { padding: 1rem; }
    }
  </style>
</head>
<body>

  <!-- Report Header -->
  <div class="report-header" id="section-header">
    <div>
      <span class="badge badge-primary"><i class="fa-solid fa-file-contract"></i> 採購比價決策報告 ${version}</span>
      <h1 class="report-title" style="margin-top: 0.5rem;">2026 企業級高階 Ergonomics 辦公椅評估報告</h1>
      <p class="report-subtitle">評估目標：50 台人體工學網椅 | 預算單價上限：TWD $15,000 | 搜尋候選數量：24 件</p>
    </div>
    <div style="text-align: right;">
      <span class="badge badge-success"><i class="fa-solid fa-shield-check"></i> 可信度評分：96/100</span>
      <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem;">查詢時間：2026-08-09 09:15 GMT+8</p>
    </div>
  </div>

  <!-- Key Metrics -->
  <div class="grid-stats" id="section-stats">
    <div class="stat-card">
      <div class="stat-label">市場調查品項數</div>
      <div class="stat-value">24 件</div>
      <div class="stat-trend"><i class="fa-solid fa-circle-check"></i> 涵蓋 1688 / Amazon / 蝦皮</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">建議最優單價</div>
      <div class="stat-value" style="color: #2563eb;">$12,800</div>
      <div class="stat-trend"><i class="fa-solid fa-arrow-down"></i> 低於預算 14.6%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">總採購預估成本 (50台)</div>
      <div class="stat-value" id="tcoDisplay">$640,000</div>
      <div class="stat-trend">含含稅免運與 3 年保固</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">預期節省金額</div>
      <div class="stat-value" style="color: #16a34a;">$110,000</div>
      <div class="stat-trend">對比原定 75 萬總預算</div>
    </div>
  </div>

  <!-- Interactive Budget & TCO Simulator -->
  <div class="calc-box" id="section-calc">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="font-size: 1.125rem; font-weight: 700;"><i class="fa-solid fa-calculator" style="color: #38bdf8;"></i> 動態採購總成本 (TCO) 模擬試算器</h3>
      <span style="font-size: 0.8125rem; color: #94a3b8;">拉動下方滑桿即時連動試算</span>
    </div>
    <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
      <div>
        <label style="font-size: 0.875rem; font-weight: 600;">預計採購數量：<span id="qtyVal" style="color: #38bdf8; font-size: 1.125rem;">50</span> 台</label>
        <input type="range" min="10" max="200" value="50" class="calc-slider" id="qtySlider" oninput="updateTCO()">
      </div>
      <div>
        <label style="font-size: 0.875rem; font-weight: 600;">預估單價目標：<span id="priceVal" style="color: #38bdf8; font-size: 1.125rem;">$12,800</span> TWD</label>
        <input type="range" min="8000" max="20000" step="500" value="12800" class="calc-slider" id="priceSlider" oninput="updateTCO()">
      </div>
    </div>
    <div style="background: rgba(255,255,255,0.08); border-radius: 8px; padding: 1rem; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-size: 0.875rem; color: #cbd5e1;">即時計算採購總費用 (Total Cost of Ownership)：</span>
        <strong id="dynamicTotal" style="font-size: 1.35rem; color: #38bdf8; margin-left: 0.5rem;">NT$ 640,000</strong>
      </div>
      <span style="font-size: 0.75rem; background: rgba(56,189,248,0.2); color: #38bdf8; padding: 0.25rem 0.6rem; border-radius: 4px;">含含稅開立三聯發票及三年到府保固</span>
    </div>
  </div>

  <!-- TOP 3 Recommendations -->
  <h2 class="section-title" id="section-top3"><i class="fa-solid fa-trophy" style="color: #eab308;"></i> 前三名推薦採購方案 (TOP 3)</h2>
  <div class="card-top3">
    <!-- Rank 1 -->
    <div class="recommend-card rank-1">
      <span class="rank-tag">第一推薦 🥇 綜合首選</span>
      <h3 style="font-weight: 700; font-size: 1.125rem; color: #0f172a; margin-top: 0.5rem;">ErgoHuman PRO 2.0 網椅 (企業公務版)</h3>
      <p style="font-size: 0.8125rem; color: #64748b; margin-bottom: 0.75rem;">供應商：聯全傢俱股份有限公司 (直營旗艦)</p>
      <div style="font-size: 1.35rem; font-weight: 800; color: #2563eb; margin-bottom: 0.5rem;">TWD $12,800 <span style="font-size: 0.75rem; color: #64748b; font-weight: 400;">/ 台</span></div>
      <ul style="font-size: 0.8125rem; color: #334155; margin-left: 1rem; margin-bottom: 1rem;">
        <li>進口美式高彈力 Matrex 全網布，耐磨 10萬轉</li>
        <li>獨立可調 3D 腰靠 + 4D 扶手，適合長時間辦公</li>
        <li>量大開立全額含稅三聯發票 + 3 年全椅保固</li>
      </ul>
      <a href="https://example.com/product/ergohuman-pro2" target="_blank" class="external-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> 查看商品規格專屬頁面</a>
    </div>

    <!-- Rank 2 -->
    <div class="recommend-card">
      <span class="rank-tag" style="background: #64748b;">第二推薦 🥈 預算省霸</span>
      <h3 style="font-weight: 700; font-size: 1.125rem; color: #0f172a; margin-top: 0.5rem;">SIHOO 西昊 Doro C300 網椅</h3>
      <p style="font-size: 0.8125rem; color: #64748b; margin-bottom: 0.75rem;">供應商：西昊台灣官方代理 (1688 大宗直發)</p>
      <div style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">TWD $10,500 <span style="font-size: 0.75rem; color: #64748b; font-weight: 400;">/ 台</span></div>
      <ul style="font-size: 0.8125rem; color: #334155; margin-left: 1rem; margin-bottom: 1rem;">
        <li>自適應重力感應底盤，免動手調整後仰力道</li>
        <li>價格優勢極大，符合專案預算充裕節約要求</li>
        <li>交期需要 14 個工作天進口報關到貨</li>
      </ul>
      <a href="https://example.com/product/sihoo-c300" target="_blank" class="external-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> 查看西昊台灣代理頁面</a>
    </div>

    <!-- Rank 3 -->
    <div class="recommend-card">
      <span class="rank-tag" style="background: #b45309;">第三推薦 🥉 頂級奢華選</span>
      <h3 style="font-weight: 700; font-size: 1.125rem; color: #0f172a; margin-top: 0.5rem;">Herman Miller Sayl (基礎款)</h3>
      <p style="font-size: 0.8125rem; color: #64748b; margin-bottom: 0.75rem;">供應商：雅浩家具 (專案 B2B 報價)</p>
      <div style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">TWD $14,800 <span style="font-size: 0.75rem; color: #64748b; font-weight: 400;">/ 台</span></div>
      <ul style="font-size: 0.8125rem; color: #334155; margin-left: 1rem; margin-bottom: 1rem;">
        <li>國際頂級品牌形象，極佳人體工學口碑與支撐</li>
        <li>壓在 15,000 預算上限內，品牌宣傳效果好</li>
        <li>12 年原廠全球保固，風險極低</li>
      </ul>
      <a href="https://example.com/product/hermanmiller-sayl" target="_blank" class="external-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> 查看雅浩專案賣場</a>
    </div>
  </div>

  <!-- Detailed Candidates Table -->
  <h2 class="section-title" id="section-table"><i class="fa-solid fa-list-check" style="color: #2563eb;"></i> 20+ 候選廠商與商品綜合比價清單</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>狀態</th>
          <th>廠商/平台</th>
          <th>商品名稱與規格</th>
          <th>預估單價 (TWD)</th>
          <th>交期與保固</th>
          <th>可信度評分</th>
          <th>評估結論</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-success">通過 (首選)</span></td>
          <td>聯全傢俱 (PCHome B2B)</td>
          <td><strong>ErgoHuman PRO 2.0</strong> (全網布黑色)</td>
          <td style="font-weight: 700; color: #2563eb;">$12,800</td>
          <td>5 天現貨 / 3年保固</td>
          <td>98 分</td>
          <td>規格完全符合，CP值最高</td>
        </tr>
        <tr>
          <td><span class="badge badge-success">通過</span></td>
          <td>西昊官方 (1688 進口)</td>
          <td><strong>SIHOO Doro C300</strong> (灰網款)</td>
          <td>$10,500</td>
          <td>14 天到貨 / 2年保固</td>
          <td>92 分</td>
          <td>成本優勢顯著，適合階段性採購</td>
        </tr>
        <tr>
          <td><span class="badge badge-success">通過</span></td>
          <td>雅浩家具 (直營)</td>
          <td><strong>Herman Miller Sayl</strong></td>
          <td>$14,800</td>
          <td>7 天 / 12年原廠保</td>
          <td>99 分</td>
          <td>品牌頂級，緊貼預算上限</td>
        </tr>
        <tr>
          <td><span class="badge badge-warning">超預算 (遺珠)</span></td>
          <td>Herman Miller 總代理</td>
          <td><strong>Aeron Chair 2.0 (全配版)</strong></td>
          <td style="color: #dc2626;">$32,000</td>
          <td>現貨 / 12年保固</td>
          <td>100 分</td>
          <td>超過預算，作為主管選配備用方案</td>
        </tr>
        <tr>
          <td><span class="badge" style="background:#fee2e2; color:#991b1b;">不通過 (資格不符)</span></td>
          <td>淘寶個體商家 X</td>
          <td>無名人體工學椅 (仿樣款)</td>
          <td>$4,200</td>
          <td>不確定 / 無保固</td>
          <td>35 分</td>
          <td>未提供 SGS 氣壓棒認證，安規風險高</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Statements & Disclaimer -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; font-size: 0.8125rem; color: #64748b;" id="section-disclaimer">
    <h4 style="color: #334155; font-weight: 700; margin-bottom: 0.35rem;"><i class="fa-solid fa-triangle-exclamation" style="color: #eab308;"></i> 聲明與限制說明</h4>
    <p>1. 本採購比價報告由 AI 採購助手於 2026-08-09 09:15 透過 Google Search, 1688, Amazon, PCHome 多源公開管道資料彙整產出。</p>
    <p>2. 以上價格為專案預估詢價參考，實際成交價格依最終與廠商簽訂之採購合約及批量議價為準。</p>
  </div>

  <script>
    function updateTCO() {
      const qty = parseInt(document.getElementById('qtySlider').value);
      const price = parseInt(document.getElementById('priceSlider').value);
      document.getElementById('qtyVal').innerText = qty;
      document.getElementById('priceVal').innerText = '$' + price.toLocaleString();
      const total = qty * price;
      document.getElementById('tcoDisplay').innerText = '$' + total.toLocaleString();
      document.getElementById('dynamicTotal').innerText = 'NT$ ' + total.toLocaleString();
    }
  </script>
</body>
</html>`;
}

function generateSampleUpsReportHtml() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>UPS 比價報告</title>
  <style>body { font-family: sans-serif; padding: 2rem; } h1 { color: #0f172a; }</style>
</head>
<body>
  <h1>企業資料中心 100kVA 模組化 UPS 不斷電系統採購與風險評估</h1>
  <p>評估目標：2 台 100kVA 三相 UPS 主機，建議選用施耐德 (Schneider Electric) 模組化方案，總估算 TWD $836,000。</p>
</body>
</html>`;
}

function generateSampleLaptopReportHtml() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>公務筆電比價報告</title>
  <style>body { font-family: sans-serif; padding: 2rem; } h1 { color: #0f172a; }</style>
</head>
<body>
  <h1>研發團隊 AI 算力公務筆電 (Core Ultra / 32GB RAM) 50 台採購案</h1>
  <p>評估目標：50 台 AI 高階筆電，推薦 ASUS ExpertBook B9 / Lenovo ThinkPad P16s，單價 TWD $43,500。</p>
</body>
</html>`;
}
