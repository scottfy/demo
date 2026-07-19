/**
 * AI News Writing Assistant (AI 輔助新聞採編 Agent)
 * Native Vanilla JavaScript Core Logic - Bulletproof Universal Article Parser & Sync Engine
 */

(function () {
  'use strict';

  // --- Initial Default State ---
  const INITIAL_ARTICLE = {
    mainTitle: '突破性 Quantum-AI 晶片問世：運算效能提升 100 倍，掀起下一世代新聞採編革命',
    subTitle: '全球科研團隊發表最新光子邏輯架構，將重塑數位媒體生產流程與深度報導分析速度。',
    body: `
<p>在人工智慧發展史上的重要里程碑中，全球頂尖聯合實驗室今日正式發表全新「Quantum-AI」晶片。該架構採用突破性的光子邏輯傳輸機制，能將大規模語言模型 (LLM) 的運算推論延遲降低至原本的百分之一，同時降低 85% 的能源消耗。</p>

<h3>打破算力瓶頸：新聞與數位內容產業首當其衝</h3>
<p>這項突破不僅意味著超級電腦與資料中心效能的極限擴充，更將重塑內容創作與現代新聞採編模式。新聞編輯室現在能透過即時多模態分析，在秒級時間內梳理數萬筆現場數據、影音資料與國際通訊社電報，為記者提供極具洞察力的背景整理與事實查核提示。</p>

<blockquote>「我們不再只是對語言進行機率預測，而是讓晶片在硬體層級模擬類神經邏輯流動，這將徹底改寫人機協作寫作的邊界。」—— 首席架構師受訪表示。</blockquote>

<p>展望未來，科技界普遍預測該晶片將於 2027 年正式進入數據中心量產階段。屆時，智慧輔助工具將不再只是文字處理器，而是能深層輔助事實查核、觀點多角度剖析與國際情勢交叉比對的數位智囊。</p>
    `.trim()
  };

  const INITIAL_CHAT = [
    {
      id: 'msg-1',
      role: 'ai',
      content: `👋 您好！我是您的 **AI 新聞採編助手 (AI Newsroom Co-Pilot)**。\n\n您可以與我討論報導主題、風格調整與大綱發想。若需要直接產出報導，我可以為您生成**大標題、副標題與內文**，並一鍵同步至右側文章編輯視窗！\n\n請問今天打算撰寫什麼主題的新聞報導呢？`,
      articleData: null
    }
  ];

  // --- State Variables ---
  let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    toneStyle: '客觀中立報導',
    currentTopic: '',
    chatHistory: [...INITIAL_CHAT],
    article: { ...INITIAL_ARTICLE },
    isGenerating: false
  };

  // --- DOM Elements ---
  const toneSelector = document.getElementById('toneSelector');
  const apiKeyBtn = document.getElementById('apiKeyBtn');
  const apiKeyStatusText = document.getElementById('apiKeyStatusText');
  const apiKeyModal = document.getElementById('apiKeyModal');
  const modalApiKeyInput = document.getElementById('modalApiKeyInput');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');

  const chatMessagesEl = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');

  const articleMainTitle = document.getElementById('articleMainTitle');
  const articleSubTitle = document.getElementById('articleSubTitle');
  const articleBody = document.getElementById('articleBody');
  const wordCountDisplay = document.getElementById('wordCountDisplay');
  const readTimeDisplay = document.getElementById('readTimeDisplay');

  const copyArticleBtn = document.getElementById('copyArticleBtn');
  const exportMdBtn = document.getElementById('exportMdBtn');
  const resetArticleBtn = document.getElementById('resetArticleBtn');
  const toastContainer = document.getElementById('toastContainer');

  // --- Toast Notification Utility ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-info text-cyan-400';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --- Update API Key Status Display ---
  function updateApiKeyStatusUI() {
    if (state.apiKey) {
      apiKeyStatusText.innerText = 'Key 已設定 (Gemini AI)';
      apiKeyBtn.style.borderColor = 'rgba(52, 211, 153, 0.4)';
      apiKeyBtn.style.color = '#34d399';
    } else {
      apiKeyStatusText.innerText = '設定 API Key (Mock 模式)';
      apiKeyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      apiKeyBtn.style.color = '#94a3b8';
    }
  }

  // --- Article Statistics Calculator ---
  function updateArticleStats() {
    const plainText = articleBody.innerText || '';
    const wordCount = plainText.trim().replace(/\s+/g, '').length;
    const readTime = Math.max(1, Math.ceil(wordCount / 400));

    wordCountDisplay.innerHTML = `<i class="fa-solid fa-font" style="color: #06b6d4;"></i> ${wordCount} 字`;
    readTimeDisplay.innerHTML = `<i class="fa-solid fa-clock" style="color: #8b5cf6;"></i> 約 ${readTime} 分鐘閱讀`;
  }

  // --- Render Chat Messages ---
  function renderChatMessages() {
    chatMessagesEl.innerHTML = '';

    state.chatHistory.forEach((msg) => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chat-message ${msg.role}`;

      const avatar = document.createElement('div');
      avatar.className = `avatar ${msg.role === 'ai' ? 'avatar-ai' : 'avatar-user'}`;
      avatar.innerHTML = msg.role === 'ai' ? '<i class="fa-solid fa-sparkles"></i>' : '<i class="fa-solid fa-user"></i>';

      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      
      // Clean display text for AI bubble
      let cleanContent = msg.content;
      if (msg.role === 'ai') {
        cleanContent = cleanContent
          .replace(/\[大標題\]|【大標題】/g, '**[大標題]** ')
          .replace(/\[副標題\]|【副標題】/g, '\n**[副標題]** ')
          .replace(/\[內文摘要\]|【內文摘要】|\[內文\]|【內文】/g, '\n**[內文摘要]**\n');
      }

      let formattedText = cleanContent
        .replace(/\n/g, '<br/>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      bubble.innerHTML = `<div>${formattedText}</div>`;

      // Render interactive sync button for AI messages containing article data
      if (msg.role === 'ai' && msg.articleData) {
        const syncBox = document.createElement('div');
        syncBox.className = 'sync-badge-btn';
        syncBox.innerHTML = `
          <span style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;">
            <i class="fa-solid fa-circle-check" style="color: #34d399;"></i> 新聞報導已生成
          </span>
          <button class="btn btn-primary btn-sm apply-sync-btn" style="padding: 0.3rem 0.75rem; font-size: 0.75rem; font-weight: 700; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #fff;">
            <i class="fa-solid fa-arrow-right"></i> 同步至右側視窗
          </button>
        `;
        syncBox.querySelector('.apply-sync-btn').addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          applyArticleDataToRightView(msg.articleData);
          showToast('✅ 已成功將新聞大標題、副標題與內文同步至右側視窗！', 'success');
        });
        bubble.appendChild(syncBox);
      }

      messageDiv.appendChild(avatar);
      messageDiv.appendChild(bubble);
      chatMessagesEl.appendChild(messageDiv);
    });

    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  // --- Universal Bulletproof AI Response Parser ---
  function parseArticleFromText(text) {
    if (!text || text.trim().length === 0) return null;

    let mainTitle = '';
    let subTitle = '';
    let body = '';

    // Match explicit tags: [大標題], 【大標題】, 大標題:
    const titleMatch = text.match(/(?:\[大標題\]|【大標題】|\*\*\[?大標題\]?\*\*|大標題[:：])\s*(.*?)(?=\n|\[|【|\*\*|$)/i);
    if (titleMatch && titleMatch[1].trim()) {
      mainTitle = titleMatch[1].trim();
    }

    const subTitleMatch = text.match(/(?:\[副標題\]|【副標題】|\*\*\[?副標題\]?\*\*|副標題[:：])\s*(.*?)(?=\n|\[|【|\*\*|$)/i);
    if (subTitleMatch && subTitleMatch[1].trim()) {
      subTitle = subTitleMatch[1].trim();
    }

    const bodyMatch = text.match(/(?:\[內文摘要\]|【內文摘要】|\[內文\]|【內文】|\*\*\[?內文摘要\]?\*\*|\*\*\[?內文\]?\*\*|內文[:：]|內文摘要[:：]|\[文章內容\]|【文章內容】)\s*([\s\S]*)/i);
    if (bodyMatch && bodyMatch[1].trim()) {
      body = bodyMatch[1].trim();
    }

    // Fallback if tags not explicitly structured
    if (!mainTitle) {
      const firstLineMatch = text.match(/^(?:#|\*\*|【)?([^#\*\n【]+)/m);
      if (firstLineMatch) {
        mainTitle = firstLineMatch[1].replace(/^(✅|💡|🚀|\[.*?\]|【.*?】|\s)*/, '').trim();
      }
    }

    if (!body && text.length > 40) {
      body = text.replace(/(?:\[大標題\]|【大標題】|\[副標題\]|【副標題】|✅.*?!\n*)/gi, '').trim();
    }

    // Convert plain markdown/text body to clean HTML <p>, <h3>, <blockquote>
    if (body) {
      body = body
        .split(/\n\n+/)
        .map(p => {
          let trimmed = p.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('<p>') || trimmed.startsWith('<h3>') || trimmed.startsWith('<blockquote>')) return trimmed;
          if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.length < 50)) {
            return `<h3>${trimmed.replace(/^[#\*\s]+/, '').replace(/[\*\s]+$/, '')}</h3>`;
          }
          return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
        })
        .filter(Boolean)
        .join('');
    }

    return {
      mainTitle: mainTitle || '新聞報導大標題',
      subTitle: subTitle || '新聞報導副標題與即時摘要',
      body: body || '<p>新聞內文報導整理中...</p>'
    };
  }

  // --- Synchronize Article Data to Right View with High-Visibility Animation ---
  function applyArticleDataToRightView(data) {
    if (!data) return;

    if (data.mainTitle) {
      state.article.mainTitle = data.mainTitle;
      articleMainTitle.innerText = data.mainTitle;
    }
    if (data.subTitle) {
      state.article.subTitle = data.subTitle;
      articleSubTitle.innerText = data.subTitle;
    }
    if (data.body) {
      state.article.body = data.body;
      articleBody.innerHTML = data.body;
    }

    // Auto scroll right panel container to top
    const articleContainer = document.querySelector('.article-container');
    const articleContentBody = document.querySelector('.article-content-body');
    if (articleContentBody) {
      articleContentBody.scrollTop = 0;
    }

    // High Contrast Neon Glow Pulse Animation
    if (articleContainer) {
      articleContainer.style.transition = 'all 0.3s ease';
      articleContainer.style.boxShadow = '0 0 50px rgba(6, 182, 212, 0.9), inset 0 0 30px rgba(6, 182, 212, 0.25)';
      articleContainer.style.borderColor = 'rgba(6, 182, 212, 0.9)';
      
      setTimeout(() => {
        articleContainer.style.boxShadow = '';
        articleContainer.style.borderColor = '';
      }, 1500);
    }

    updateArticleStats();
  }

  // --- Check if text is a generic action command ---
  function isActionCommand(text) {
    const actionKeywords = [
      '請生成', '生成一篇', '生成完整', '帶入右側', '文章視窗', 
      '發想 3 個', '爆款大標', '5W1H', '新聞大綱', '補充背景', 
      '補充數據', '一鍵生成', '草稿'
    ];
    return actionKeywords.some(kw => text.includes(kw)) || /^(🚀|💡|📝|🔍|\s)/.test(text);
  }

  // --- Clean topic name from user input ---
  function cleanTopicString(text) {
    return text
      .replace(/^(🚀|💡|📝|🔍|\s)*/, '')
      .replace(/^(請|幫我|撰寫|報導|查詢|發想|請生成|生成一篇|完整新聞報導|帶入右側文章視窗|新聞主題|關於|本周|本週|今日)\s*/g, '')
      .replace(/(的新聞|報導|新聞稿|草稿|文章視窗|右側|新聞)$/g, '')
      .trim();
  }

  // --- Robust Topic Extractor Utility ---
  function resolveTopic(promptText) {
    if (!isActionCommand(promptText)) {
      const cleaned = cleanTopicString(promptText);
      if (cleaned.length >= 2) {
        state.currentTopic = cleaned;
        return state.currentTopic;
      }
    }

    if (state.currentTopic && state.currentTopic.length >= 2) {
      return state.currentTopic;
    }

    for (let i = state.chatHistory.length - 1; i >= 0; i--) {
      const msg = state.chatHistory[i];
      if (msg.role === 'user') {
        const text = msg.content;
        if (!isActionCommand(text)) {
          const cleaned = cleanTopicString(text);
          if (cleaned.length >= 2) {
            state.currentTopic = cleaned;
            return state.currentTopic;
          }
        }
      }
    }

    state.currentTopic = '台股震盪行情分析';
    return state.currentTopic;
  }

  // --- Advanced Multi-Category Realistic News Content Generator ---
  function generateRealisticNewsData(topic, tone) {
    const lower = topic.toLowerCase();

    // CATEGORY 1: Finance, Stock Market & Economy
    if (
      lower.includes('股') || lower.includes('跌') || lower.includes('漲') || 
      lower.includes('財經') || lower.includes('台積電') || lower.includes('美股') || 
      lower.includes('房市') || lower.includes('通膨') || lower.includes('升息') || 
      lower.includes('大盤') || lower.includes('融資') || lower.includes('外資')
    ) {
      const isDrop = lower.includes('跌') || lower.includes('重挫') || lower.includes('崩');

      if (isDrop) {
        return {
          mainTitle: `【${tone}】台股重挫失守萬九關卡！外資急甩賣超 焦點鎖定三大修正原因`,
          subTitle: `受美股晶片股集體拉回與地緣政治避險情緒影響，電子權值股開低走低，分析師解析打底再起關鍵。`,
          body: `
<p>台北股市今日開低走低，盤中在美股科技股重挫與外資擴大賣超影響下，指數一路震盪走低，終場大跌數百點，失守關鍵均線支撐。成交量顯著放大，顯示市場短期避險情緒持續升溫。</p>

<h3>美股晶片股回檔與觀望氣氛 權值龍頭成提款機</h3>
<p>資深證券分析師指出，今日台股出現顯著拉回主要源於三大因素：第一，美股費城半導體指數與科技巨頭股價大幅修正，引發電子權值股獲利回吐賣壓；第二，地緣政治與外資期貨空單維持高檔，市場避險心態濃厚；第三，法說會前夕市場觀望氣氛濃，追價意願不足。</p>

<blockquote>「短線指數雖面臨獲利回吐修正壓力，但從中長期產業趨勢與營收基本面觀察，AI 供應鏈與半導體長線成長動能未變，建議投資人靜待籌碼沉澱與打底訊號。」—— 證券首席分析師受訪表示。</blockquote>

<p>專家特別提醒，短線大盤波動加劇，投資人宜控制融資持股比率，隨時注意美股動向與外資籌碼變化，切勿盲目追高殺低。</p>
          `.trim()
        };
      }

      return {
        mainTitle: `【${tone}】${topic}迎資金行情 法人看好下半年營收再創新高`,
        subTitle: `全球半導體與供應鏈需求強勁，權威分析師預估指數將持續突破關鍵支撐關卡。`,
        body: `
<p>關於「${topic}」之最新市場行情，今日大盤在買盤踴躍湧入下強勢走高。多頭指標與強勢權值股聯手發威，成交量顯著放大，吸引市場資金持續聚攏。</p>

<h3>機構法人擴大買超 基本面強勁支撐</h3>
<p>根據證券交易所最新公佈的三大法人買賣超統計，外資與投信今日持續展現強烈買意。分析師指出，該領域近一季總營收與毛利率雙雙優於預期，顯示整體產業成長動能十分充沛。</p>

<blockquote>「從全球資金動向與技術面指標觀察，${topic}已進入新一波多頭格局，市場中長線趨勢極為正面。」—— 資深證券分析師受訪表示。</blockquote>

<p>投資專家同時提醒，雖然大盤趨勢看好，但投資人仍應留意國際利率走勢與總體經濟數據變化，建立合理的資產配置與風險控管。</p>
        `.trim()
      };
    }

    // CATEGORY 2: Travel & Exhibition
    if (lower.includes('旅展') || lower.includes('旅遊') || lower.includes('觀光') || lower.includes('機票') || lower.includes('飯店') || lower.includes('展覽') || lower.includes('展會')) {
      return {
        mainTitle: `台北國際旅展盛大登場！日韓廉航機票下殺萬元有找 飯店住宿券買一送一掀搶購潮`,
        subTitle: `暑期與秋季出遊商機全面爆發，各大旅行社與星級飯店祭出年度最大折扣，展期首日即吸引數萬民眾入場湧現人潮。`,
        body: `
<p>年度旅遊盛會「台北國際旅展」今日於世貿盛大登場！本屆集結全球數十個國家地區觀光局、各大航空公司、頂級旅行社及星級飯店參展。展場一早未開門即吸引大批民眾排隊，準備搶購優惠機票與限量餐券行程。</p>

<h3>日韓自由行行程最搶手 星級餐券住宿券秒殺</h3>
<p>因應國人強勁的出國旅遊需求，各大旅行社針對熱門目的地推出超殺優惠，其中東京、首爾 5 日自由行含稅價下殺至萬元以內；國籍與廉價航空亦祭出旅展限定早鳥促銷票。國旅方面，五星級飯店聯合住宿券與知名吃到飽餐券買一送一優惠，更是展場的熱銷地標。</p>

<blockquote>「今年下半年出遊買氣異常旺盛，展期首日進場人次已較去年同期成長逾二成，業者樂觀預估四天的展期總銷售額將再創歷史新高。」—— 台北旅展展會發言人受訪表示。</blockquote>

<p>主辦單位提醒，部分限量超低價機票與熱門餐券每日均有配額限制，欲前來搶便宜出遊的民眾可把握本週末展期參觀選購，並注意各項票券的使用條款與期限。</p>
        `.trim()
      };
    }

    // CATEGORY 3: Weather & Meteorology
    if (lower.includes('天氣') || lower.includes('氣象') || lower.includes('高雄') || lower.includes('台北') || lower.includes('氣溫') || lower.includes('雨') || lower.includes('颱風')) {
      return {
        mainTitle: `【${tone}】多雲到晴高溫飆至 34 度 午後慎防局部大雨與雷陣雨`,
        subTitle: `中央氣象署發布高溫與降雨特報，近山區與內陸地區高溫極為悶熱，市民外出請做好防曬並隨身攜帶雨具。`,
        body: `
<p>據中央氣象署最新氣象預報，今日受暖濕氣流與熱力作用影響，全台多數地區呈現多雲到晴的高溫天氣。白天各地最高氣溫普遍落在 32 至 34 度之間，體感溫度相當悶熱。</p>

<h3>午後大氣熱對流顯著 紫外線指數高達危險級</h3>
<p>氣象署指出，午後受熱力作用影響，山區及鄰近平原區域有局部短暫雷陣雨發生的機率，並可能伴隨短延時強降雨與強陣風。前往戶外活動的市民請特別注意大氣變化與防雷擊。</p>

<blockquote>「中午前後紫外線指數極高，提醒廣大市民避免在強烈陽光下長時間暴曬，並請及時補充水分與防曬保濕。」—— 氣象預報中心預報員提醒。</blockquote>

<p>預計未來數天天氣型態變化不大，氣候維持高溫濕熱，請關心天氣變化的民眾持續鎖定最新即時氣象特報。</p>
        `.trim()
      };
    }

    // CATEGORY 4: Tech & Products
    if (lower.includes('蘋果') || lower.includes('iphone') || lower.includes('ai') || lower.includes('晶片') || lower.includes('科技') || lower.includes('軟體') || lower.includes('半導體')) {
      return {
        mainTitle: `【${tone}】新一代 AI 晶片架構重大突破 運算效能躍升 50% 重塑產業生態`,
        subTitle: `全球科技巨頭發表最新軟硬體整合架構，將全面加速邊緣運算與個人化 AI 應用普及。`,
        body: `
<p>全球科技產業今日迎來突破性里程碑！最新發表的全新晶片與軟體架構，採用頂尖奈米製程與類神經運算單元，能大幅降低 AI 推論的能量消耗，同時提升 50% 的極限處理效能。</p>

<h3>軟硬體深度結合 邊緣 AI 終端裝置全面升級</h3>
<p>研發團隊指出，這項技術突破解決了長期以來高效能運算的散熱與電力瓶頸。未來不論是智慧型手機、筆記型電腦或是自動駕駛車輛，都能直接在裝置端執行複雜的生成式 AI 邏輯。</p>

<blockquote>「我們不僅提升了架構的純運算速度，更讓 AI 的推論成本降至過去的十分之一，這將引發大規模的產品換機潮。」—— 科技巨頭首席技術長表示。</blockquote>

<p>市場分析師預估，首批搭載該新晶片的消費性終端產品預計將於今年第四季開始量產發售，帶動供應鏈迎來新一波成長高峰。</p>
        `.trim()
      };
    }

    // CATEGORY 5: Universal Event / Incident News Generator
    return {
      mainTitle: `【${tone}】${topic}引發廣泛關切 關鍵數據與專家深度解析出爐`,
      subTitle: `記者第一手直擊「${topic}」最新演變，權威單位與採訪團隊梳理三大核心影響層面。`,
      body: `
<p>針對今日備受各界關注的「${topic}」事件，新聞採編團隊綜合第一手現場資訊與權威專家訪談，梳理出背後的核心演變脈絡與數據指標。</p>

<h3>釐清核心關鍵因素 專家出面剖析後續影響</h3>
<p>根據最新公開的相關研析數據顯示，${topic}引發公眾與相關產業的高度重視。專業分析師指出，相關指標與後續動態將對整體環境產生深遠影響。</p>

<blockquote>「這項變化的背後反映出結構性的轉變，各界應密切注意後續趨勢演變並做好因應措施。」—— 資深產業專家受訪時指出。</blockquote>

<p>新聞團隊將持續關注「${topic}」的最新進展，為廣大讀者帶來及時、客觀與第一手的新聞報導。</p>
      `.trim()
    };
  }

  // --- Mock Generator (Fallback when no API Key is set) ---
  function generateMockResponse(userPrompt, tone) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const topic = resolveTopic(userPrompt);
        const isArticleGenReq = userPrompt.includes('生成') || userPrompt.includes('完整') || userPrompt.includes('報導') || userPrompt.includes('帶入') || userPrompt.includes('草稿');

        const newsData = generateRealisticNewsData(topic, tone);

        if (isArticleGenReq) {
          const replyText = `✅ 已成功為您產出「**${tone}**」風格的新聞報導！已自動將報導帶入右側文章視窗。\n\n[大標題] ${newsData.mainTitle}\n[副標題] ${newsData.subTitle}\n[內文]\n${newsData.body}`;
          resolve({ content: replyText, articleData: newsData });
        } else {
          const replyText = `💡 針對新聞主題「**${topic}**」，已為您以 **${tone}** 風格整理以下採編切入點：\n\n1. **新聞焦點**：聚焦${topic}的最新關鍵數據與第一手事件觀察。\n2. **專家視角**：採訪權威分析師與現場關鍵人士剖析影響。\n\n點擊下方「🚀 生成完整報導草稿」按鈕，即可產出完整報導並帶入右側文章視窗！`;
          resolve({ content: replyText, articleData: null });
        }

      }, 800);
    });
  }

  // --- Call Gemini API with Multi-turn Conversation Context ---
  async function callGeminiAPI(userPrompt, tone) {
    if (!state.apiKey) {
      return await generateMockResponse(userPrompt, tone);
    }

    const topic = resolveTopic(userPrompt);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;

    const systemInstruction = `你是一位專業資深新聞編輯與採編 AI 助手 (AI Newsroom Co-Pilot)。
使用者目前正在採編新聞主題：「${topic}」，報導風格為：【${tone}】。
你的目標是協助使用者撰寫真實、精準、結構紮實的新聞報導。

當使用者要求撰寫報導或生成文章時，請在回應中嚴格包含以下標籤以利程式解析：
[大標題] 新聞大標題
[副標題] 新聞副標題
[內文]
新聞段落內容（可用 HTML <p>、<h3>、<blockquote> 標籤格式化）

請使用繁體中文回應，並產出真實豐富的新聞內容與具體細節，切勿輸出通用空洞的套話。`;

    const contents = [];
    contents.push({
      role: 'user',
      parts: [{ text: systemInstruction }]
    });

    state.chatHistory.forEach(msg => {
      if (msg.id === 'msg-1') return;
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    const lastMsg = state.chatHistory[state.chatHistory.length - 1];
    if (!lastMsg || lastMsg.content !== userPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }]
      });
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API 回應錯誤 (${response.status})`);
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '無回應內容';

      const articleData = parseArticleFromText(replyText);

      return { content: replyText, articleData };
    } catch (err) {
      console.warn('Gemini API Error, falling back to mock mode:', err);
      showToast(`API 呼叫失敗 (${err.message})，自動切換至主題 Mock 模式`, 'info');
      return await generateMockResponse(userPrompt, tone);
    }
  }

  // --- Send Message Handler ---
  async function handleSendMessage(promptText) {
    const textToSend = promptText || chatInput.value.trim();
    if (!textToSend || state.isGenerating) return;

    resolveTopic(textToSend);

    state.chatHistory.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      articleData: null
    });

    chatInput.value = '';
    renderChatMessages();

    state.isGenerating = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    const response = await callGeminiAPI(textToSend, state.toneStyle);

    state.chatHistory.push({
      id: `msg-${Date.now() + 1}`,
      role: 'ai',
      content: response.content,
      articleData: response.articleData
    });

    // Automatically sync right article view whenever article data is returned
    if (response.articleData) {
      applyArticleDataToRightView(response.articleData);
    }

    state.isGenerating = false;
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    renderChatMessages();
  }

  // --- Event Listeners Initialization ---
  function initEventListeners() {
    toneSelector.addEventListener('change', (e) => {
      state.toneStyle = e.target.value;
      showToast(`報導風格已設定為：「${state.toneStyle}」`, 'info');
    });

    apiKeyBtn.addEventListener('click', () => {
      modalApiKeyInput.value = state.apiKey;
      apiKeyModal.classList.add('active');
    });
    closeModalBtn.addEventListener('click', () => {
      apiKeyModal.classList.remove('active');
    });
    saveApiKeyBtn.addEventListener('click', () => {
      const newKey = modalApiKeyInput.value.trim();
      state.apiKey = newKey;
      if (newKey) {
        localStorage.setItem('gemini_api_key', newKey);
        showToast('Gemini API Key 已儲存！已切換為真實 Gemini AI', 'success');
      } else {
        localStorage.removeItem('gemini_api_key');
        showToast('已清除 API Key，恢復為 Mock 模式', 'info');
      }
      updateApiKeyStatusUI();
      apiKeyModal.classList.remove('active');
    });

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage();
    });

    clearChatBtn.addEventListener('click', () => {
      state.chatHistory = [...INITIAL_CHAT];
      state.currentTopic = '';
      renderChatMessages();
      showToast('對話紀錄已清空', 'info');
    });

    document.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const promptText = chip.getAttribute('data-prompt');
        handleSendMessage(promptText);
      });
    });

    articleMainTitle.addEventListener('blur', () => {
      state.article.mainTitle = articleMainTitle.innerText;
      updateArticleStats();
    });
    articleSubTitle.addEventListener('blur', () => {
      state.article.subTitle = articleSubTitle.innerText;
      updateArticleStats();
    });
    articleBody.addEventListener('input', () => {
      state.article.body = articleBody.innerHTML;
      updateArticleStats();
    });

    copyArticleBtn.addEventListener('click', () => {
      const fullText = `${articleMainTitle.innerText}\n\n${articleSubTitle.innerText}\n\n${articleBody.innerText}`;
      navigator.clipboard.writeText(fullText).then(() => {
        showToast('已成功將新聞全文複製至剪貼簿！', 'success');
      }).catch(err => {
        showToast('複製失敗: ' + err.message, 'info');
      });
    });

    exportMdBtn.addEventListener('click', () => {
      const title = articleMainTitle.innerText.trim();
      const subtitle = articleSubTitle.innerText.trim();
      const plainBody = articleBody.innerText.trim();

      const mdContent = `# ${title}\n\n> ${subtitle}\n\n---\n\n${plainBody}`;
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `新聞報導_${Date.now()}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('已下載 Markdown (.md) 檔案！', 'success');
    });

    resetArticleBtn.addEventListener('click', () => {
      if (confirm('確定要重置右側文章為初始草稿嗎？')) {
        applyArticleDataToRightView(INITIAL_ARTICLE);
        showToast('文章已重置為初始草稿', 'info');
      }
    });
  }

  // --- Initialize App ---
  function init() {
    updateApiKeyStatusUI();
    renderChatMessages();
    updateArticleStats();
    initEventListeners();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
