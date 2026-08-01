/* ==========================================================================
   TaskFlow Dashboard Application Logic
   SEO, Content, Prompt & Syntax Management System (Custom Category Input & Draft Protection)
   ========================================================================== */

/* Firebase Configuration & Initialization */
const firebaseConfig = {
  apiKey: "AIzaSyDWZgnKKRwhUKzF4y6i0dmn510BgZAMxV8",
  authDomain: "taskflow2805.firebaseapp.com",
  projectId: "taskflow2805",
  storageBucket: "taskflow2805.firebasestorage.app",
  messagingSenderId: "1064340789403",
  appId: "1:1064340789403:web:c022c49332a2fb21118e3e",
  measurementId: "G-DHZ7D568F1"
};

let db = null;
let auth = null;

function initFirebase() {
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      auth = firebase.auth();
      console.log("🔥 Firebase initialized successfully for TaskFlow (Realtime Cloud Database)");
      
      auth.onAuthStateChanged((user) => {
        if (user) {
          console.log("🔥 Firebase Auth user connected:", user.email);
          setupFirebaseRealtimeListeners();
        }
      });

      setupFirebaseRealtimeListeners();
    } catch (err) {
      console.warn("Firebase Init Notice:", err.message);
    }
  }
}

const DEFAULT_MEMBERS = [
  { id: 'm1', name: 'Thanh', email: 'thanh@taskflow.com' },
  { id: 'm2', name: 'Vang', email: 'vang@taskflow.com' },
  { id: 'm3', name: 'Thành viên 3', email: 'thanhvien3@taskflow.com' },
  { id: 'm4', name: 'Thành viên 4', email: 'thanhvien4@taskflow.com' }
];

const DEFAULT_CATEGORIES = [
  'Dịch vụ SEO',
  'Kiến thức SEO',
  'Hướng dẫn WordPress',
  'Tin tức Marketing',
  'SEO Offpage',
  'Web 2.0',
  'PBN Network',
  'Social Profile',
  'SEO',
  'Content',
  'Blogger Free',
  'PBN Blogger',
  'SEO Google',
  'Bất động sản'
];

const DEFAULT_ARTICLE_CATEGORIES = ['Dịch vụ SEO', 'Kiến thức SEO', 'Hướng dẫn WordPress', 'Tin tức Marketing'];
const DEFAULT_BACKLINK_CATEGORIES = ['SEO Offpage', 'Web 2.0', 'PBN Network', 'Social Profile'];
const DEFAULT_BLOGGER_CATEGORIES = ['SEO', 'Content', 'Blogger Free', 'PBN Blogger'];
const DEFAULT_SYNTAX_CATEGORIES = ['SEO Google', 'Bất động sản'];

const DEFAULT_GOOGLE_SYNTAX_MAP = {};
const DEFAULT_BACKLINK_SYNTAX_MAP = {};

// Default Starting Data Arrays (Ensures Dashboard is never blank or showing zeroes)
const DEFAULT_PROMPTS = [
  {
    id: 'p1',
    title: 'Lập Dàn Ý Bài Viết Chuẩn SEO 2026',
    category: 'Content',
    content: 'Hãy viết dàn ý chi tiết bài viết SEO cho chủ đề {topic} với từ khóa chính là {keyword}. Bao gồm các thẻ H2, H3 và phân tích ý định tìm kiếm.',
    favorite: true
  },
  {
    id: 'p2',
    title: 'Viết Đoạn Mở Đầu Thu Hút (SEO Hook)',
    category: 'Content',
    content: 'Viết đoạn mở bài 150 từ thu hút độc giả về chủ đề {topic}, lồng ghép tự nhiên từ khóa {keyword}.',
    favorite: false
  }
];

const DEFAULT_ARTICLES = [
  {
    id: 'a1',
    memberId: 'm1',
    title: 'Hướng Dẫn SEO Onpage Chuẩn 2026 Từ A-Z',
    category: 'Dịch vụ SEO',
    primaryKeyword: 'seo onpage 2026',
    publishedUrl: 'https://vinhomesgrandparkvhgrp.com/seo-onpage-2026',
    status: 'Published'
  },
  {
    id: 'a2',
    memberId: 'm2',
    title: 'Bảng Giá Cho Thuê Căn Hộ The Opus One Mới Nhất',
    category: 'Bất động sản',
    primaryKeyword: 'Cho thuê The Opus One',
    publishedUrl: 'https://vinhomesgrandparkvhgrp.com/cho-thue-the-opus-one',
    status: 'Published'
  }
];

const DEFAULT_BACKLINKS = [
  {
    id: 'b1',
    memberId: 'm1',
    category: 'SEO Offpage',
    primaryKeyword: 'dịch vụ seo uy tín',
    targetUrl: 'https://vinhomesgrandparkvhgrp.com/dich-vu-seo',
    backlinks: ['https://medium.com/@seomaster/bai-viet-1', 'https://sites.google.com/view/seo-offpage/link1']
  }
];

const DEFAULT_BACKLINK_BLOGGER = [
  {
    id: 'bb1',
    memberId: 'm2',
    bloggerUrl: 'https://canhotheopusone.blogspot.com/2026/08/cho-thue-opus-one.html',
    category: 'Bất động sản',
    date: '2026-08-01',
    items: [
      { kw: 'Cho thuê The Opus One', url: 'https://vinhomesgrandparkvhgrp.com/cho-thue-the-opus-one' }
    ]
  }
];

const DEFAULT_SYNTAX = [
  {
    id: 's1',
    memberId: 'm1',
    type: 'Google Search',
    primaryKeyword: 'Cho thuê The Opus One',
    syntaxes: ['https://www.google.com/ ###Cho thuê The Opus One, vinhomesgrandparkvhgrp.com!!!']
  }
];

const DEFAULT_ACTIVITIES = [];

// App State
let state = {
  members: [],
  prompts: [],
  articles: [],
  backlinks: [],
  backlinkBlogger: [],
  syntax: [],
  activities: [],
  activeView: 'overview',
  activeMemberFilter: {
    articles: 'all',
    backlinks: 'all',
    backlinkBlogger: 'all',
    syntax: 'all'
  },
  activeCategoryFilter: {
    articles: 'all',
    backlinks: 'all',
    backlinkBlogger: 'all',
    syntax: 'all'
  },
  activeUsedPromptId: null
};

// Custom Confirm Callback Pointer
let pendingConfirmCallback = null;

function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirm-title').textContent = title || 'XÁC NHẬN XÓA';
  document.getElementById('confirm-message').textContent = message || 'Bạn có chắc chắn muốn thực hiện thao tác này?';
  pendingConfirmCallback = onConfirm;
  openModal('modal-confirm-delete');
}

function handleConfirmAccept() {
  if (typeof pendingConfirmCallback === 'function') {
    pendingConfirmCallback();
  }
  pendingConfirmCallback = null;
  closeModal('modal-confirm-delete');
}

// 12 Distinct Vibrant Gradient Colors for Team Member Avatars
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #4f46e5)', // 0: Indigo
  'linear-gradient(135deg, #10b981, #059669)', // 1: Emerald Green
  'linear-gradient(135deg, #f97316, #ea580c)', // 2: Vivid Orange
  'linear-gradient(135deg, #f43f5e, #e11d48)', // 3: Bright Rose
  'linear-gradient(135deg, #06b6d4, #0284c7)', // 4: Cyan Sky
  'linear-gradient(135deg, #a855f7, #9333ea)', // 5: Purple
  'linear-gradient(135deg, #eab308, #ca8a04)', // 6: Golden Amber
  'linear-gradient(135deg, #ef4444, #dc2626)', // 7: Red
  'linear-gradient(135deg, #3b82f6, #1d4ed8)', // 8: Royal Blue
  'linear-gradient(135deg, #84cc16, #65a30d)', // 9: Lime Green
  'linear-gradient(135deg, #d946ef, #c026d3)', // 10: Magenta
  'linear-gradient(135deg, #64748b, #475569)'  // 11: Steel Slate
];

// 12 Distinct Color Palettes for Category Badges
const BADGE_COLOR_PALETTES = [
  { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' },  // 0: Indigo
  { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },  // 1: Emerald
  { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },  // 2: Orange
  { bg: 'rgba(244, 63, 94, 0.15)',  color: '#f43f5e' },  // 3: Rose
  { bg: 'rgba(6, 182, 212, 0.15)',  color: '#06b6d4' },  // 4: Cyan
  { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' },  // 5: Purple
  { bg: 'rgba(234, 179, 8, 0.15)',  color: '#eab308' },  // 6: Amber
  { bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' },  // 7: Hot Pink
  { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },  // 8: Royal Blue
  { bg: 'rgba(132, 204, 22, 0.15)', color: '#84cc16' },  // 9: Lime
  { bg: 'rgba(217, 70, 239, 0.15)', color: '#d946ef' },  // 10: Magenta
  { bg: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6' }   // 11: Teal
];

function getCategoryBadgeHTML(categoryName) {
  if (!categoryName) return '';
  const clean = categoryName.trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = BADGE_COLOR_PALETTES[Math.abs(hash) % BADGE_COLOR_PALETTES.length];
  return `<span class="prompt-category-badge" style="background-color: ${palette.bg}; color: ${palette.color};">${escapeHTML(clean)}</span>`;
}

function normalizeStr(str) {
  if (!str) return '';
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").trim();
}

function getMemberInitial(name) {
  if (!name || typeof name !== 'string') return 'T';
  const clean = name.trim();
  if (!clean) return 'T';
  const parts = clean.split(/\s+/);
  const target = parts[parts.length - 1] || parts[0];
  return target.charAt(0).toUpperCase() || 'T';
}

function getMemberAvatarHTML(nameOrId, size = 'sm') {
  if (!nameOrId) return `<span class="avatar-circle avatar-${size}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff;">T</span>`;
  let memberObj = state.members.find(m => m && (m.id === nameOrId || m.name === nameOrId));
  let name = memberObj ? memberObj.name : String(nameOrId);
  
  const initial = getMemberInitial(name);
  
  let memberIdx = state.members.findIndex(m => m && (m.id === nameOrId || m.name === nameOrId));
  if (memberIdx === -1) {
    let hash = 0;
    const strName = String(name || 'T');
    for (let i = 0; i < strName.length; i++) hash = strName.charCodeAt(i) + ((hash << 5) - hash);
    memberIdx = Math.abs(hash);
  }

  const bg = AVATAR_GRADIENTS[memberIdx % AVATAR_GRADIENTS.length];
  return `<span class="avatar-circle avatar-${size}" style="background: ${bg}; color: #ffffff;">${escapeHTML(initial)}</span>`;
}

function getMemberName(mId) {
  const m = state.members.find(x => x && x.id === mId);
  return m && m.name ? m.name : 'Thành viên';
}

function getMemberBadgeHTML(mId) {
  const name = getMemberName(mId);
  return `<span class="member-badge">${getMemberAvatarHTML(mId, 'xs')} <span>${escapeHTML(name)}</span></span>`;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  initFirebase();
  initTheme();
  renderSubmenus();
  renderMemberSelectOptions();
  renderPromptCategoryFilterOptions();
  renderAllCategorySelectOptions();
  renderAllViews();
  setupGlobalEvents();
  setupDraftAutoSave();
  updateCurrentUserBadge();

  // Polling tự động làm sạch nhật ký cũ hơn 10 giây
  cleanupExpiredActivities();
  setInterval(cleanupExpiredActivities, 1000);

  // Hiện màn hình Login nếu chưa có phiên đăng nhập trong sessionStorage
  if (!state.currentUser) {
    openLoginScreen();
  }
});

function loadDataFromStorage() {
  const savedMembers = JSON.parse(localStorage.getItem('taskflow_members'));
  if (Array.isArray(savedMembers) && savedMembers.length > 0) {
    state.members = savedMembers;
  } else {
    state.members = [...DEFAULT_MEMBERS];
  }

  state.prompts = JSON.parse(localStorage.getItem('taskflow_prompts')) || [...DEFAULT_PROMPTS];
  state.articles = JSON.parse(localStorage.getItem('taskflow_articles')) || [...DEFAULT_ARTICLES];
  state.backlinks = JSON.parse(localStorage.getItem('taskflow_backlinks')) || [...DEFAULT_BACKLINKS];
  state.backlinkBlogger = JSON.parse(localStorage.getItem('taskflow_backlinkBlogger')) || [...DEFAULT_BACKLINK_BLOGGER];
  state.currentUser = JSON.parse(sessionStorage.getItem('taskflow_current_user')) || null;
  state.syntax = JSON.parse(localStorage.getItem('taskflow_syntax')) || [...DEFAULT_SYNTAX];
  state.categories = JSON.parse(localStorage.getItem('taskflow_categories')) || DEFAULT_CATEGORIES;
  state.googleSyntaxMap = JSON.parse(localStorage.getItem('taskflow_google_syntax_map')) || DEFAULT_GOOGLE_SYNTAX_MAP;
  state.backlinkSyntaxMap = JSON.parse(localStorage.getItem('taskflow_backlink_syntax_map')) || DEFAULT_BACKLINK_SYNTAX_MAP;
  
  const now = Date.now();
  state.activities = (JSON.parse(localStorage.getItem('taskflow_activities')) || DEFAULT_ACTIVITIES)
    .filter(a => now - (a.createdAt || 0) < 10000);

  // Đảm bảo dữ liệu mặc định luôn sẵn sàng nếu mảng rỗng
  if (!state.articles || state.articles.length === 0) state.articles = [...DEFAULT_ARTICLES];
  if (!state.prompts || state.prompts.length === 0) state.prompts = [...DEFAULT_PROMPTS];
  if (!state.backlinks || state.backlinks.length === 0) state.backlinks = [...DEFAULT_BACKLINKS];
  if (!state.backlinkBlogger || state.backlinkBlogger.length === 0) state.backlinkBlogger = [...DEFAULT_BACKLINK_BLOGGER];
  if (!state.syntax || state.syntax.length === 0) state.syntax = [...DEFAULT_SYNTAX];

  // Migrate missing memberId to m1 if any
  state.articles.forEach(a => { if (!a.memberId) a.memberId = 'm1'; });
  state.backlinks.forEach(b => { if (!b.memberId) b.memberId = 'm1'; });
  state.backlinkBlogger.forEach(b => { if (!b.memberId) b.memberId = 'm1'; });
  state.syntax.forEach(s => { if (!s.memberId) s.memberId = 'm1'; });

  saveDataToStorage();
}

function saveDataToStorage() {
  localStorage.setItem('taskflow_members', JSON.stringify(state.members));
  localStorage.setItem('taskflow_prompts', JSON.stringify(state.prompts));
  localStorage.setItem('taskflow_articles', JSON.stringify(state.articles));
  localStorage.setItem('taskflow_backlinks', JSON.stringify(state.backlinks));
  localStorage.setItem('taskflow_backlinkBlogger', JSON.stringify(state.backlinkBlogger));
  localStorage.setItem('taskflow_syntax', JSON.stringify(state.syntax));
  localStorage.setItem('taskflow_activities', JSON.stringify(state.activities));
  localStorage.setItem('taskflow_categories', JSON.stringify(state.categories));
  localStorage.setItem('taskflow_google_syntax_map', JSON.stringify(state.googleSyntaxMap || {}));
  localStorage.setItem('taskflow_backlink_syntax_map', JSON.stringify(state.backlinkSyntaxMap || {}));

  // Sync settings and categories to cloud efficiently
  syncCategoriesToFirebase();
}

// Dynamic Category Options Filter in Toolbar
function renderPromptCategoryFilterOptions() {
  const filterEl = document.getElementById('prompt-category-filter');
  if (!filterEl) return;

  const currentVal = filterEl.value || 'all';
  const categories = [...new Set(state.prompts.map(p => p.category).filter(Boolean))];

  filterEl.innerHTML = `
    <option value="all">Tất cả danh mục</option>
    ${categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('')}
  `;
  filterEl.value = categories.includes(currentVal) ? currentVal : 'all';
}

// Unified Category Manager & Renderer
function getCategoryConfig(moduleKey) {
  const config = {
    articles: {
      filterId: 'article-category-filter',
      inputId: 'article-cat-input',
      stateKey: 'articleCategories',
      defaultList: DEFAULT_ARTICLE_CATEGORIES,
      modalId: 'modal-manage-article-cat',
      listId: 'existing-article-cat-list',
      inputIdAdd: 'new-article-cat-input'
    },
    backlinks: {
      filterId: 'backlink-category-filter',
      inputId: 'backlink-cat-input',
      stateKey: 'backlinkCategories',
      defaultList: DEFAULT_BACKLINK_CATEGORIES,
      modalId: 'modal-manage-backlink-cat',
      listId: 'existing-backlink-cat-list',
      inputIdAdd: 'new-backlink-cat-input'
    },
    backlinkBlogger: {
      filterId: 'backlinkBlogger-category-filter',
      inputId: 'backlinkBlogger-category-input',
      stateKey: 'backlinkBloggerCategories',
      defaultList: DEFAULT_BLOGGER_CATEGORIES,
      modalId: 'modal-manage-backlinkBlogger-cat',
      listId: 'existing-backlinkBlogger-cat-list',
      inputIdAdd: 'new-backlinkBlogger-cat-input'
    },
    syntax: {
      filterId: 'syntax-category-filter',
      inputId: 'syntax-category-input',
      stateKey: 'syntaxCategories',
      defaultList: DEFAULT_SYNTAX_CATEGORIES,
      modalId: 'modal-manage-syntax-cat',
      listId: 'existing-syntax-cat-list',
      inputIdAdd: 'new-syntax-cat-input'
    }
  };
  return config[moduleKey];
}

function populateCategoryOptions(moduleKey, selectedValue) {
  const cfg = getCategoryConfig(moduleKey);
  if (!cfg) return;

  const filterEl = document.getElementById(cfg.filterId);
  const inputEl = document.getElementById(cfg.inputId);

  const categories = [...(state.categories || DEFAULT_CATEGORIES)];

  if (selectedValue && !categories.includes(selectedValue) && selectedValue !== 'all' && selectedValue !== '__add_new__') {
    categories.push(selectedValue);
  }

  if (filterEl) {
    const cur = (state.activeCategoryFilter && state.activeCategoryFilter[moduleKey]) || 'all';
    filterEl.innerHTML = `
      <option value="all">Tất cả phân khu</option>
      ${categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('')}
      <option value="__add_new__">+ Thêm phân khu...</option>
    `;
    filterEl.value = categories.includes(cur) ? cur : 'all';
  }

  if (inputEl) {
    inputEl.innerHTML = categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    if (selectedValue && categories.includes(selectedValue)) {
      inputEl.value = selectedValue;
    } else if (categories.length > 0) {
      inputEl.value = categories[0];
    }
  }
}

function renderAllCategorySelectOptions() {
  populateCategoryOptions('articles');
  populateCategoryOptions('backlinks');
  populateCategoryOptions('backlinkBlogger');
  populateCategoryOptions('syntax');
}

function handleCategorySelectChange(moduleKey, val) {
  const cfg = getCategoryConfig(moduleKey);
  if (!cfg) return;

  if (val === '__add_new__') {
    const filterEl = document.getElementById(cfg.filterId);
    if (filterEl) {
      filterEl.value = (state.activeCategoryFilter && state.activeCategoryFilter[moduleKey]) || 'all';
    }
    openManageCategoriesModal(moduleKey);
  } else {
    if (!state.activeCategoryFilter) state.activeCategoryFilter = {};
    state.activeCategoryFilter[moduleKey] = val;
    if (moduleKey === 'articles') renderArticlesView();
    if (moduleKey === 'backlinks') renderBacklinksView();
    if (moduleKey === 'backlinkBlogger') renderBacklinkBloggerView();
    if (moduleKey === 'syntax') renderSyntaxView();
  }
}

function openManageCategoriesModal(moduleKey) {
  const cfg = getCategoryConfig(moduleKey);
  if (!cfg) return;

  renderExistingCategoriesList(moduleKey);
  openModal(cfg.modalId);
}

function renderExistingCategoriesList(moduleKey) {
  const cfg = getCategoryConfig(moduleKey);
  if (!cfg) return;

  const container = document.getElementById(cfg.listId);
  if (!container) return;

  const categories = state.categories || DEFAULT_CATEGORIES;

  if (categories.length === 0) {
    container.innerHTML = `<span class="text-muted">Chưa có phân khu nào</span>`;
    return;
  }

  container.innerHTML = categories.map(c => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 6px;">
      <span style="font-weight: 500; font-size: 13px;">${escapeHTML(c)}</span>
      <button class="btn-icon-only danger" onclick="deleteCategory('${moduleKey}', '${escapeJsString(c)}')" title="Xóa phân khu">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `).join('');
}

function saveCategory(moduleKey, event) {
  if (event) {
    event.preventDefault();
  }
  const cfg = getCategoryConfig(moduleKey);
  if (!cfg) return;

  const input = document.getElementById(cfg.inputIdAdd);
  if (!input) return;

  const val = input.value.trim();
  if (!val) return;

  if (!state.categories) state.categories = [...DEFAULT_CATEGORIES];

  if (state.categories.some(c => c.toLowerCase() === val.toLowerCase())) {
    showToast('Phân khu này đã tồn tại!', 'danger');
    return;
  }

  state.categories.push(val);
  const currentMemId = state.currentUser ? state.currentUser.memberId : 'm1';
  logMemberActivity(currentMemId, 'Thêm Phân Khu', val, moduleKey);
  saveDataToStorage();
  renderAllCategorySelectOptions();
  renderExistingCategoriesList(moduleKey);
  input.value = '';
  showToast('Đã thêm phân khu mới đồng bộ!', 'success');
}

function saveNewCategory(moduleKey, event) {
  saveCategory(moduleKey, event);
}

function deleteCategory(moduleKey, catName) {
  const cfg = getCategoryConfig(moduleKey);
  if (!cfg) return;

  if (state.categories.length <= 1) {
    showToast('Phải giữ lại ít nhất 1 phân khu.', 'danger');
    return;
  }

  state.categories = state.categories.filter(c => c !== catName);
  const currentMemId = state.currentUser ? state.currentUser.memberId : 'm1';
  logMemberActivity(currentMemId, 'Xóa Phân Khu', catName, moduleKey);
  saveDataToStorage();
  renderAllCategorySelectOptions();
  renderExistingCategoriesList(moduleKey);
  renderAllViews();
  showToast(`Đã xóa phân khu "${catName}".`, 'danger');
}

// Render Submenus with Members Only
function renderSubmenus() {
  const modules = ['articles', 'backlinks', 'backlinkBlogger', 'syntax'];

  modules.forEach(mod => {
    const container = document.getElementById(`submenu-${mod}`);
    if (!container) return;

    const currentFilter = state.activeMemberFilter[mod];

    const membersHTML = state.members.map(m => `
      <a href="#" class="sub-item ${currentFilter === m.id ? 'active' : ''}" data-member-view="${mod}-${m.id}" onclick="filterByMember('${mod}', '${m.id}', event)">
        ${getMemberAvatarHTML(m.id, 'xs')} <span>${escapeHTML(m.name)}</span>
      </a>
    `).join('');

    container.innerHTML = membersHTML;
  });
}

// Render Member Select Options in Toolbars & Modals
function renderMemberSelectOptions() {
  const filterSelects = ['article-member-filter', 'backlink-member-filter', 'backlinkBlogger-member-filter', 'syntax-member-filter'];
  filterSelects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const mod = id.split('-')[0];
    const currentVal = state.activeMemberFilter[mod] || 'all';

    el.innerHTML = `
      <option value="all">Tất cả thành viên</option>
      ${state.members.map(m => `<option value="${m.id}">${escapeHTML(m.name)}</option>`).join('')}
    `;
    el.value = currentVal;
  });

  const formSelects = ['article-member-input', 'backlink-member-input', 'backlinkBlogger-member-input', 'syntax-member-input', 'gen-google-member-select', 'gen-backlink-member-select'];
  formSelects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const oldVal = el.value;
    el.innerHTML = state.members.map(m => `<option value="${m.id}">${escapeHTML(m.name)}</option>`).join('');
    if (oldVal && state.members.some(m => m.id === oldVal)) {
      el.value = oldVal;
    }
  });
}

// Add/Manage Member Modal Logic
function openAddMemberModal(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  renderExistingMembersList();
  document.getElementById('new-member-name-input').value = `Thành viên ${state.members.length + 1}`;
  openModal('modal-add-member');
}

let _draggedMemberId = null;

function handleMemberDragStart(e) {
  _draggedMemberId = e.currentTarget.dataset.memberId;
  e.currentTarget.classList.add('dragging');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', _draggedMemberId);
  }
}

function handleMemberDragOver(e) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const item = e.currentTarget;
  if (item && item.dataset.memberId !== _draggedMemberId) {
    item.classList.add('drag-over');
  }
}

function handleMemberDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleMemberDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.existing-member-item').forEach(el => el.classList.remove('drag-over', 'dragging'));
}

function handleMemberDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const targetMemberId = e.currentTarget.dataset.memberId;
  if (!_draggedMemberId || _draggedMemberId === targetMemberId) return;

  const draggedIdx = state.members.findIndex(m => m.id === _draggedMemberId);
  const targetIdx = state.members.findIndex(m => m.id === targetMemberId);

  if (draggedIdx !== -1 && targetIdx !== -1) {
    const [moved] = state.members.splice(draggedIdx, 1);
    state.members.splice(targetIdx, 0, moved);

    saveDataToStorage();
    renderExistingMembersList();
    renderSubmenus();
    renderMemberSelectOptions();
    renderAllViews();
    showToast('Đã sắp xếp lại thứ tự thành viên!', 'success');
  }
}

function renderExistingMembersList() {
  const container = document.getElementById('existing-members-list');
  if (!container) return;

  if (state.members.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size:12px;">Chưa có thành viên nào.</p>`;
    return;
  }

  container.innerHTML = state.members.map(m => `
    <div class="existing-member-item" draggable="true" data-member-id="${m.id}" ondragstart="handleMemberDragStart(event)" ondragover="handleMemberDragOver(event)" ondragleave="handleMemberDragLeave(event)" ondragend="handleMemberDragEnd(event)" ondrop="handleMemberDrop(event)">
      <span>
        <i class="ri-drag-move-2-line drag-handle" title="Kéo để di chuyển vị trí"></i>
        ${getMemberAvatarHTML(m.id, 'sm')}
        <strong style="font-weight: 600; color: var(--text-main);">${escapeHTML(m.name)}</strong>
      </span>
      <button class="btn-icon-only danger" onclick="deleteMember('${m.id}')" title="Xóa thành viên" ${state.members.length <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `).join('');
}

function deleteMember(memberId) {
  if (state.members.length <= 1) {
    showToast('Phải giữ lại ít nhất 1 thành viên.', 'danger');
    return;
  }
  const m = state.members.find(x => x.id === memberId);
  if (!m) return;

  if (!state.deletedMembers) state.deletedMembers = [];
  if (m.email) state.deletedMembers.push(m.email.toLowerCase().trim());

  state.members = state.members.filter(x => x.id !== memberId);
  
  const fallbackMemId = state.members[0]?.id || 'm1';
  state.articles.forEach(a => { if (a.memberId === memberId) a.memberId = fallbackMemId; });
  state.backlinks.forEach(b => { if (b.memberId === memberId) b.memberId = fallbackMemId; });
  state.backlinkBlogger.forEach(b => { if (b.memberId === memberId) b.memberId = fallbackMemId; });
  state.syntax.forEach(s => { if (s.memberId === memberId) s.memberId = fallbackMemId; });

  if (state.googleSyntaxMap && state.googleSyntaxMap[memberId]) delete state.googleSyntaxMap[memberId];
  if (state.backlinkSyntaxMap && state.backlinkSyntaxMap[memberId]) delete state.backlinkSyntaxMap[memberId];

  Object.keys(state.activeMemberFilter).forEach(k => {
    if (state.activeMemberFilter[k] === memberId) {
      state.activeMemberFilter[k] = 'all';
    }
  });

  saveDataToStorage();

  if (typeof db !== 'undefined' && db) {
    db.collection('app_settings').doc('members').set({ list: state.members, deleted: state.deletedMembers })
      .catch(err => console.log('Sync members delete error:', err.message));
  }

  renderExistingMembersList();
  renderSubmenus();
  renderMemberSelectOptions();
  renderAllViews();
  showToast(`Đã xóa thành viên ${m.name}.`, 'danger');
}

function saveNewMember(e) {
  e.preventDefault();
  const nameInput = document.getElementById('new-member-name-input');
  const name = nameInput.value.trim();
  if (!name) return;

  const newMember = {
    id: 'm_' + Date.now(),
    name: name
  };

  state.members.push(newMember);
  saveDataToStorage();
  renderExistingMembersList();
  renderSubmenus();
  renderMemberSelectOptions();
  renderAllViews();
  nameInput.value = `Thành viên ${state.members.length + 1}`;
  showToast(`Đã thêm ${name} thành công!`, 'success');
}

// Navigation & View Controller
function switchView(viewName) {
  state.activeView = viewName;

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `view-${viewName}`);
  });

  const activeMem = state.activeMemberFilter[viewName];
  const memLabel = (activeMem && activeMem !== 'all') ? ` - ${getMemberName(activeMem)}` : '';

  const titleMap = {
    overview: { title: 'TỔNG QUAN DASHBOARD' },
    prompts: { title: 'PROMPT' },
    articles: { title: `BÀI VIẾT${memLabel.toUpperCase()}` },
    backlinks: { title: `BACKLINK${memLabel.toUpperCase()}` },
    backlinkBlogger: { title: `BACKLINK BLOGGER${memLabel.toUpperCase()}` },
    syntax: { title: `CÚ PHÁP${memLabel.toUpperCase()}` }
  };

  if (titleMap[viewName]) {
    document.getElementById('page-title').textContent = titleMap[viewName].title;
  }

  renderAllViews();
}

function toggleSubmenu(viewName) {
  const btn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  const navGroup = btn ? btn.closest('.nav-group') : null;
  if (!navGroup) return;

  const isOpen = navGroup.classList.contains('open');
  document.querySelectorAll('.nav-group').forEach(g => g.classList.remove('open'));

  if (!isOpen) {
    navGroup.classList.add('open');
  }

  state.activeMemberFilter[viewName] = 'all';
  renderSubmenus();

  const selectIdMap = { articles: 'article-member-filter', backlinks: 'backlink-member-filter', backlinkBlogger: 'backlinkBlogger-member-filter', syntax: 'syntax-member-filter' };
  const selectEl = document.getElementById(selectIdMap[viewName]);
  if (selectEl) selectEl.value = 'all';

  switchView(viewName);
}

function filterByMember(viewName, memberId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  state.activeMemberFilter[viewName] = memberId;
  if (!state.activeCategoryFilter || typeof state.activeCategoryFilter !== 'object') {
    state.activeCategoryFilter = { articles: 'all', backlinks: 'all', backlinkBlogger: 'all', syntax: 'all' };
  }
  state.activeCategoryFilter[viewName] = 'all';

  const catSelect = document.getElementById(`${viewName}-category-filter`);
  if (catSelect) catSelect.value = 'all';

  renderSubmenus();

  const selectIdMap = { articles: 'article-member-filter', backlinks: 'backlink-member-filter', backlinkBlogger: 'backlinkBlogger-member-filter', syntax: 'syntax-member-filter' };
  const selectEl = document.getElementById(selectIdMap[viewName]);
  if (selectEl) selectEl.value = memberId;

  const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (navItem) {
    const navGroup = navItem.closest('.nav-group');
    if (navGroup) navGroup.classList.add('open');
  }

  switchView(viewName);
}

function handleMemberFilterSelect(viewName, memberId) {
  state.activeMemberFilter[viewName] = memberId;
  if (!state.activeCategoryFilter || typeof state.activeCategoryFilter !== 'object') {
    state.activeCategoryFilter = { articles: 'all', backlinks: 'all', backlinkBlogger: 'all', syntax: 'all' };
  }
  state.activeCategoryFilter[viewName] = 'all';

  const catSelect = document.getElementById(`${viewName}-category-filter`);
  if (catSelect) catSelect.value = 'all';

  renderSubmenus();
  switchView(viewName);
}

function renderAllViews() {
  renderOverviewView();
  renderPromptsView();
  renderArticlesView();
  renderBacklinksView();
  renderBacklinkBloggerView();
  renderSyntaxView();
}

function toggleSidebarMobile() {
  document.getElementById('app-sidebar').classList.toggle('open');
}

/* ==========================================================================
   1. OVERVIEW VIEW RENDERER
   ========================================================================== */
function renderOverviewView() {
  // 1. KPI COUNTS FOR ALL 5 MODULES
  const promptsFavCount = state.prompts.filter(p => p.favorite).length;
  const kpiPromptsCountEl = document.getElementById('kpi-prompts-count');
  if (kpiPromptsCountEl) kpiPromptsCountEl.textContent = state.prompts.length;
  const kpiPromptsFavEl = document.getElementById('kpi-prompts-fav');
  if (kpiPromptsFavEl) kpiPromptsFavEl.textContent = promptsFavCount;

  const articlesPubCount = state.articles.filter(a => a.status === 'Published').length;
  const kpiArticlesCountEl = document.getElementById('kpi-articles-count');
  if (kpiArticlesCountEl) kpiArticlesCountEl.textContent = state.articles.length;
  const kpiArticlesPubEl = document.getElementById('kpi-articles-pub');
  if (kpiArticlesPubEl) kpiArticlesPubEl.textContent = articlesPubCount;

  const totalBacklinksCount = state.backlinks.reduce((acc, b) => acc + ((b.backlinks && b.backlinks.length > 0) ? b.backlinks.length : 1), 0);
  const kpiBacklinksCountEl = document.getElementById('kpi-backlinks-count');
  if (kpiBacklinksCountEl) kpiBacklinksCountEl.textContent = state.backlinks.length;
  const kpiBacklinksLiveEl = document.getElementById('kpi-backlinks-live');
  if (kpiBacklinksLiveEl) kpiBacklinksLiveEl.textContent = totalBacklinksCount;

  const totalBloggerItems = state.backlinkBlogger.reduce((acc, b) => acc + ((b.items && b.items.length > 0) ? b.items.length : 1), 0);
  const kpiBloggerCountEl = document.getElementById('kpi-blogger-count');
  if (kpiBloggerCountEl) kpiBloggerCountEl.textContent = state.backlinkBlogger.length;
  const kpiBloggerItemsEl = document.getElementById('kpi-blogger-items');
  if (kpiBloggerItemsEl) kpiBloggerItemsEl.textContent = totalBloggerItems;

  const totalSyntaxLines = state.syntax.reduce((acc, s) => acc + ((s.syntaxes && s.syntaxes.length > 0) ? s.syntaxes.length : 1), 0);
  const kpiSyntaxCountEl = document.getElementById('kpi-syntax-count');
  if (kpiSyntaxCountEl) kpiSyntaxCountEl.textContent = state.syntax.length;
  const kpiSyntaxItemsEl = document.getElementById('kpi-syntax-items');
  if (kpiSyntaxItemsEl) kpiSyntaxItemsEl.textContent = totalSyntaxLines;

  // 2. REPORT 1: BÀI VIẾT THEO PHÂN KHU
  const artCats = (state.articleCategories && state.articleCategories.length > 0)
    ? state.articleCategories
    : ['Dịch vụ SEO', 'Kiến thức SEO', 'Hướng dẫn WordPress', 'Tin tức Marketing'];
  const totalArts = state.articles.length || 1;
  const fillClasses = ['fill-writing', 'fill-published', 'fill-review', 'fill-idea'];

  const artCatHTML = artCats.map((c, idx) => {
    const count = state.articles.filter(a => a.category === c).length;
    const perc = Math.round((count / totalArts) * 100);
    const fillClass = fillClasses[idx % fillClasses.length];
    return `
      <div class="progress-item-bar">
        <div class="progress-label-row">
          <span>${escapeHTML(c)}</span>
          <span><strong>${count}</strong> bài (${perc}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${fillClass}" style="width: ${perc}%"></div>
        </div>
      </div>
    `;
  }).join('');
  const overviewArtCatEl = document.getElementById('overview-article-progress');
  if (overviewArtCatEl) overviewArtCatEl.innerHTML = artCatHTML;

  // 3. REPORT 2: PHÂN BỔ BACKLINK & BLOGGER THEO PHÂN KHU
  const blCats = (state.backlinkCategories && state.backlinkCategories.length > 0)
    ? state.backlinkCategories
    : ['SEO Offpage', 'Web 2.0', 'PBN Network', 'Social Profile'];
  const palette = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  const backlinkHTML = blCats.map((c, idx) => {
    const countBL = state.backlinks.filter(b => b.category === c).length;
    const countBlogger = state.backlinkBlogger.filter(b => b.category === c).length;
    const totalCatCount = countBL + countBlogger;
    return `
      <div class="distribution-item">
        <div class="distribution-item-title">
          <div class="dot-indicator" style="background-color: ${palette[idx % palette.length]}"></div>
          <span>${escapeHTML(c)}</span>
        </div>
        <strong>${totalCatCount} nguồn</strong>
      </div>
    `;
  }).join('');
  const overviewBacklinkTypesEl = document.getElementById('overview-backlink-types');
  if (overviewBacklinkTypesEl) overviewBacklinkTypesEl.innerHTML = backlinkHTML;

  // 4. REPORT 3: CÚ PHÁP THEO THÀNH VIÊN
  const overviewMemberSyntaxEl = document.getElementById('overview-member-syntax');
  if (overviewMemberSyntaxEl) {
    const memberSyntaxHTML = state.members.map(m => {
      const count = state.syntax.filter(s => s.memberId === m.id).length;
      return `
        <div class="distribution-item">
          <div class="distribution-item-title">
            ${getMemberBadgeHTML(m.id)}
          </div>
          <strong>${count} mục</strong>
        </div>
      `;
    }).join('');
    overviewMemberSyntaxEl.innerHTML = memberSyntaxHTML;
  }

  // 5. REALTIME MEMBER ACTIVITY TABLE
  const activityTbody = document.getElementById('overview-activity-table-body');
  if (activityTbody) {
    const list = state.activities || [];
    
    if (list.length === 0) {
      activityTbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center;"><code>CHƯA CÓ HOẠT ĐỘNG NÀO</code></td></tr>`;
    } else {
      const getActionBadgeHTML = (action) => {
        const actionMap = {
          'Đăng Nhập': { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)', icon: 'ri-user-shared-line' },
          'Tạo Bài Viết': { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.25)', icon: 'ri-article-line' },
          'Sửa Bài Viết': { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.25)', icon: 'ri-edit-line' },
          'Xóa Bài Viết': { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', icon: 'ri-delete-bin-line' },
          'Tạo Prompt': { bg: 'rgba(147, 51, 234, 0.12)', color: '#9333ea', border: 'rgba(147, 51, 234, 0.25)', icon: 'ri-magic-line' },
          'Sửa Prompt': { bg: 'rgba(147, 51, 234, 0.12)', color: '#9333ea', border: 'rgba(147, 51, 234, 0.25)', icon: 'ri-edit-line' },
          'Xóa Prompt': { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', icon: 'ri-delete-bin-line' },
          'Thêm Backlink': { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)', icon: 'ri-link' },
          'Sửa Backlink': { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)', icon: 'ri-edit-line' },
          'Xóa Backlink': { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', icon: 'ri-delete-bin-line' },
          'Đăng Blogger': { bg: 'rgba(244, 63, 94, 0.12)', color: '#e11d48', border: 'rgba(244, 63, 94, 0.25)', icon: 'ri-rss-line' },
          'Sửa Blogger': { bg: 'rgba(244, 63, 94, 0.12)', color: '#e11d48', border: 'rgba(244, 63, 94, 0.25)', icon: 'ri-edit-line' },
          'Xóa Blogger': { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', icon: 'ri-delete-bin-line' },
          'Lưu Cú Pháp': { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', icon: 'ri-save-line' },
          'Sửa Cú Pháp': { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', icon: 'ri-edit-line' },
          'Xuất Cú Pháp': { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', icon: 'ri-code-s-slash-line' },
          'Xóa Cú Pháp': { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', icon: 'ri-delete-bin-line' },
          'Thêm Phân Khu': { bg: 'rgba(20, 184, 166, 0.12)', color: '#0d9488', border: 'rgba(20, 184, 166, 0.25)', icon: 'ri-folder-add-line' },
          'Xóa Phân Khu': { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)', icon: 'ri-delete-bin-line' },
          'Lưu Ghi Chú': { bg: 'rgba(168, 85, 247, 0.12)', color: '#9333ea', border: 'rgba(168, 85, 247, 0.25)', icon: 'ri-sticky-note-line' }
        };
        const style = actionMap[action] || { bg: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5', border: 'rgba(99, 102, 241, 0.25)', icon: 'ri-checkbox-circle-line' };

        return `<span style="background: ${style.bg}; color: ${style.color}; border: 1px solid ${style.border}; font-weight: 600; font-size: 11.5px; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px;">
          <i class="${style.icon}" style="font-size: 12px;"></i> ${escapeHTML(action)}
        </span>`;
      };

      activityTbody.innerHTML = list.slice(0, 10).map(act => {
        const actionBadge = getActionBadgeHTML(act.action);
        const moduleBadge = `<span style="background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 6px;">${escapeHTML(act.module || 'Hệ thống')}</span>`;

        return `
          <tr>
            <td style="vertical-align: middle; white-space: nowrap;">${getMemberBadgeHTML(act.memberId)}</td>
            <td style="vertical-align: middle; white-space: nowrap;">${actionBadge}</td>
            <td style="vertical-align: middle; white-space: nowrap;">${moduleBadge}</td>
            <td class="text-right" style="vertical-align: middle; white-space: nowrap;"><small class="text-muted" style="font-weight: 600;">${escapeHTML(act.timestamp)}</small></td>
          </tr>
        `;
      }).join('');
    }
  }
}

function cleanupExpiredActivities() {
  if (!state.activities || state.activities.length === 0) return;
  const now = Date.now();
  const valid = [];
  let changed = false;

  state.activities.forEach(act => {
    const age = now - (act.createdAt || 0);
    if (age >= 10000) {
      changed = true;
      deleteItemFromFirebase('activities', act.id);
    } else {
      valid.push(act);
    }
  });

  if (changed) {
    state.activities = valid;
    localStorage.setItem('taskflow_activities', JSON.stringify(state.activities));
    if (state.activeView === 'overview') {
      renderOverviewView();
    }
  }
}

function logMemberActivity(memberId, action, detail, moduleName) {
  cleanupExpiredActivities();
  if (!state.activities) state.activities = [];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  const currentMemId = memberId || (state.currentUser ? state.currentUser.memberId : 'm1');

  const actItem = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    memberId: currentMemId,
    action,
    detail,
    module: moduleName,
    timestamp: timeStr,
    createdAt: Date.now()
  };

  state.activities.unshift(actItem);
  saveDataToStorage();

  if (typeof db !== 'undefined' && db) {
    syncItemToFirebase('activities', actItem);
  }

  if (state.activeView === 'overview') {
    renderOverviewView();
  }

  // Tự động giải phóng khỏi bộ nhớ & Firestore đúng 10s sau khi phát sinh
  setTimeout(() => {
    cleanupExpiredActivities();
  }, 10100);
}

/* ==========================================================================
   2. PROMPTS VIEW RENDERER (No Tags, Dynamic Category Filter)
   ========================================================================== */
function renderPromptsView() {
  const searchQuery = document.getElementById('prompt-search')?.value.toLowerCase().trim() || '';

  const filtered = state.prompts.filter(p => {
    const matchSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery) ||
      p.content.toLowerCase().includes(searchQuery);
    return matchSearch;
  });

  const container = document.getElementById('prompts-container');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center;"><code>CHƯA CÓ PROMPT NÀO</code></div>`;
    return;
  }

  container.innerHTML = filtered.map(p => {
    return `
      <div class="prompt-card">
        <div>
          <div class="prompt-header">
            <div class="prompt-title-wrap">
              <h3>${escapeHTML(p.title)}</h3>
              ${getCategoryBadgeHTML(p.category)}
            </div>
            <button class="btn-star ${p.favorite ? 'starred' : ''}" onclick="toggleStarPrompt('${p.id}')" title="Yêu thích">
              <i class="${p.favorite ? 'ri-star-fill' : 'ri-star-line'}"></i>
            </button>
          </div>
          <div class="prompt-code-preview" style="max-height: 120px;">${escapeHTML(p.content)}</div>
        </div>

        <div class="prompt-footer">
          <button class="btn btn-primary btn-copy-prompt" onclick="openUsePromptModal('${p.id}')">
            Sao chép
          </button>
          <div class="action-btns">
            <button class="btn-icon-only" onclick="editPrompt('${p.id}')" title="Chỉnh sửa">
              <i class="ri-edit-line"></i>
            </button>
            <button class="btn-icon-only danger" onclick="deletePrompt('${p.id}')" title="Xóa">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Open Create Modals with Draft Restoration & Locked Auto Member Pre-selection
function openCreatePromptModal() {
  document.getElementById('modal-prompt-title').textContent = 'THÊM PROMPT AI MỚI';
  const hiddenId = document.getElementById('prompt-id');
  if (hiddenId && hiddenId.value) {
    document.getElementById('form-prompt').reset();
    hiddenId.value = '';
  }
  restoreFormDraft('form-prompt');
  openModal('modal-prompt');
}

// Use Prompt & Fill Variable Modal Logic
function openUsePromptModal(id) {
  const p = state.prompts.find(x => x.id === id);
  if (!p) return;

  state.activeUsedPromptId = id;
  document.getElementById('use-prompt-title').textContent = p.title;

  const regex = /\{([^}]+)\}/g;
  const matches = [...new Set([...p.content.matchAll(regex)].map(m => m[1]))];

  const varsContainer = document.getElementById('use-prompt-vars-container');
  if (matches.length > 0) {
    varsContainer.style.display = 'block';
    varsContainer.innerHTML = `
      <p style="font-size: 12px; font-weight: 600; margin-bottom: 10px; color: var(--text-muted);">
        Nhập giá trị các biến số trong prompt:
      </p>
      ${matches.map((v, idx) => {
        const parts = v.split(':');
        const varName = parts[0];
        const defaultVal = parts[1] || '';
        return `
          <div class="form-group" style="margin-bottom: 10px;">
            <label style="text-transform: capitalize;">Biến {${varName}}:</label>
            <input type="text" class="form-input prompt-var-input" data-var="${varName}" value="${defaultVal}" placeholder="Nhập ${varName}..." oninput="updatePromptResult()">
          </div>
        `;
      }).join('')}
    `;
  } else {
    varsContainer.style.display = 'none';
  }

  updatePromptResult();
  openModal('modal-use-prompt');
}

function updatePromptResult() {
  const p = state.prompts.find(x => x.id === state.activeUsedPromptId);
  if (!p) return;

  let result = p.content;
  const varInputs = document.querySelectorAll('.prompt-var-input');
  varInputs.forEach(input => {
    const vName = input.dataset.var;
    const val = input.value || `{${vName}}`;
    const regex = new RegExp(`\\{${vName}(?::[^}]*)?\\}`, 'g');
    result = result.replace(regex, val);
  });

  document.getElementById('use-prompt-result').value = result;
}

function copyUsedPrompt() {
  const txt = document.getElementById('use-prompt-result').value;
  copyTextDirectly(txt);
  closeModal('modal-use-prompt');
}

function toggleStarPrompt(id) {
  const p = state.prompts.find(x => x.id === id);
  if (p) {
    p.favorite = !p.favorite;
    saveDataToStorage();
    renderPromptsView();
    renderOverviewView();
  }
}

function savePrompt(e) {
  e.preventDefault();
  if (e.target.dataset.submitting === 'true') return;
  e.target.dataset.submitting = 'true';
  setTimeout(() => { delete e.target.dataset.submitting; }, 1000);

  const id = document.getElementById('prompt-id').value;
  const title = document.getElementById('prompt-title-input').value.trim();
  const category = document.getElementById('prompt-category-input').value.trim() || 'Tổng hợp';
  const content = document.getElementById('prompt-content-input').value.trim();

  if (id) {
    const index = state.prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      state.prompts[index] = { ...state.prompts[index], title, category, content };
    }
  } else {
    const newP = {
      id: 'p_' + Date.now(),
      title, category, content,
      favorite: false
    };
    state.prompts.unshift(newP);
  }

  const itemObj = id ? state.prompts.find(p => p.id === id) : state.prompts[0];
  saveDataToStorage();
  if (itemObj) syncItemToFirebase('prompts', itemObj);
  const currentMemId = state.currentUser ? state.currentUser.memberId : 'm1';
  logMemberActivity(currentMemId, id ? 'Sửa Prompt' : 'Tạo Prompt', title, 'Prompt');
  clearFormAndDraft('form-prompt');
  closeModal('modal-prompt');
  renderPromptCategoryFilterOptions();
  renderPromptsView();
  renderOverviewView();
  showToast('Đã lưu Prompt thành công!', 'success');
}

function editPrompt(id) {
  const p = state.prompts.find(x => x.id === id);
  if (!p) return;

  document.getElementById('modal-prompt-title').textContent = 'CHỈNH SỬA PROMPT';
  document.getElementById('prompt-id').value = p.id;
  document.getElementById('prompt-title-input').value = p.title;
  document.getElementById('prompt-category-input').value = p.category;
  document.getElementById('prompt-content-input').value = p.content;

  openModal('modal-prompt');
}

function deletePrompt(id) {
  showConfirmModal(
    'XÁC NHẬN',
    'Bạn có chắc chắn muốn xóa Prompt này không?',
    () => {
      const p = state.prompts.find(x => x.id === id);
      state.prompts = state.prompts.filter(x => x.id !== id);
      deleteItemFromFirebase('prompts', id);
      const currentMemId = state.currentUser ? state.currentUser.memberId : 'm1';
      logMemberActivity(currentMemId, 'Xóa Prompt', p ? p.title : '', 'Prompt');
      saveDataToStorage();
      renderPromptCategoryFilterOptions();
      renderPromptsView();
      renderOverviewView();
      showToast('Đã xóa Prompt.', 'danger');
    }
  );
}


/* ==========================================================================
   3. ARTICLES (BÀI VIẾT) VIEW RENDERER
   ========================================================================== */
function renderArticlesView() {
  const memFilter = state.activeMemberFilter.articles;
  const catSelect = document.getElementById('article-category-filter');
  const catFilter = (memFilter === 'all' && catSelect) ? ((state.activeCategoryFilter && state.activeCategoryFilter.articles) || 'all') : 'all';
  const searchQuery = document.getElementById('article-search')?.value.toLowerCase().trim() || '';

  const filterSelect = document.getElementById('article-member-filter');
  const searchWrap = document.getElementById('article-search')?.closest('.search-input-wrap');
  const createBtn = document.getElementById('btn-create-article');
  const noteBtn = document.getElementById('btn-note-article');

  if (noteBtn) noteBtn.style.display = 'inline-flex';

  if (memFilter !== 'all') {
    if (filterSelect) filterSelect.style.display = 'none';
    if (catSelect) catSelect.style.display = 'none';
    if (searchWrap) searchWrap.style.display = 'none';
    if (createBtn) createBtn.style.display = 'inline-flex';
    
    const activeMem = memFilter;
    const noteKey = `taskflow_note_articles_${activeMem}`;
    const hasNote = !!(localStorage.getItem(noteKey) || '').trim();
    const dot = document.getElementById('btn-note-article-dot');
    if (dot) dot.style.display = hasNote ? 'inline-block' : 'none';
  } else {
    if (filterSelect) filterSelect.style.display = 'inline-block';
    if (catSelect) catSelect.style.display = 'inline-block';
    if (searchWrap) searchWrap.style.display = 'block';
    if (createBtn) createBtn.style.display = 'none';
    if (noteBtn) {
      noteBtn.style.display = 'inline-flex';
      const activeMem = state.currentUser ? state.currentUser.memberId : 'm1';
      const noteKey = `taskflow_note_articles_${activeMem}`;
      const hasNote = !!(localStorage.getItem(noteKey) || '').trim();
      const dot = document.getElementById('btn-note-article-dot');
      if (dot) dot.style.display = hasNote ? 'inline-block' : 'none';
    }
  }

  const filtered = state.articles.filter(a => {
    const matchMember = memFilter === 'all' || a.memberId === memFilter;
    const matchCat = catFilter === 'all' || a.category === catFilter;
    const matchSearch = memFilter !== 'all' || !searchQuery ||
      a.title.toLowerCase().includes(searchQuery) ||
      a.primaryKeyword.toLowerCase().includes(searchQuery) ||
      a.category.toLowerCase().includes(searchQuery);
    return matchMember && matchCat && matchSearch;
  });

  renderArticlesTable(filtered);
}

// Note modal state
let _noteModalContext = { section: null, memberId: null };

function openMemberNoteModal(section) {
  let memFilter = state.activeMemberFilter[section];
  if (!memFilter || memFilter === 'all') {
    memFilter = state.currentUser ? state.currentUser.memberId : (state.members[0]?.id || 'm1');
  }

  _noteModalContext = { section, memberId: memFilter };

  const memberName = getMemberName(memFilter);
  document.getElementById('modal-note-title').textContent = `GHI CHÚ — ${memberName.toUpperCase()}`;

  const noteKey = `taskflow_note_${section}_${memFilter}`;
  const noteArea = document.getElementById('modal-note-area');
  if (noteArea) noteArea.value = localStorage.getItem(noteKey) || '';

  openModal('modal-member-note');
}

function saveMemberNoteModal() {
  const { section, memberId } = _noteModalContext;
  if (!section || !memberId) return;

  const noteKey = `taskflow_note_${section}_${memberId}`;
  const noteArea = document.getElementById('modal-note-area');
  const val = noteArea ? noteArea.value : '';

  localStorage.setItem(noteKey, val);

  // Đồng bộ Note lên Cloud Firestore
  if (typeof db !== 'undefined' && db) {
    db.collection('notes').doc(noteKey).set({ key: noteKey, content: val, section, memberId }, { merge: true })
      .catch(err => console.log('Sync note error:', err.message));
  }

  // Update dot indicator — map section name to button dot ID
  const dotIdMap = {
    articles: 'btn-note-article-dot',
    backlinks: 'btn-note-backlinks-dot',
    backlinkBlogger: 'btn-note-backlinkBlogger-dot',
    syntax: 'btn-note-syntax-dot'
  };
  const dotId = dotIdMap[section];
  const dot = dotId ? document.getElementById(dotId) : null;
  if (dot) dot.style.display = val.trim() ? 'inline-block' : 'none';

  closeModal('modal-member-note');
  showToast('Đã lưu ghi chú!', 'success');
}

function closeMemberNoteModal() {
  closeModal('modal-member-note');
}

function renderArticlesKanban(articles) {
  const statuses = ['Idea', 'Writing', 'Review', 'Published'];

  statuses.forEach(st => {
    const colCards = articles.filter(a => a.status === st);
    document.getElementById(`count-${st.toLowerCase()}`).textContent = colCards.length;

    const colEl = document.getElementById(`kanban-col-${st}`);
    if (!colEl) return;

    colEl.innerHTML = colCards.map(a => `
      <div class="article-card">
        <div class="article-card-header">
          <span class="article-card-cat">${escapeHTML(a.category)}</span>
          ${getMemberBadgeHTML(a.memberId)}
        </div>
        <h4 class="article-card-title">${escapeHTML(a.title)}</h4>
        <div class="article-card-kw"><i class="ri-key-2-line"></i> ${escapeHTML(a.primaryKeyword)}</div>
        <div class="article-card-meta">
          <span><i class="ri-file-text-line"></i> ${a.wordCount} từ</span>
          <span class="seo-badge">SEO ${a.seoScore}/100</span>
        </div>
        <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <small class="text-muted"><i class="ri-calendar-line"></i> ${a.deadline || 'N/A'}</small>
          <div class="action-btns">
            <button class="btn-icon-only" onclick="editArticle('${a.id}')" title="Sửa"><i class="ri-edit-line"></i></button>
            <button class="btn-icon-only danger" onclick="deleteArticle('${a.id}')" title="Xóa"><i class="ri-delete-bin-line"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  });
}

function renderArticlesTable(articles) {
  const tbody = document.getElementById('articles-table-body');
  if (!tbody) return;

  if (articles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center;"><code>CHƯA CÓ BÀI VIẾT NÀO</code></td></tr>`;
    return;
  }

  tbody.innerHTML = articles.map(a => `
    <tr>
      <td><strong>${escapeHTML(a.title)}</strong></td>
      <td>${escapeHTML(a.category)}</td>
      <td><code>${escapeHTML(a.primaryKeyword)}</code></td>
      <td>
        ${a.publishedUrl 
          ? `<a href="${escapeHTML(a.publishedUrl)}" target="_blank" rel="noopener" style="color: var(--primary); font-weight:600; text-decoration:none;">
              ${escapeHTML(truncateUrl(a.publishedUrl))} <i class="ri-external-link-line" style="font-size:11px;"></i>
            </a>`
          : '<span class="text-muted">-</span>'
        }
      </td>
      <td>${getMemberBadgeHTML(a.memberId)}</td>
      <td class="text-right">
        <div class="action-btns" style="justify-content: flex-end;">
          <button class="btn-icon-only" onclick="editArticle('${a.id}')" title="Sửa"><i class="ri-edit-line"></i></button>
          <button class="btn-icon-only danger" onclick="deleteArticle('${a.id}')" title="Xóa"><i class="ri-delete-bin-line"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCreateArticleModal() {
  document.getElementById('modal-article-title').textContent = 'THÊM BÀI VIẾT MỚI';
  const hiddenId = document.getElementById('article-id');
  if (hiddenId && hiddenId.value) {
    document.getElementById('form-article').reset();
    hiddenId.value = '';
  }
  restoreFormDraft('form-article');
  populateCategoryOptions('articles');

  const activeMem = state.activeMemberFilter.articles;
  const selectEl = document.getElementById('article-member-input');
  if (selectEl) {
    if (activeMem && activeMem !== 'all') {
      selectEl.value = activeMem;
      selectEl.disabled = true;
    } else {
      selectEl.disabled = false;
      if (!selectEl.value) selectEl.value = state.members[0]?.id || 'm1';
    }
  }

  openModal('modal-article');
}

function saveArticle(e) {
  e.preventDefault();
  if (e.target.dataset.submitting === 'true') return;
  e.target.dataset.submitting = 'true';
  setTimeout(() => { delete e.target.dataset.submitting; }, 1000);

  const id = document.getElementById('article-id').value;
  const activeMem = state.activeMemberFilter.articles;
  let memberId = document.getElementById('article-member-input').value;
  if (activeMem && activeMem !== 'all') {
    memberId = activeMem;
  }

  const title = document.getElementById('article-title-input').value.trim();
  const category = document.getElementById('article-cat-input').value.trim();
  const primaryKeyword = document.getElementById('article-kw-input').value.trim();
  const publishedUrl = document.getElementById('article-url-input').value.trim();

  if (category && state.articleCategories && !state.articleCategories.includes(category)) {
    state.articleCategories.push(category);
    populateCategoryOptions('articles', category);
  }

  if (id) {
    const index = state.articles.findIndex(a => a.id === id);
    if (index !== -1) {
      state.articles[index] = { ...state.articles[index], memberId, title, category, primaryKeyword, publishedUrl };
    }
  } else {
    state.articles.unshift({
      id: 'a_' + Date.now(),
      memberId, title, category, primaryKeyword, publishedUrl, status: 'Published'
    });
  }

  const itemObj = id ? state.articles.find(a => a.id === id) : state.articles[0];
  saveDataToStorage();
  if (itemObj) syncItemToFirebase('articles', itemObj);
  logMemberActivity(memberId, id ? 'Sửa Bài Viết' : 'Tạo Bài Viết', title, 'Bài viết');
  clearFormAndDraft('form-article');
  closeModal('modal-article');
  renderArticlesView();
  renderOverviewView();
  showToast('Đã lưu bài viết thành công!', 'success');
}

function editArticle(id) {
  const a = state.articles.find(x => x.id === id);
  if (!a) return;

  const activeMem = state.activeMemberFilter.articles;
  const selectEl = document.getElementById('article-member-input');
  if (selectEl) {
    if (activeMem && activeMem !== 'all') {
      selectEl.value = activeMem;
      selectEl.disabled = true;
    } else {
      selectEl.value = a.memberId || 'm1';
      selectEl.disabled = false;
    }
  }

  document.getElementById('modal-article-title').textContent = 'CHỈNH SỬA BÀI VIẾT';
  document.getElementById('article-id').value = a.id;
  document.getElementById('article-title-input').value = a.title;

  populateCategoryOptions('articles', a.category);
  document.getElementById('article-kw-input').value = a.primaryKeyword;
  document.getElementById('article-url-input').value = a.publishedUrl || '';

  openModal('modal-article');
}

function deleteArticle(id) {
  showConfirmModal(
    'XÁC NHẬN',
    'Bạn có chắc chắn muốn xóa bài viết này không?',
    () => {
      const a = state.articles.find(x => x.id === id);
      state.articles = state.articles.filter(x => x.id !== id);
      deleteItemFromFirebase('articles', id);
      const currentMemId = state.currentUser ? state.currentUser.memberId : (a ? a.memberId : 'm1');
      logMemberActivity(currentMemId, 'Xóa Bài Viết', a ? a.title : '', 'Bài viết');
      saveDataToStorage();
      renderArticlesView();
      renderOverviewView();
      showToast('Đã xóa bài viết.', 'danger');
    }
  );
}


/* ==========================================================================
   4. BACKLINKS VIEW RENDERER
   ========================================================================== */
function renderBacklinksView() {
  const memFilter = state.activeMemberFilter.backlinks;
  const catSelect = document.getElementById('backlink-category-filter');
  const catFilter = (memFilter === 'all' && catSelect) ? ((state.activeCategoryFilter && state.activeCategoryFilter.backlinks) || 'all') : 'all';
  const searchQuery = document.getElementById('backlink-search')?.value.toLowerCase().trim() || '';

  const filterSelect = document.getElementById('backlink-member-filter');
  const searchWrap = document.getElementById('backlink-search')?.closest('.search-input-wrap');
  const createBtn = document.getElementById('btn-create-backlink');
  const noteBtn = document.getElementById('btn-note-backlinks');

  if (memFilter !== 'all') {
    if (filterSelect) filterSelect.style.display = 'none';
    if (catSelect) catSelect.style.display = 'none';
    if (searchWrap) searchWrap.style.display = 'none';
    if (createBtn) createBtn.style.display = 'inline-flex';
    if (noteBtn) {
      noteBtn.style.display = 'inline-flex';
      const activeMem = memFilter !== 'all' ? memFilter : (state.currentUser ? state.currentUser.memberId : 'm1');
      const hasNote = !!(localStorage.getItem(`taskflow_note_backlinks_${activeMem}`) || '').trim();
      const dot = document.getElementById('btn-note-backlinks-dot');
      if (dot) dot.style.display = hasNote ? 'inline-block' : 'none';
    }
  } else {
    if (filterSelect) filterSelect.style.display = 'inline-block';
    if (catSelect) catSelect.style.display = 'inline-block';
    if (searchWrap) searchWrap.style.display = 'block';
    if (createBtn) createBtn.style.display = 'none';
    if (noteBtn) {
      noteBtn.style.display = 'inline-flex';
      const activeMem = state.currentUser ? state.currentUser.memberId : 'm1';
      const hasNote = !!(localStorage.getItem(`taskflow_note_backlinks_${activeMem}`) || '').trim();
      const dot = document.getElementById('btn-note-backlinks-dot');
      if (dot) dot.style.display = hasNote ? 'inline-block' : 'none';
    }
  }

  const filtered = state.backlinks.filter(b => {
    const matchMember = memFilter === 'all' || b.memberId === memFilter;
    const matchCat = catFilter === 'all' || b.category === catFilter;
    const matchSearch = memFilter !== 'all' || !searchQuery ||
      (b.primaryKeyword && b.primaryKeyword.toLowerCase().includes(searchQuery)) ||
      (b.targetUrl && b.targetUrl.toLowerCase().includes(searchQuery)) ||
      (b.category && b.category.toLowerCase().includes(searchQuery)) ||
      (b.backlinks && b.backlinks.some(u => u && u.toLowerCase().includes(searchQuery))) ||
      (b.sourceUrl && b.sourceUrl.toLowerCase().includes(searchQuery));
    return matchMember && matchCat && matchSearch;
  });

  const tbody = document.getElementById('backlinks-table-body');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center;"><code>CHƯA CÓ BACKLINK NÀO</code></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const list = (b.backlinks && b.backlinks.length > 0)
      ? b.backlinks.filter(u => u && u.trim())
      : (b.sourceUrl ? [b.sourceUrl] : []);

    const backlinksHTML = list.length > 0
      ? list.map(u => `
          <div class="blogger-pair-item">
            <a href="${escapeHTML(u)}" target="_blank" rel="noopener" style="color: var(--text-main); font-weight:600; text-decoration:none; word-break: break-all;">
              ${escapeHTML(truncateUrl(u))} <i class="ri-external-link-line" style="font-size:11px;"></i>
            </a>
          </div>
        `).join('')
      : '<span class="text-muted">-</span>';

    return `
      <tr>
        <td style="vertical-align: middle;">
          ${b.category ? `<span style="font-size:12px; font-weight:600; color:var(--primary);">${escapeHTML(b.category)}</span>` : '<span class="text-muted">-</span>'}
        </td>
        <td style="vertical-align: middle;"><code>${escapeHTML(b.primaryKeyword || b.anchorText || '-')}</code></td>
        <td style="vertical-align: middle;">
          ${b.targetUrl 
            ? `<a href="${escapeHTML(b.targetUrl)}" target="_blank" rel="noopener" style="color: var(--primary); font-weight:500; font-size:12px; text-decoration:none;">
                ${escapeHTML(truncateUrl(b.targetUrl))} <i class="ri-external-link-line" style="font-size:10px;"></i>
              </a>`
            : '<span class="text-muted">-</span>'
          }
        </td>
        <td style="vertical-align: top;">${backlinksHTML}</td>
        <td style="vertical-align: middle; white-space: nowrap;">${getMemberBadgeHTML(b.memberId)}</td>
        <td class="text-right" style="vertical-align: middle;">
          <div class="action-btns" style="justify-content: flex-end;">
            <button class="btn-icon-only" onclick="editBacklink('${b.id}')" title="Sửa"><i class="ri-edit-line"></i></button>
            <button class="btn-icon-only danger" onclick="deleteBacklink('${b.id}')" title="Xóa"><i class="ri-delete-bin-line"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateBacklinkModal() {
  document.getElementById('modal-backlink-title').textContent = 'THÊM BACKLINK MỚI';
  const hiddenId = document.getElementById('backlink-id');
  if (hiddenId && hiddenId.value) {
    document.getElementById('form-backlink').reset();
    hiddenId.value = '';
  }
  restoreFormDraft('form-backlink');
  populateCategoryOptions('backlinks');

  const activeMem = state.activeMemberFilter.backlinks;
  const selectEl = document.getElementById('backlink-member-input');
  if (selectEl) {
    if (activeMem && activeMem !== 'all') {
      selectEl.value = activeMem;
      selectEl.disabled = true;
    } else {
      selectEl.disabled = false;
      if (!selectEl.value) selectEl.value = state.members[0]?.id || 'm1';
    }
  }

  openModal('modal-backlink');
}

function saveBacklink(e) {
  e.preventDefault();
  if (e.target.dataset.submitting === 'true') return;
  e.target.dataset.submitting = 'true';
  setTimeout(() => { delete e.target.dataset.submitting; }, 1000);

  const id = document.getElementById('backlink-id').value;
  const activeMem = state.activeMemberFilter.backlinks;
  let memberId = document.getElementById('backlink-member-input').value;
  if (activeMem && activeMem !== 'all') {
    memberId = activeMem;
  }

  const category = document.getElementById('backlink-cat-input')?.value.trim() || '';
  const primaryKeyword = document.getElementById('backlink-kw-input')?.value.trim() || '';
  const targetUrl = document.getElementById('backlink-target-input')?.value.trim() || '';

  if (category && state.backlinkCategories && !state.backlinkCategories.includes(category)) {
    state.backlinkCategories.push(category);
    populateCategoryOptions('backlinks', category);
  }

  const source1 = document.getElementById('backlink-source1-input')?.value.trim() || '';
  const source2 = document.getElementById('backlink-source2-input')?.value.trim() || '';
  const source3 = document.getElementById('backlink-source3-input')?.value.trim() || '';

  const backlinks = [source1, source2, source3].filter(Boolean);

  if (id) {
    const idx = state.backlinks.findIndex(b => b.id === id);
    if (idx !== -1) {
      state.backlinks[idx] = { ...state.backlinks[idx], memberId, category, primaryKeyword, targetUrl, backlinks };
    }
  } else {
    state.backlinks.unshift({
      id: 'b_' + Date.now(),
      memberId, category, primaryKeyword, targetUrl, backlinks
    });
  }

  const itemObj = id ? state.backlinks.find(b => b.id === id) : state.backlinks[0];
  saveDataToStorage();
  if (itemObj) syncItemToFirebase('backlinks', itemObj);
  const currentMemId = state.currentUser ? state.currentUser.memberId : memberId;
  logMemberActivity(currentMemId, id ? 'Sửa Backlink' : 'Thêm Backlink', primaryKeyword, 'Backlink');
  closeModal('modal-backlink');
  renderBacklinksView();
  renderOverviewView();
  showToast('Đã lưu Backlink thành công!', 'success');
}

function editBacklink(id) {
  const b = state.backlinks.find(x => x.id === id);
  if (!b) return;

  const activeMem = state.activeMemberFilter.backlinks;
  const selectEl = document.getElementById('backlink-member-input');
  if (selectEl) {
    if (activeMem && activeMem !== 'all') {
      selectEl.value = activeMem;
      selectEl.disabled = true;
    } else {
      selectEl.value = b.memberId || 'm1';
      selectEl.disabled = false;
    }
  }

  document.getElementById('modal-backlink-title').textContent = 'CHỈNH SỬA BACKLINK';
  document.getElementById('backlink-id').value = b.id;

  populateCategoryOptions('backlinks', b.category);

  document.getElementById('backlink-kw-input').value = b.primaryKeyword || b.anchorText || '';
  document.getElementById('backlink-target-input').value = b.targetUrl || '';

  const backlinks = (b.backlinks && b.backlinks.length > 0)
    ? b.backlinks
    : (b.sourceUrl ? [b.sourceUrl] : []);

  document.getElementById('backlink-source1-input').value = backlinks[0] || '';
  document.getElementById('backlink-source2-input').value = backlinks[1] || '';
  document.getElementById('backlink-source3-input').value = backlinks[2] || '';

  openModal('modal-backlink');
}

function deleteBacklink(id) {
  showConfirmModal(
    'XÁC NHẬN',
    'Bạn có chắc chắn muốn xóa backlink này không?',
    () => {
      const b = state.backlinks.find(x => x.id === id);
      state.backlinks = state.backlinks.filter(x => x.id !== id);
      deleteItemFromFirebase('backlinks', id);
      const currentMemId = state.currentUser ? state.currentUser.memberId : (b ? b.memberId : 'm1');
      logMemberActivity(currentMemId, 'Xóa Backlink', b ? (b.primaryKeyword || b.targetUrl || '') : '', 'Backlink');
      saveDataToStorage();
      renderBacklinksView();
      renderOverviewView();
      showToast('Đã xóa Backlink.', 'danger');
    }
  );
}


/* ==========================================================================
   4.5. BACKLINK BLOGGER VIEW RENDERER
   ========================================================================== */
function renderBacklinkBloggerView() {
  const memFilter = state.activeMemberFilter.backlinkBlogger;
  const catSelect = document.getElementById('backlinkBlogger-category-filter');
  const catFilter = (memFilter === 'all' && catSelect) ? ((state.activeCategoryFilter && state.activeCategoryFilter.backlinkBlogger) || 'all') : 'all';
  const searchQuery = document.getElementById('backlinkBlogger-search')?.value.toLowerCase().trim() || '';

  const filterSelect = document.getElementById('backlinkBlogger-member-filter');
  const searchWrap = document.getElementById('backlinkBlogger-search')?.closest('.search-input-wrap');
  const createBtn = document.getElementById('btn-create-backlinkBlogger');
  const noteBtn = document.getElementById('btn-note-backlinkBlogger');

  if (memFilter !== 'all') {
    if (filterSelect) filterSelect.style.display = 'none';
    if (catSelect) catSelect.style.display = 'none';
    if (searchWrap) searchWrap.style.display = 'none';
    if (createBtn) createBtn.style.display = 'inline-flex';
    if (noteBtn) {
      noteBtn.style.display = 'inline-flex';
      const activeMem = memFilter !== 'all' ? memFilter : (state.currentUser ? state.currentUser.memberId : 'm1');
      const hasNote = !!(localStorage.getItem(`taskflow_note_backlinkBlogger_${activeMem}`) || '').trim();
      const dot = document.getElementById('btn-note-backlinkBlogger-dot');
      if (dot) dot.style.display = hasNote ? 'inline-block' : 'none';
    }
  } else {
    if (filterSelect) filterSelect.style.display = 'inline-block';
    if (catSelect) catSelect.style.display = 'inline-block';
    if (searchWrap) searchWrap.style.display = 'block';
    if (createBtn) createBtn.style.display = 'none';
    if (noteBtn) {
      noteBtn.style.display = 'inline-flex';
      const activeMem = state.currentUser ? state.currentUser.memberId : 'm1';
      const hasNote = !!(localStorage.getItem(`taskflow_note_backlinkBlogger_${activeMem}`) || '').trim();
      const dot = document.getElementById('btn-note-backlinkBlogger-dot');
      if (dot) dot.style.display = hasNote ? 'inline-block' : 'none';
    }
  }

  const filtered = state.backlinkBlogger.filter(b => {
    const matchMember = memFilter === 'all' || b.memberId === memFilter;
    const matchCat = catFilter === 'all' || b.category === catFilter;
    const matchSearch = memFilter !== 'all' || !searchQuery ||
      (b.bloggerUrl && b.bloggerUrl.toLowerCase().includes(searchQuery)) ||
      (b.category && b.category.toLowerCase().includes(searchQuery)) ||
      (b.items && b.items.some(it => (it.kw && it.kw.toLowerCase().includes(searchQuery)) || (it.url && it.url.toLowerCase().includes(searchQuery))));
    return matchMember && matchCat && matchSearch;
  });

  const tbody = document.getElementById('backlinkBlogger-table-body');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center;"><code>CHƯA CÓ BACKLINK BLOGGER NÀO</code></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const validItems = (b.items || []).filter(it => (it.kw && it.kw.trim()) || (it.url && it.url.trim()));

    const keywordsHTML = validItems.length > 0
      ? validItems.map(it => `
          <div class="blogger-pair-item">
            <code>${escapeHTML(it.kw || '-')}</code>
          </div>
        `).join('')
      : '<span class="text-muted">-</span>';

    const targetsHTML = validItems.length > 0
      ? validItems.map(it => `
          <div class="blogger-pair-item">
            ${it.url ? `<a href="${escapeHTML(it.url)}" target="_blank" rel="noopener" style="color: var(--primary); font-weight:500; font-size: 12px; text-decoration:none; word-break: break-all;">
              ${escapeHTML(truncateUrl(it.url))} <i class="ri-external-link-line" style="font-size:10px;"></i>
            </a>` : '<span class="text-muted">-</span>'}
          </div>
        `).join('')
      : '<span class="text-muted">-</span>';

    return `
      <tr>
        <td style="vertical-align: middle;">
          <a href="${escapeHTML(b.bloggerUrl)}" target="_blank" rel="noopener" style="color: var(--text-main); font-weight:600; text-decoration:none;">
            ${escapeHTML(truncateUrl(b.bloggerUrl))} <i class="ri-external-link-line" style="font-size:11px;"></i>
          </a>
        </td>
        <td style="vertical-align: middle; white-space: nowrap;">
          ${b.category ? `<span style="font-size:12px; font-weight:600; color:var(--primary);">${escapeHTML(b.category)}</span>` : '<span class="text-muted">-</span>'}
        </td>
        <td style="vertical-align: top;">${keywordsHTML}</td>
        <td style="vertical-align: top;">${targetsHTML}</td>
        <td style="vertical-align: middle; white-space: nowrap;">${getMemberBadgeHTML(b.memberId)}</td>
        <td style="vertical-align: middle; white-space: nowrap;"><small class="text-muted" style="font-weight:600;">${formatDateVN(b.date)}</small></td>
        <td class="text-right" style="vertical-align: middle;">
          <div class="action-btns" style="justify-content: flex-end;">
            <button class="btn-icon-only" onclick="editBacklinkBlogger('${b.id}')" title="Sửa"><i class="ri-edit-line"></i></button>
            <button class="btn-icon-only danger" onclick="deleteBacklinkBlogger('${b.id}')" title="Xóa"><i class="ri-delete-bin-line"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateBacklinkBloggerModal() {
  document.getElementById('modal-backlinkBlogger-title').textContent = 'THÊM BACKLINK BLOGGER MỚI';
  const hiddenId = document.getElementById('backlinkBlogger-id');
  if (hiddenId && hiddenId.value) {
    document.getElementById('form-backlinkBlogger').reset();
    hiddenId.value = '';
  }
  restoreFormDraft('form-backlinkBlogger');
  populateCategoryOptions('backlinkBlogger');

  const dateInput = document.getElementById('backlinkBlogger-date-input');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const activeMem = state.activeMemberFilter.backlinkBlogger;
  const selectEl = document.getElementById('backlinkBlogger-member-input');
  if (selectEl) {
    if (activeMem && activeMem !== 'all') {
      selectEl.value = activeMem;
      selectEl.disabled = true;
    } else {
      selectEl.disabled = false;
      if (!selectEl.value) selectEl.value = state.members[0]?.id || 'm1';
    }
  }

  openModal('modal-backlinkBlogger');
}

function saveBacklinkBlogger(e) {
  e.preventDefault();
  if (e.target.dataset.submitting === 'true') return;
  e.target.dataset.submitting = 'true';
  setTimeout(() => { delete e.target.dataset.submitting; }, 1000);

  const id = document.getElementById('backlinkBlogger-id').value;
  const activeMem = state.activeMemberFilter.backlinkBlogger;
  let memberId = document.getElementById('backlinkBlogger-member-input').value;
  if (activeMem && activeMem !== 'all') {
    memberId = activeMem;
  }

  const bloggerUrl = document.getElementById('backlinkBlogger-blogger-url-input').value.trim();
  const date = document.getElementById('backlinkBlogger-date-input').value;
  const category = document.getElementById('backlinkBlogger-category-input').value.trim();

  if (category && state.backlinkBloggerCategories && !state.backlinkBloggerCategories.includes(category)) {
    state.backlinkBloggerCategories.push(category);
    populateCategoryOptions('backlinkBlogger', category);
  }

  const kw1 = document.getElementById('backlinkBlogger-kw1-input').value.trim();
  const target1 = document.getElementById('backlinkBlogger-target1-input').value.trim();

  const kw2 = document.getElementById('backlinkBlogger-kw2-input').value.trim();
  const target2 = document.getElementById('backlinkBlogger-target2-input').value.trim();

  const kw3 = document.getElementById('backlinkBlogger-kw3-input').value.trim();
  const target3 = document.getElementById('backlinkBlogger-target3-input').value.trim();

  const items = [
    { kw: kw1, url: target1 },
    { kw: kw2, url: target2 },
    { kw: kw3, url: target3 }
  ].filter(it => it.kw || it.url);

  if (id) {
    const idx = state.backlinkBlogger.findIndex(b => b.id === id);
    if (idx !== -1) {
      state.backlinkBlogger[idx] = { ...state.backlinkBlogger[idx], memberId, bloggerUrl, category, items, date };
    }
  } else {
    state.backlinkBlogger.unshift({
      id: 'bb_' + Date.now(),
      memberId, bloggerUrl, category, items, date
    });
  }

  const itemObj = id ? state.backlinkBlogger.find(b => b.id === id) : state.backlinkBlogger[0];
  saveDataToStorage();
  if (itemObj) syncItemToFirebase('backlinkBlogger', itemObj);
  logMemberActivity(memberId, id ? 'Sửa Blogger' : 'Đăng Blogger', bloggerUrl, 'Blogger');
  clearFormAndDraft('form-backlinkBlogger');
  closeModal('modal-backlinkBlogger');
  renderBacklinkBloggerView();
  showToast('Đã lưu Backlink Blogger thành công!', 'success');
}

function editBacklinkBlogger(id) {
  const b = state.backlinkBlogger.find(x => x.id === id);
  if (!b) return;

  const activeMem = state.activeMemberFilter.backlinkBlogger;
  const selectEl = document.getElementById('backlinkBlogger-member-input');
  if (selectEl) {
    selectEl.value = b.memberId || (activeMem !== 'all' ? activeMem : 'm1');
    selectEl.disabled = (activeMem && activeMem !== 'all');
  }

  document.getElementById('modal-backlinkBlogger-title').textContent = 'CHỈNH SỬA BACKLINK BLOGGER';
  document.getElementById('backlinkBlogger-id').value = b.id;
  document.getElementById('backlinkBlogger-blogger-url-input').value = b.bloggerUrl || '';
  document.getElementById('backlinkBlogger-date-input').value = b.date || '';

  populateCategoryOptions('backlinkBlogger', b.category);

  const items = b.items || [];
  document.getElementById('backlinkBlogger-kw1-input').value = items[0]?.kw || '';
  document.getElementById('backlinkBlogger-target1-input').value = items[0]?.url || '';

  document.getElementById('backlinkBlogger-kw2-input').value = items[1]?.kw || '';
  document.getElementById('backlinkBlogger-target2-input').value = items[1]?.url || '';

  document.getElementById('backlinkBlogger-kw3-input').value = items[2]?.kw || '';
  document.getElementById('backlinkBlogger-target3-input').value = items[2]?.url || '';

  openModal('modal-backlinkBlogger');
}

function deleteBacklinkBlogger(id) {
  showConfirmModal(
    'XÁC NHẬN',
    'Bạn có chắc chắn muốn xóa backlink Blogger này không?',
    () => {
      const b = state.backlinkBlogger.find(x => x.id === id);
      state.backlinkBlogger = state.backlinkBlogger.filter(x => x.id !== id);
      deleteItemFromFirebase('backlinkBlogger', id);
      const currentMemId = state.currentUser ? state.currentUser.memberId : (b ? b.memberId : 'm1');
      logMemberActivity(currentMemId, 'Xóa Blogger', b ? b.bloggerUrl : '', 'Blogger');
      saveDataToStorage();
      renderBacklinkBloggerView();
      showToast('Đã xóa Backlink Blogger.', 'danger');
    }
  );
}


/* ==========================================================================
   5. SYNTAX VIEW RENDERER (PER-MEMBER ISOLATION & DEDUPLICATION)
   ========================================================================== */

function getCurrentSyntaxMemberId() {
  const memFilter = state.activeMemberFilter.syntax;
  if (memFilter && memFilter !== 'all') {
    return memFilter;
  }
  return state.members[0]?.id || 'm1';
}

function getGoogleSyntaxListForActiveMember() {
  const memFilter = state.activeMemberFilter.syntax;
  if (!state.googleSyntaxMap) state.googleSyntaxMap = {};

  if (memFilter === 'all') {
    let combined = [];
    Object.values(state.googleSyntaxMap).forEach(list => {
      if (Array.isArray(list)) {
        list.forEach(item => {
          const trimmed = item.trim();
          if (trimmed && !combined.includes(trimmed)) {
            combined.push(trimmed);
          }
        });
      }
    });
    return combined;
  } else {
    const list = state.googleSyntaxMap[memFilter] || [];
    const uniqueList = [...new Set(list.map(i => i.trim()).filter(Boolean))];
    if (uniqueList.length !== list.length) {
      state.googleSyntaxMap[memFilter] = uniqueList;
      saveDataToStorage();
    }
    return uniqueList;
  }
}

function getBacklinkSyntaxListForActiveMember() {
  const memFilter = state.activeMemberFilter.syntax;
  if (!state.backlinkSyntaxMap) state.backlinkSyntaxMap = {};

  if (memFilter === 'all') {
    let combined = [];
    Object.values(state.backlinkSyntaxMap).forEach(list => {
      if (Array.isArray(list)) {
        list.forEach(item => {
          const trimmed = item.trim();
          if (trimmed && !combined.includes(trimmed)) {
            combined.push(trimmed);
          }
        });
      }
    });
    return combined;
  } else {
    const list = state.backlinkSyntaxMap[memFilter] || [];
    const uniqueList = [...new Set(list.map(i => i.trim()).filter(Boolean))];
    if (uniqueList.length !== list.length) {
      state.backlinkSyntaxMap[memFilter] = uniqueList;
      saveDataToStorage();
    }
    return uniqueList;
  }
}

function previewGoogleSyntax() {
  const el = document.getElementById('gen-google-preview');
  if (!el) return;
  const kw = document.getElementById('gen-google-kw')?.value.trim() || '';
  const domain = document.getElementById('gen-google-domain')?.value.trim() || '';
  el.textContent = `https://www.google.com/ ###${kw}${domain ? ', ' + domain : ''}!!!`;
}

function addGoogleSyntaxItem() {
  const kwInput = document.getElementById('gen-google-kw');
  const domainInput = document.getElementById('gen-google-domain');
  const kw = kwInput?.value.trim() || '';
  const domain = domainInput?.value.trim() || '';

  if (!kw) {
    showToast('Vui lòng nhập từ khóa chính!', 'danger');
    return;
  }

  const newSyntax = `https://www.google.com/ ###${kw}${domain ? ', ' + domain : ''}!!!`;
  const selectMemId = document.getElementById('gen-google-member-select')?.value;
  const targetMemId = selectMemId || getCurrentSyntaxMemberId();

  if (!state.googleSyntaxMap) state.googleSyntaxMap = {};
  if (!state.googleSyntaxMap[targetMemId]) state.googleSyntaxMap[targetMemId] = [];

  // TRÁNH TRÙNG LẶP DỮ LIỆU TOÀN HỆ THỐNG (GLOBAL DEDUPLICATION CHECK ACROSS ALL MEMBERS)
  const isDuplicate = Object.values(state.googleSyntaxMap).some(list => Array.isArray(list) && list.some(item => item.trim() === newSyntax.trim()));
  if (isDuplicate) {
    showToast('Cú pháp này đã tồn tại trên trang chính (không bị trùng lặp dữ liệu)!', 'amber');
    return;
  }

  state.googleSyntaxMap[targetMemId].push(newSyntax);
  saveDataToStorage();

  logMemberActivity(targetMemId, 'Xuất Cú Pháp', newSyntax, 'Google Search');
  renderGoogleSyntaxList();
  if (kwInput) {
    kwInput.value = '';
    kwInput.focus();
  }
  const memName = getMemberName(targetMemId);
  showToast(`Đã xuất cú pháp cho ${memName}!`, 'success');
}

function renderGoogleSyntaxList() {
  const outputEl = document.getElementById('gen-google-output');
  const countEl = document.getElementById('count-google-list');
  const list = getGoogleSyntaxListForActiveMember();

  if (outputEl) {
    outputEl.textContent = list.length > 0 ? list.join('\n') : 'Chưa có cú pháp Google Search nào';
  }
  if (countEl) countEl.textContent = list.length;
}

function clearGoogleSyntaxList() {
  const memFilter = state.activeMemberFilter.syntax;
  if (memFilter === 'all') {
    state.googleSyntaxMap = {};
  } else if (state.googleSyntaxMap) {
    state.googleSyntaxMap[memFilter] = [];
  }
  saveDataToStorage();
  renderGoogleSyntaxList();
  showToast('Đã làm mới danh sách Cú pháp Google Search.', 'success');
}

function previewBacklinkSyntax() {
  const el = document.getElementById('gen-backlink-preview');
  if (!el) return;
  const url = document.getElementById('gen-backlink-url')?.value.trim() || '';
  const kw = document.getElementById('gen-backlink-kw')?.value.trim() || '';
  el.textContent = `${url} ###${kw}!!!`;
}

function addBacklinkSyntaxItem() {
  const urlInput = document.getElementById('gen-backlink-url');
  const kwInput = document.getElementById('gen-backlink-kw');
  const url = urlInput?.value.trim() || '';
  const kw = kwInput?.value.trim() || '';

  if (!url && !kw) {
    showToast('Vui lòng nhập Link Backlink và Từ khóa chính!', 'danger');
    return;
  }

  const newSyntax = `${url} ###${kw}!!!`;
  const selectMemId = document.getElementById('gen-backlink-member-select')?.value;
  const targetMemId = selectMemId || getCurrentSyntaxMemberId();

  if (!state.backlinkSyntaxMap) state.backlinkSyntaxMap = {};
  if (!state.backlinkSyntaxMap[targetMemId]) state.backlinkSyntaxMap[targetMemId] = [];

  // TRÁNH TRÙNG LẶP DỮ LIỆU TOÀN HỆ THỐNG (GLOBAL DEDUPLICATION CHECK ACROSS ALL MEMBERS)
  const isDuplicate = Object.values(state.backlinkSyntaxMap).some(list => Array.isArray(list) && list.some(item => item.trim() === newSyntax.trim()));
  if (isDuplicate) {
    showToast('Cú pháp này đã tồn tại trên trang chính (không bị trùng lặp dữ liệu)!', 'amber');
    return;
  }

  state.backlinkSyntaxMap[targetMemId].push(newSyntax);
  saveDataToStorage();

  logMemberActivity(targetMemId, 'Xuất Cú Pháp', newSyntax, 'Backlink');
  renderBacklinkSyntaxList();
  if (kwInput) kwInput.value = '';
  if (urlInput) {
    urlInput.value = '';
    urlInput.focus();
  }
  const memName = getMemberName(targetMemId);
  showToast(`Đã xuất cú pháp cho ${memName}!`, 'success');
}

function renderBacklinkSyntaxList() {
  const outputEl = document.getElementById('gen-backlink-output');
  const countEl = document.getElementById('count-backlink-list');
  const list = getBacklinkSyntaxListForActiveMember();

  if (outputEl) {
    outputEl.textContent = list.length > 0 ? list.join('\n') : 'Chưa có cú pháp Backlink nào';
  }
  if (countEl) countEl.textContent = list.length;
}

function clearBacklinkSyntaxList() {
  const memFilter = state.activeMemberFilter.syntax;
  if (memFilter === 'all') {
    state.backlinkSyntaxMap = {};
  } else if (state.backlinkSyntaxMap) {
    state.backlinkSyntaxMap[memFilter] = [];
  }
  saveDataToStorage();
  renderBacklinkSyntaxList();
  showToast('Đã làm mới danh sách Cú pháp Backlink.', 'success');
}

function copyGoogleSyntax() {
  const list = getGoogleSyntaxListForActiveMember();
  const text = list.join('\n');
  if (!text) {
    showToast('Danh sách trống!', 'danger');
    return;
  }
  copyTextDirectly(text);
}

function exportGoogleSyntax() {
  const list = getGoogleSyntaxListForActiveMember();
  const text = list.join('\n');
  if (!text) {
    showToast('Danh sách trống!', 'danger');
    return;
  }
  const memFilter = state.activeMemberFilter.syntax;
  const suffix = memFilter !== 'all' ? `-${getMemberName(memFilter)}` : '-tat-ca';
  exportTextFile(`cu-phap-google-search${suffix}.txt`, text);
  showToast('Đã xuất file dữ liệu Google Search thành công!', 'success');
}

function copyBacklinkSyntax() {
  const list = getBacklinkSyntaxListForActiveMember();
  const text = list.join('\n');
  if (!text) {
    showToast('Danh sách trống!', 'danger');
    return;
  }
  copyTextDirectly(text);
}

function exportBacklinkSyntax() {
  const list = getBacklinkSyntaxListForActiveMember();
  const text = list.join('\n');
  if (!text) {
    showToast('Danh sách trống!', 'danger');
    return;
  }
  const memFilter = state.activeMemberFilter.syntax;
  const suffix = memFilter !== 'all' ? `-${getMemberName(memFilter)}` : '-tat-ca';
  exportTextFile(`cu-phap-backlink${suffix}.txt`, text);
  showToast('Đã xuất file dữ liệu Backlink thành công!', 'success');
}

function exportTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function renderSyntaxView() {
  const memFilter = state.activeMemberFilter.syntax;
  const searchQuery = document.getElementById('syntax-search')?.value.toLowerCase().trim() || '';

  const toolbarEl = document.getElementById('syntax-toolbar');
  const filterSelect = document.getElementById('syntax-member-filter');
  const catSelect = document.getElementById('syntax-category-filter');
  const searchWrap = document.getElementById('syntax-search')?.closest('.search-input-wrap');
  const createBtn = document.getElementById('btn-create-syntax');
  const noteBtn = document.getElementById('btn-note-syntax');
  const badgeEl = document.getElementById('syntax-active-member-badge');
  const topGuides = document.getElementById('syntax-guides-top-grid');
  const genGrid = document.getElementById('syntax-generator-grid');
  const tableContainer = document.getElementById('syntax-table-container');

  if (memFilter !== 'all') {
    // Member View — Hide Top Guides & Generator Cards, Show Toolbar & Member Checklist Table!
    if (topGuides) topGuides.style.display = 'none';
    if (genGrid) genGrid.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
    if (toolbarEl) toolbarEl.style.display = 'flex';

    if (filterSelect) filterSelect.style.display = 'none';
    if (catSelect) catSelect.style.display = 'none';
    if (searchWrap) searchWrap.style.display = 'none';
    if (createBtn) createBtn.style.display = 'inline-flex';
    if (badgeEl) {
      badgeEl.style.display = 'inline-flex';
      badgeEl.innerHTML = getMemberBadgeHTML(memFilter);
    }
    if (noteBtn) {
      noteBtn.style.display = 'inline-flex';
      const hasNote = !!(localStorage.getItem(`taskflow_note_syntax_${memFilter}`) || '').trim();
      const dot = document.getElementById('btn-note-syntax-dot');
      if (dot) dot.style.display = hasNote ? 'inline-block' : 'none';
    }
  } else {
    // Main View — Show Top Guides & Generator Cards! Hide Toolbar & Checklist Table!
    if (topGuides) topGuides.style.display = 'grid';
    if (genGrid) genGrid.style.display = 'grid';
    if (tableContainer) tableContainer.style.display = 'none';
    if (toolbarEl) toolbarEl.style.display = 'none';
  }

  renderGoogleSyntaxList();
  renderBacklinkSyntaxList();
  renderSyntaxTable(memFilter, searchQuery);
}

function toggleSyntaxCompletion(id) {
  const s = state.syntax.find(x => x.id === id);
  if (s) {
    s.completed = !s.completed;
    saveDataToStorage();
    renderSyntaxView();
    showToast(s.completed ? 'Đã tích hoàn thành cú pháp!' : 'Đã bỏ tích cú pháp.', s.completed ? 'success' : 'amber');
  }
}

function copySyntaxItem(id) {
  const s = state.syntax.find(x => x.id === id);
  if (!s) return;
  const validSyntaxes = (s.syntaxes && s.syntaxes.length > 0)
    ? s.syntaxes
    : (s.code ? [s.code] : []);
  const text = validSyntaxes.join('\n');
  if (!text) {
    showToast('Chưa có cú pháp nào!', 'danger');
    return;
  }
  copyTextDirectly(text);
}

function renderSyntaxTable(memFilter, searchQuery) {
  const tbody = document.getElementById('syntax-table-body');
  if (!tbody) return;

  const filtered = state.syntax.filter(s => {
    const matchMember = memFilter === 'all' || s.memberId === memFilter;
    const matchSearch = memFilter !== 'all' || !searchQuery ||
      (s.primaryKeyword && s.primaryKeyword.toLowerCase().includes(searchQuery)) ||
      (s.syntaxes && s.syntaxes.some(syn => syn && syn.toLowerCase().includes(searchQuery)));
    return matchMember && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center;"><code>CHƯA CÓ DỮ LIỆU CÚ PHÁP NÀO</code></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const itemType = s.type || 'Google Search';
    const typeBadge = itemType === 'Google Search'
      ? `<span class="badge" style="background: var(--primary-light); color: var(--primary); font-weight:700; font-size:11px; padding:3px 8px; border-radius:4px;">Google Search</span>`
      : `<span class="badge" style="background: var(--emerald-light); color: var(--emerald); font-weight:700; font-size:11px; padding:3px 8px; border-radius:4px;">Backlink</span>`;

    const validSyntaxes = (s.syntaxes && s.syntaxes.length > 0)
      ? s.syntaxes
      : (s.code ? [s.code] : []);

    const syntaxesHTML = validSyntaxes.length > 0
      ? `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
            <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
              ${validSyntaxes.map(syn => `
                <code style="font-family: var(--font-code); font-size: 11.5px; word-break: break-all; color: var(--text-main); display: block;">${escapeHTML(syn)}</code>
              `).join('')}
            </div>
            <button class="btn-icon-only" onclick="copySyntaxItem('${s.id}')" title="Sao chép cả 3 cú pháp cùng lúc">
              <i class="ri-file-copy-line"></i>
            </button>
          </div>
        `
      : '<span class="text-muted">-</span>';

    return `
      <tr>
        <td style="vertical-align: middle; white-space: nowrap;">${typeBadge}</td>
        <td style="vertical-align: middle;">
          <strong><code>${escapeHTML(s.primaryKeyword || s.title || '-')}</code></strong>
        </td>
        <td style="vertical-align: top;">${syntaxesHTML}</td>
        <td style="vertical-align: middle; white-space: nowrap;">${getMemberBadgeHTML(s.memberId)}</td>
        <td class="text-right" style="vertical-align: middle;">
          <div class="action-btns" style="justify-content: flex-end;">
            <button class="btn-icon-only" onclick="editSyntax('${s.id}')" title="Sửa"><i class="ri-edit-line"></i></button>
            <button class="btn-icon-only danger" onclick="deleteSyntax('${s.id}')" title="Xóa"><i class="ri-delete-bin-line"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function generate3DefaultSyntaxes() {
  const kw = document.getElementById('syntax-kw-input')?.value.trim() || '';

  if (!kw) {
    showToast('Vui lòng nhập Từ khóa chính trước!', 'danger');
    return;
  }

  const syn1 = `https://www.google.com/ ###${kw}!!!`;
  const syn2 = `https://sites.google.com/view/thetropical/site ###${kw}!!!`;
  const syn3 = `https://medium.com/@seomaster/article ###${kw}!!!`;

  const pastedInput = document.getElementById('syntax-pasted-input');
  if (pastedInput) pastedInput.value = `${syn1}\n${syn2}\n${syn3}`;

  showToast('Đã tạo 3 cú pháp mẫu chuẩn thành công!', 'success');
}

function handleSyntaxAutoParse(e) {
  const text = (e && e.target ? e.target.value : e) || '';
  if (!text.trim()) return;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return;

  const firstLine = lines[0];

  // 1. Auto detect Phân loại (Google Search vs Backlink)
  const typeSelect = document.getElementById('syntax-type-input');
  if (typeSelect) {
    if (firstLine.toLowerCase().includes('google.com/ ###') || firstLine.toLowerCase().includes('google.com ###')) {
      typeSelect.value = 'Google Search';
    } else if (firstLine.includes('###')) {
      typeSelect.value = 'Backlink';
    }
  }

  // 2. Auto extract Từ khóa chính
  const kwInput = document.getElementById('syntax-kw-input');

  const hashIndex = firstLine.indexOf('###');
  if (hashIndex !== -1) {
    let afterHash = firstLine.substring(hashIndex + 3).trim();
    if (afterHash.endsWith('!!!')) {
      afterHash = afterHash.substring(0, afterHash.length - 3).trim();
    }

    if (afterHash.includes(',')) {
      const parts = afterHash.split(',');
      const kw = parts[0].trim();
      if (kwInput && kw) kwInput.value = kw;
    } else {
      const kw = afterHash.trim();
      if (kwInput && kw) kwInput.value = kw;
    }
  }
}

function openCreateSyntaxModal() {
  document.getElementById('modal-syntax-title').textContent = 'THÊM CÚ PHÁP MỚI';
  const hiddenId = document.getElementById('syntax-id');
  if (hiddenId) hiddenId.value = '';

  clearFormAndDraft('form-syntax');
  renderMemberSelectOptions();

  const activeMem = state.activeMemberFilter.syntax;
  const selectEl = document.getElementById('syntax-member-input');
  if (selectEl) {
    if (activeMem && activeMem !== 'all') {
      selectEl.value = activeMem;
      selectEl.disabled = true;
    } else {
      selectEl.disabled = false;
      selectEl.value = state.members[0]?.id || 'm1';
    }
  }

  const typeEl = document.getElementById('syntax-type-input');
  if (typeEl) typeEl.value = 'Google Search';

  openModal('modal-syntax');
}

function saveSyntax(e) {
  e.preventDefault();
  if (e.target.dataset.submitting === 'true') return;
  e.target.dataset.submitting = 'true';
  setTimeout(() => { delete e.target.dataset.submitting; }, 1000);

  const id = document.getElementById('syntax-id').value;
  const activeMem = state.activeMemberFilter.syntax;
  const selectEl = document.getElementById('syntax-member-input');

  let memberId = (selectEl && !selectEl.disabled) ? selectEl.value : '';
  if (!memberId && activeMem && activeMem !== 'all') {
    memberId = activeMem;
  }
  if (!memberId && id) {
    memberId = state.syntax.find(x => x.id === id)?.memberId || 'm1';
  }
  if (!memberId) memberId = state.members[0]?.id || 'm1';

  const type = document.getElementById('syntax-type-input')?.value || 'Google Search';
  const primaryKeyword = document.getElementById('syntax-kw-input').value.trim();

  const pastedText = document.getElementById('syntax-pasted-input')?.value || '';
  const syntaxes = pastedText.split('\n').map(l => l.trim()).filter(Boolean);

  if (syntaxes.length === 0) {
    showToast('Vui lòng dán ít nhất 1 dòng cú pháp!', 'danger');
    return;
  }

  if (id) {
    const idx = state.syntax.findIndex(s => s.id === id);
    if (idx !== -1) {
      state.syntax[idx] = { ...state.syntax[idx], memberId, type, primaryKeyword, syntaxes };
    }
  } else {
    state.syntax.unshift({
      id: 's_' + Date.now(),
      memberId, type, primaryKeyword, syntaxes
    });
  }

  const itemObj = id ? state.syntax.find(s => s.id === id) : state.syntax[0];
  saveDataToStorage();
  if (itemObj) syncItemToFirebase('syntax', itemObj);
  logMemberActivity(memberId, id ? 'Sửa Cú Pháp' : 'Lưu Cú Pháp', primaryKeyword, 'Cú pháp');
  clearFormAndDraft('form-syntax');
  closeModal('modal-syntax');
  renderSyntaxView();
  renderOverviewView();
  showToast('Đã lưu cú pháp thành công!', 'success');
}

function editSyntax(id) {
  const s = state.syntax.find(x => x.id === id);
  if (!s) {
    showToast('Không tìm thấy cú pháp cần chỉnh sửa.', 'danger');
    return;
  }

  renderMemberSelectOptions();

  document.getElementById('modal-syntax-title').textContent = 'CHỈNH SỬA CÚ PHÁP';
  document.getElementById('syntax-id').value = s.id;

  const typeEl = document.getElementById('syntax-type-input');
  if (typeEl) typeEl.value = s.type || 'Google Search';

  const kwEl = document.getElementById('syntax-kw-input');
  if (kwEl) kwEl.value = s.primaryKeyword || s.title || '';

  const activeMem = state.activeMemberFilter.syntax;
  const selectEl = document.getElementById('syntax-member-input');
  if (selectEl) {
    selectEl.value = s.memberId || (activeMem !== 'all' ? activeMem : 'm1');
    selectEl.disabled = (activeMem && activeMem !== 'all');
  }

  const syntaxes = (s.syntaxes && s.syntaxes.length > 0) ? s.syntaxes : (s.code ? [s.code] : []);
  const pastedInput = document.getElementById('syntax-pasted-input');
  if (pastedInput) pastedInput.value = syntaxes.join('\n');

  openModal('modal-syntax');
}

function deleteSyntax(id) {
  showConfirmModal(
    'XÁC NHẬN',
    'Bạn có chắc chắn muốn xóa cú pháp này không?',
    () => {
      const s = state.syntax.find(x => x.id === id);
      state.syntax = state.syntax.filter(x => x.id !== id);
      deleteItemFromFirebase('syntax', id);
      const currentMemId = state.currentUser ? state.currentUser.memberId : (s ? s.memberId : 'm1');
      logMemberActivity(currentMemId, 'Xóa Cú Pháp', s ? (s.primaryKeyword || s.title || '') : '', 'Cú pháp');
      saveDataToStorage();
      renderSyntaxView();
      renderOverviewView();
      showToast('Đã xóa cú pháp.', 'danger');
    }
  );
}


/* ==========================================================================
   Modals, Draft Persistence & Theme Logic
   ========================================================================== */

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('active');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    // Preserve typed inputs! Only hide modal overlay without resetting form
    m.classList.remove('active');
  }
}

// Form Draft Auto-Save & Restoration
function clearFormAndDraft(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    const hiddenId = form.querySelector('input[type="hidden"]');
    if (hiddenId) hiddenId.value = '';
  }
  localStorage.removeItem(`taskflow_draft_${formId}`);
}

function saveFormDraft(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const hiddenId = form.querySelector('input[type="hidden"]');
  if (hiddenId && hiddenId.value) return; // Don't save draft when editing an existing item

  const formData = {};
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (input.id && input.type !== 'hidden') {
      formData[input.id] = input.value;
    }
  });
  localStorage.setItem(`taskflow_draft_${formId}`, JSON.stringify(formData));
}

function restoreFormDraft(formId) {
  const saved = localStorage.getItem(`taskflow_draft_${formId}`);
  if (!saved) return;
  try {
    const formData = JSON.parse(saved);
    Object.keys(formData).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = formData[id];
    });
  } catch (e) {}
}

function setupDraftAutoSave() {
  const forms = ['form-prompt', 'form-article', 'form-backlink', 'form-backlinkBlogger', 'form-syntax', 'form-add-member', 'form-add-backlink-cat', 'form-add-article-cat', 'form-add-backlinkBlogger-cat'];
  forms.forEach(fId => {
    const form = document.getElementById(fId);
    if (form) {
      form.addEventListener('input', () => saveFormDraft(fId));
      form.addEventListener('change', () => saveFormDraft(fId));
    }
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('taskflow_theme', newTheme);
}

function initTheme() {
  const savedTheme = localStorage.getItem('taskflow_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function setupGlobalEvents() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => {
        m.classList.remove('active');
      });
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('active');
    }
  });
}

function copyTextDirectly(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Đã sao chép vào Clipboard!', 'success');
  }).catch(() => {
    showToast('Không thể sao chép tự động.', 'danger');
  });
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${msg}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 1700);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

function escapeJsString(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

function truncateUrl(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function formatVND(amount) {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDateVN(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}


/* ==========================================================================
   AUTHENTICATION & LOGIN SCREEN HANDLERS (FIREBASE READY)
   ========================================================================== */

function openLoginScreen() {
  const loginEl = document.getElementById('login-screen');
  if (loginEl) loginEl.classList.add('active');
}

function closeLoginScreen() {
  const loginEl = document.getElementById('login-screen');
  if (loginEl) loginEl.classList.remove('active');
}

function toggleLoginPasswordVisibility() {
  const pwdInput = document.getElementById('login-password');
  const icon = document.getElementById('pwd-toggle-icon');
  if (!pwdInput || !icon) return;

  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    icon.className = 'ri-eye-line';
  } else {
    pwdInput.type = 'password';
    icon.className = 'ri-eye-off-line';
  }
}

function handleForgotPassword(e) {
  e.preventDefault();
  showToast('Vui lòng liên hệ Quản trị viên (Admin) để khôi phục mật khẩu!', 'amber');
}

function findOrCreateMember(email) {
  const cleanEmail = (email || '').toLowerCase().trim();
  const rawPrefix = cleanEmail.split('@')[0];
  const normPrefix = normalizeStr(rawPrefix);

  // 1. Tìm theo email chuẩn
  let matched = state.members.find(m => m && m.email && m.email.toLowerCase().trim() === cleanEmail);
  if (matched) return matched;

  // 2. Tìm theo tên thành viên
  let matchedByName = state.members.find(m => m && m.name && normalizeStr(m.name) === normPrefix);
  if (matchedByName) {
    matchedByName.email = cleanEmail;
    saveDataToStorage();
    if (db) {
      db.collection('app_settings').doc('members').set({ list: state.members }, { merge: true })
        .catch(err => console.log('Sync members error:', err.message));
    }
    return matchedByName;
  }

  // 3. TỰ ĐỘNG TẠO NƠI LÀM VIỆC MỚI khi tài khoản Firebase mới đăng nhập!
  const displayName = rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1);
  const newId = 'm_' + Date.now();
  const newMember = { id: newId, name: displayName, email: cleanEmail };

  state.members.push(newMember);
  saveDataToStorage();

  if (db) {
    db.collection('app_settings').doc('members').set({ list: state.members }, { merge: true })
      .catch(err => console.log('Sync members error:', err.message));
  }

  renderSubmenus();
  renderMemberSelectOptions();
  return newMember;
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const rawEmail = emailInput?.value.trim() || '';
  const password = pwdInput?.value || '';

  if (!rawEmail || !password) {
    showToast('Vui lòng nhập đầy đủ Email và Mật khẩu!', 'danger');
    return;
  }

  // Chuẩn hóa định dạng Email (nếu nhập username không có @, tự động gắn domain mặc định)
  const email = rawEmail.includes('@') ? rawEmail.toLowerCase().trim() : `${normalizeStr(rawEmail)}@taskflow.com`;

  const submitBtn = document.getElementById('btn-login-submit');
  const errorBox = document.getElementById('login-error-msg');
  const errorText = document.getElementById('login-error-text');
  if (errorBox) errorBox.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Đang xác thực...</span>';
  }

  // Kiểm tra nếu tài khoản đã bị xóa khỏi hệ thống
  if (state.deletedMembers && state.deletedMembers.includes(email)) {
    let msg = 'Tài khoản này đã bị Admin xóa khỏi hệ thống!';
    showToast(msg, 'danger');
    if (errorText) errorText.textContent = msg;
    if (errorBox) errorBox.style.display = 'block';
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span>Đăng Nhập</span>'; }
    return;
  }

  let authenticated = false;
  if (auth && typeof auth.signInWithEmailAndPassword === 'function') {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      authenticated = true;
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Tự động khởi tạo tài khoản mới nếu mật khẩu đủ 6 ký tự
        if (password.length >= 6) {
          try {
            await auth.createUserWithEmailAndPassword(email, password);
            authenticated = true;
          } catch (createErr) {
            console.log("Auto-register fallback error:", createErr.message);
          }
        }
      } else if (error.code === 'auth/network-request-failed') {
        authenticated = true; // Cho phép đăng nhập offline khi mất mạng
      } else {
        console.error('Firebase Auth Exception:', error);
      }
    }
  } else {
    authenticated = true;
  }

  if (!authenticated) {
    let msg = 'Sai mật khẩu hoặc tài khoản chưa đúng! (Mật khẩu cần từ 6 ký tự trở lên)';
    showToast(msg, 'danger');
    if (errorText) errorText.textContent = msg;
    if (errorBox) errorBox.style.display = 'block';
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span>Đăng Nhập</span>'; }
    return;
  }

  // Tìm hoặc tạo thành viên mới từ email đăng nhập
  let member = findOrCreateMember(email);

  state.currentUser = {
    email: email,
    name: member.name,
    memberId: member.id
  };

  // Lưu vào sessionStorage (F5 không mất, đóng trình duyệt mới phải đăng nhập lại)
  sessionStorage.setItem('taskflow_current_user', JSON.stringify(state.currentUser));
  updateCurrentUserBadge();
  closeLoginScreen();
  renderSubmenus();
  renderMemberSelectOptions();
  renderAllViews();

  if (emailInput) emailInput.value = '';
  if (pwdInput) pwdInput.value = '';

  showToast(`Đăng nhập thành công! Chào mừng ${state.currentUser.name}.`, 'success');
  logMemberActivity(member.id, 'Đăng Nhập', 'Đăng nhập vào hệ thống', 'Hệ thống');
  } catch (error) {
    console.error('Lỗi đăng nhập Firebase:', error);
    let msg = 'Email hoặc Mật khẩu không chính xác!';
    if (error.code === 'auth/operation-not-allowed') {
      msg = 'Chưa bật Email/Password trong Firebase Console! Vào Authentication → Sign-in method → Bật Email/Password.';
    } else if (error.code === 'auth/user-not-found') {
      msg = 'Tài khoản này đã bị xóa trên Firebase hoặc chưa được cấp quyền truy cập!';
    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      msg = 'Sai mật khẩu hoặc tài khoản đã bị xóa trên Firebase!';
    } else if (error.code === 'auth/too-many-requests') {
      msg = 'Đăng nhập sai quá nhiều lần. Vui lòng đợi vài phút.';
    } else if (error.code === 'auth/invalid-email') {
      msg = 'Định dạng email không hợp lệ.';
    }
    showToast(msg, 'danger');
    // Hiện thông báo lỗi ngay trên form Login
    if (errorText) errorText.textContent = msg;
    if (errorBox) errorBox.style.display = 'block';
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Đăng Nhập</span>';
    }
  }
}

function handleLogout() {
  showConfirmModal('ĐĂNG XUẤT', 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?', () => {
    sessionStorage.removeItem('taskflow_current_user');
    state.currentUser = null;
    updateCurrentUserBadge();
    openLoginScreen();
    showToast('Đã đăng xuất tài khoản.', 'amber');
  });
}

function updateCurrentUserBadge() {
  const container = document.getElementById('current-user-badge');
  if (!container) return;

  if (state.currentUser && state.currentUser.name) {
    const memberId = state.currentUser.memberId || 'm1';
    const avatarHTML = getMemberAvatarHTML(memberId, 'xs');
    container.innerHTML = `
      <span class="member-badge">${avatarHTML} <span>${escapeHTML(state.currentUser.name)}</span></span>
    `;
  } else {
    container.innerHTML = `
      <span class="text-muted" style="font-size: 12px; cursor: pointer;" onclick="openLoginScreen()">Chưa đăng nhập</span>
    `;
  }
}


/* ==========================================================================
   FIREBASE REALTIME CLOUD SYNC
   ========================================================================== */

// Real-time Firestore sync across all team members' devices
function setupFirebaseRealtimeListeners() {
  if (!db) return;

  // 0. Members Realtime Sync (load team members from cloud)
  db.collection('app_settings').doc('members').onSnapshot((doc) => {
    if (doc.exists && doc.data()) {
      if (Array.isArray(doc.data().list) && doc.data().list.length > 0) {
        state.members = doc.data().list;
        localStorage.setItem('taskflow_members', JSON.stringify(state.members));
      }
      if (Array.isArray(doc.data().deleted)) {
        state.deletedMembers = doc.data().deleted;
      }
      renderSubmenus();
      renderMemberSelectOptions();
      renderOverviewView();
    } else if (db) {
      db.collection('app_settings').doc('members').set({ list: DEFAULT_MEMBERS }, { merge: true });
    }
  }, (err) => console.log("Firestore members sync:", err.message));

  // 0.5. Categories Realtime Sync (Phân khu dùng chung toàn hệ thống)
  db.collection('app_settings').doc('categories').onSnapshot((doc) => {
    if (doc.exists && doc.data().list) {
      state.categories = doc.data().list;
      localStorage.setItem('taskflow_categories', JSON.stringify(state.categories));
      renderAllCategorySelectOptions();
      renderAllViews();
    }
  }, (err) => console.log("Firestore categories sync:", err.message));

  // 0.8. Notes Realtime Sync (Ghi chú thành viên)
  db.collection('notes').onSnapshot((snapshot) => {
    if (snapshot) {
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.key && typeof data.content === 'string') {
          localStorage.setItem(data.key, data.content);
        }
      });
      renderAllViews();
    }
  }, (err) => console.log("Firestore notes sync:", err.message));

  // 1. Articles Realtime Sync
  db.collection('articles').onSnapshot((snapshot) => {
    if (snapshot && !snapshot.empty) {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      state.articles = items;
      localStorage.setItem('taskflow_articles', JSON.stringify(state.articles));
    }
    renderArticlesView();
    renderOverviewView();
  }, (err) => {
    console.log("Firestore articles sync notice:", err.message);
    renderArticlesView();
    renderOverviewView();
  });

  // 2. Prompts Realtime Sync
  db.collection('prompts').onSnapshot((snapshot) => {
    if (snapshot && !snapshot.empty) {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      state.prompts = items;
      localStorage.setItem('taskflow_prompts', JSON.stringify(state.prompts));
    }
    renderPromptsView();
    renderOverviewView();
  }, (err) => {
    console.log("Firestore prompts sync notice:", err.message);
    renderPromptsView();
    renderOverviewView();
  });

  // 3. Backlinks Realtime Sync
  db.collection('backlinks').onSnapshot((snapshot) => {
    if (snapshot && !snapshot.empty) {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      state.backlinks = items;
      localStorage.setItem('taskflow_backlinks', JSON.stringify(state.backlinks));
    }
    renderBacklinksView();
    renderOverviewView();
  }, (err) => {
    console.log("Firestore backlinks sync notice:", err.message);
    renderBacklinksView();
    renderOverviewView();
  });

  // 4. Backlink Blogger Realtime Sync
  db.collection('backlinkBlogger').onSnapshot((snapshot) => {
    if (snapshot && !snapshot.empty) {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      state.backlinkBlogger = items;
      localStorage.setItem('taskflow_backlinkBlogger', JSON.stringify(state.backlinkBlogger));
    }
    renderBacklinkBloggerView();
    renderOverviewView();
  }, (err) => {
    console.log("Firestore backlinkBlogger sync notice:", err.message);
    renderBacklinkBloggerView();
    renderOverviewView();
  });

  // 5. Syntax Realtime Sync
  db.collection('syntax').onSnapshot((snapshot) => {
    if (snapshot && !snapshot.empty) {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      state.syntax = items;
      localStorage.setItem('taskflow_syntax', JSON.stringify(state.syntax));
    }
    renderSyntaxView();
    renderOverviewView();
  }, (err) => {
    console.log("Firestore syntax sync notice:", err.message);
    renderSyntaxView();
    renderOverviewView();
  });

  // 6. Activities Realtime Sync (Nhật ký Hoạt động Realtime - Tự động xóa sau 10s để bóp data)
  db.collection('activities').onSnapshot((snapshot) => {
    if (snapshot) {
      const items = [];
      const now = Date.now();
      snapshot.forEach(doc => {
        const data = doc.data();
        const age = now - (data.createdAt || 0);
        if (age < 10000) {
          items.push({ id: doc.id, ...data });
        } else {
          // Xóa ngay bản ghi quá 10s trên Firestore để tiết kiệm bộ nhớ Cloud
          deleteItemFromFirebase('activities', doc.id);
        }
      });
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      state.activities = items;
      localStorage.setItem('taskflow_activities', JSON.stringify(state.activities));
      if (state.activeView === 'overview') {
        renderOverviewView();
      }
    }
  }, (err) => console.log("Firestore activities sync:", err.message));
}

// Helper to push items to Firebase Cloud Database (cleaned for zero-error Firestore sync)
function syncCategoriesToFirebase() {
  if (typeof db !== 'undefined' && db) {
    db.collection('app_settings').doc('categories').set({
      list: state.categories || DEFAULT_CATEGORIES
    }, { merge: true }).catch(err => console.log('Sync categories error:', err.message));
  }
}

function syncItemToFirebase(collectionName, item) {
  if (db && item && item.id) {
    try {
      const cleanItem = JSON.parse(JSON.stringify(item));
      db.collection(collectionName).doc(String(item.id)).set(cleanItem, { merge: true })
        .catch(err => console.error(`Firebase sync error [${collectionName}]:`, err.message));
    } catch (e) {
      console.error("Clean item error:", e);
    }
  }
}

function deleteItemFromFirebase(collectionName, itemId) {
  if (db && itemId) {
    db.collection(collectionName).doc(String(itemId)).delete()
      .catch(err => console.error(`Firebase delete error [${collectionName}]:`, err.message));
  }
}
