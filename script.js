// ==================== GLOBAL STATE ====================
let tasks = [];
let users = [];
let nextId = 1;
let nextUserId = 1;
let editId = null;
let currentFilter = 'all';
let currentCat = 'all';
let currentView = 'kanban';
let dragId = null;
let currentUser = { name: 'Demo User', email: 'demo@taskflow.vn', isAdmin: false };
let isAdminMode = false;

// ==================== UTILITY FUNCTIONS ====================
const fmtDate = (d) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().split('T')[0];
};

const fmtDisplay = (d) => {
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}`;
};

const getAvatarText = (name) => {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

// ==================== SAMPLE DATA ====================
const sampleTasks = [
  { id: nextId++, title: 'Làm báo cáo Q2', cat: 'work', status: 'pending', deadline: fmtDate(1), remind: '', note: 'Gửi cho team trước 5pm', done: false },
  { id: nextId++, title: 'Ôn thi môn Toán', cat: 'study', status: 'inprogress', deadline: fmtDate(3), remind: '08:00', note: 'Chương 5 và 6', done: false },
  { id: nextId++, title: 'Đặt vé máy bay', cat: 'personal', status: 'done', deadline: fmtDate(-1), remind: '', note: 'Bay về quê cuối tuần', done: true },
  { id: nextId++, title: 'Review code PR #42', cat: 'work', status: 'inprogress', deadline: fmtDate(0), remind: '14:00', note: '', done: false },
  { id: nextId++, title: 'Đọc sách Design Patterns', cat: 'study', status: 'pending', deadline: fmtDate(7), remind: '', note: 'Chương Observer', done: false },
];
tasks = sampleTasks;

// Initialize users with admin account
users = [
  { id: nextUserId++, name: 'Admin User', email: 'admin@taskflow.vn', isAdmin: true, createdAt: fmtDate(-30) },
  { id: nextUserId++, name: 'Demo User', email: 'demo@taskflow.vn', isAdmin: false, createdAt: fmtDate(-10) },
];

// ==================== AUTHENTICATION ====================
function doLogin(){
  const e = document.getElementById('loginEmail').value.trim();
  const p = document.getElementById('loginPass').value;
  
  if (!e || !p) {
    alert('Vui lòng nhập đủ thông tin');
    return;
  }

  const user = users.find(u => u.email === e);
  if (user) {
    currentUser = user;
  } else {
    currentUser = { name: e.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), email: e, isAdmin: false };
  }

  document.getElementById('loginScreen').classList.remove('show');
  document.getElementById('appMain').classList.remove('hidden');
  initApp();
}

function toggleSignup(e){
  e.preventDefault();
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
  signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
}

function doSignup(){
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value;
  const passConfirm = document.getElementById('signupPassConfirm').value;
  
  if (!name || !email || !pass || !passConfirm) {
    alert('Vui lòng điền đầy đủ thông tin');
    return;
  }
  
  if (pass.length < 6) {
    alert('Mật khẩu phải có ít nhất 6 ký tự');
    return;
  }
  
  if (pass !== passConfirm) {
    alert('Mật khẩu xác nhận không khớp');
    return;
  }
  
  if (!email.includes('@')) {
    alert('Email không hợp lệ');
    return;
  }

  if (users.some(u => u.email === email)) {
    alert('Email này đã được đăng ký');
    return;
  }

  currentUser = { id: nextUserId++, name: name, email: email, isAdmin: false, createdAt: fmtDate(0) };
  users.push(currentUser);

  document.getElementById('loginScreen').classList.remove('show');
  document.getElementById('appMain').classList.remove('hidden');
  initApp();
}

function doLogout(){
  document.getElementById('appMain').classList.add('hidden');
  document.getElementById('loginScreen').classList.add('show');
  isAdminMode = false;
  resetForms();
}

function resetForms() {
  document.getElementById('loginEmail').value = 'demo@taskflow.vn';
  document.getElementById('loginPass').value = '12345678';
  document.getElementById('signupName').value = '';
  document.getElementById('signupEmail').value = '';
  document.getElementById('signupPass').value = '';
  document.getElementById('signupPassConfirm').value = '';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('signupForm').style.display = 'none';
}

// ==================== APP INITIALIZATION ====================
function initApp(){
  document.getElementById('sideUser').textContent = currentUser.name;
  document.getElementById('sideEmail').textContent = currentUser.email;
  document.getElementById('sideAvatar').textContent = getAvatarText(currentUser.name);
  
  if (currentUser.isAdmin) {
    document.getElementById('adminBtn').style.display = 'flex';
  } else {
    document.getElementById('adminBtn').style.display = 'none';
  }

  render();
  checkReminders();
}

// ==================== FILTERING & RENDERING ====================
function getFiltered(){
  let t = [...tasks];
  
  if (currentFilter === 'today') {
    const td = fmtDate(0);
    t = t.filter(x => x.deadline === td);
  } else if (currentFilter === 'pending') {
    t = t.filter(x => x.status !== 'done');
  } else if (currentFilter === 'done') {
    t = t.filter(x => x.status === 'done');
  } else if (['work', 'study', 'personal'].includes(currentFilter)) {
    t = t.filter(x => x.cat === currentFilter);
  }
  
  if (currentCat !== 'all') {
    t = t.filter(x => x.cat === currentCat);
  }
  
  return t;
}

function render(){
  const filtered = getFiltered();
  const done = filtered.filter(x => x.status === 'done').length;
  
  document.getElementById('sTotal').textContent = filtered.length;
  document.getElementById('sDone').textContent = done;
  
  const pct = filtered.length ? Math.round(done / filtered.length * 100) : 0;
  document.getElementById('sProg').textContent = pct + '%';
  document.getElementById('progFill').style.width = pct + '%';

  updateBadges();
  if (currentView === 'kanban') renderKanban(filtered);
  else renderList(filtered);
}

function updateBadges(){
  document.getElementById('badgeAll').textContent = tasks.length;
  const td = fmtDate(0);
  document.getElementById('badgeToday').textContent = tasks.filter(x => x.deadline === td).length;
  document.getElementById('badgePending').textContent = tasks.filter(x => x.status !== 'done').length;
  document.getElementById('badgeDone').textContent = tasks.filter(x => x.status === 'done').length;
  document.getElementById('badgeWork').textContent = tasks.filter(x => x.cat === 'work').length;
  document.getElementById('badgeStudy').textContent = tasks.filter(x => x.cat === 'study').length;
  document.getElementById('badgePersonal').textContent = tasks.filter(x => x.cat === 'personal').length;
}

function renderKanban(filtered){
  ['pending', 'inprogress', 'done'].forEach(s => {
    const col = document.getElementById('cards-' + s);
    const items = filtered.filter(t => t.status === s);
    document.getElementById('cnt-' + s).textContent = items.length;
    col.innerHTML = items.map(t => taskCardHTML(t)).join('');
  });
  addDragListeners();
}

function renderList(filtered){
  const lv = document.getElementById('listView');
  lv.innerHTML = filtered.length ? filtered.map(t => `
    <div class="list-row">
      <div class="check-box ${t.status === 'done' ? 'checked' : ''}" onclick="toggleDone(${t.id})">${t.status === 'done' ? '✓' : ''}</div>
      <div style="flex:1">
        <p class="task-title ${t.status === 'done' ? 'done' : ''}" style="margin:0">${t.title}</p>
        <div class="task-meta" style="margin-top:4px">
          <span class="cat-tag cat-${t.cat}">${t.cat}</span>
          ${t.deadline ? `<span class="deadline ${deadlineClass(t.deadline)}">📅 ${fmtDisplay(t.deadline)}</span>` : ''}
          ${t.remind ? `<span class="remind-badge">🔔 ${t.remind}</span>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="act-btn" onclick="openEdit(${t.id})">✏️</button>
        <button class="act-btn del" onclick="deleteTask(${t.id})">🗑</button>
      </div>
    </div>`).join('') : `<p style="color:var(--color-text-tertiary);text-align:center;padding:2rem;font-size:13px">Không có việc nào</p>`;
}

function taskCardHTML(t){
  return `<div class="task-card" draggable="true" data-id="${t.id}" id="tc-${t.id}">
    <div class="task-actions">
      <button class="act-btn" onclick="openEdit(${t.id})">✏️</button>
      <button class="act-btn del" onclick="deleteTask(${t.id})">🗑</button>
    </div>
    <p class="task-title ${t.status === 'done' ? 'done' : ''}">${t.title}</p>
    ${t.note ? `<p style="font-size:11px;color:var(--color-text-secondary);margin-bottom:.4rem">${t.note}</p>` : ''}
    <div class="task-meta">
      <span class="cat-tag cat-${t.cat}">${t.cat}</span>
      ${t.deadline ? `<span class="deadline ${deadlineClass(t.deadline)}">📅 ${fmtDisplay(t.deadline)}</span>` : ''}
    </div>
    ${t.remind ? `<div style="margin-top:6px"><span class="remind-badge">🔔 ${t.remind}</span></div>` : ''}
  </div>`;
}

function deadlineClass(d){
  const diff = (new Date(d) - new Date(fmtDate(0))) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 1) return 'soon';
  return '';
}

// ==================== DRAG & DROP ====================
function addDragListeners(){
  document.querySelectorAll('.task-card').forEach(c => {
    c.addEventListener('dragstart', e => {
      dragId = +c.dataset.id;
      c.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    c.addEventListener('dragend', () => {
      c.classList.remove('dragging');
      document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
    });
  });
}

function onDragOver(e, col){
  e.preventDefault();
  const c = document.getElementById('col-' + col);
  if (!c.querySelector('.drag-placeholder')) {
    const p = document.createElement('div');
    p.className = 'drag-placeholder';
    c.querySelector('[id^=cards-]').appendChild(p);
  }
}

function onDragLeave(e){
  if (!e.currentTarget.contains(e.relatedTarget))
    e.currentTarget.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
}

function onDrop(e, col){
  e.preventDefault();
  document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
  if (dragId === null) return;
  const t = tasks.find(x => x.id === dragId);
  if (t) {
    t.status = col;
    if (col === 'done') t.done = true;
    else t.done = false;
  }
  dragId = null;
  render();
}

// ==================== TASK MANAGEMENT ====================
function toggleDone(id){
  const t = tasks.find(x => x.id === id);
  if (t) {
    t.status = t.status === 'done' ? 'pending' : 'done';
    t.done = t.status === 'done';
  }
  render();
}

function deleteTask(id){
  if (confirm('Bạn chắc chắn muốn xóa task này?')) {
    tasks = tasks.filter(x => x.id !== id);
    render();
  }
}

function openModal(id = null){
  editId = id;
  document.getElementById('modalTitle').textContent = id ? 'Chỉnh sửa công việc' : 'Thêm công việc mới';
  if (id) {
    const t = tasks.find(x => x.id === id);
    document.getElementById('taskTitle').value = t.title;
    document.getElementById('taskCat').value = t.cat;
    document.getElementById('taskStatus').value = t.status;
    document.getElementById('taskDeadline').value = t.deadline || '';
    document.getElementById('taskRemind').value = t.remind || '';
    document.getElementById('taskNote').value = t.note || '';
  } else {
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskCat').value = 'work';
    document.getElementById('taskStatus').value = 'pending';
    document.getElementById('taskDeadline').value = '';
    document.getElementById('taskRemind').value = '';
    document.getElementById('taskNote').value = '';
  }
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('taskTitle').focus(), 50);
}

function openEdit(id){
  openModal(id);
}

function closeModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  editId = null;
}

function closeModalOutside(e){
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function saveTask(){
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) {
    document.getElementById('taskTitle').style.borderColor = '#e53e3e';
    return;
  }
  document.getElementById('taskTitle').style.borderColor = '';
  const task = {
    id: editId || nextId++,
    title,
    cat: document.getElementById('taskCat').value,
    status: document.getElementById('taskStatus').value,
    deadline: document.getElementById('taskDeadline').value,
    remind: document.getElementById('taskRemind').value,
    note: document.getElementById('taskNote').value,
    done: document.getElementById('taskStatus').value === 'done'
  };
  if (editId) tasks = tasks.map(x => x.id === editId ? task : x);
  else tasks.push(task);
  closeModal();
  render();
}

// ==================== FILTERS ====================
function setFilter(f, btn){
  currentFilter = f;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const labels = { all: 'Tất cả công việc', today: 'Hôm nay', pending: 'Đang làm', done: 'Hoàn thành', work: 'Work', study: 'Study', personal: 'Personal' };
  document.getElementById('topTitle').textContent = labels[f] || 'Công việc';
  render();
}

function setCatFilter(c, btn){
  currentCat = c;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function setView(v, btn){
  currentView = v;
  document.querySelectorAll('.vtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const kv = document.getElementById('kanbanView');
  const lv = document.getElementById('listView');
  if (v === 'kanban') {
    kv.classList.remove('hidden');
    lv.classList.remove('active');
  } else {
    kv.classList.add('hidden');
    lv.classList.add('active');
  }
  render();
}

// ==================== ADMIN PANEL ====================
function toggleAdminMode(){
  if (!currentUser.isAdmin) {
    alert('Chỉ admin mới có quyền truy cập');
    return;
  }
  
  isAdminMode = !isAdminMode;
  const userContent = document.getElementById('userContent');
  const adminPanel = document.getElementById('adminPanel');
  const adminBtn = document.getElementById('adminBtn');
  
  if (isAdminMode) {
    userContent.style.display = 'none';
    adminPanel.style.display = 'flex';
    adminBtn.textContent = '👤 Quay lại';
    renderAdminDashboard();
  } else {
    userContent.style.display = 'flex';
    adminPanel.style.display = 'none';
    adminBtn.textContent = '⚙️ Admin';
  }
}

function renderAdminDashboard(){
  const totalUsers = users.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;

  document.getElementById('adminStats').innerHTML = `
    <div class="stat"><p>Tổng User</p><p>${totalUsers}</p></div>
    <div class="stat"><p>Tổng Task</p><p>${totalTasks}</p></div>
    <div class="stat"><p>Hoàn thành</p><p>${completedTasks}</p></div>
    <div class="stat"><p>Đang làm</p><p>${pendingTasks}</p></div>
  `;

  document.getElementById('adminUsersList').innerHTML = users.map(u => `
    <div class="admin-user-row">
      <div class="admin-user-info">
        <div style="font-weight:500">${u.name}</div>
        <div style="font-size:12px;color:var(--color-text-secondary)">${u.email}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:12px;padding:2px 8px;border-radius:4px;${u.isAdmin ? 'background:#c084fc;color:#fff;' : 'background:#dbeafe;color:#1e40af;'}">${u.isAdmin ? 'Admin' : 'User'}</span>
        <span style="font-size:12px;color:var(--color-text-secondary)">${u.createdAt}</span>
        ${!u.isAdmin ? `<button class="act-btn" onclick="deleteUser(${u.id})">🗑</button>` : ''}
      </div>
    </div>
  `).join('');

  document.getElementById('adminTasksList').innerHTML = tasks.slice(0, 5).map(t => `
    <div class="admin-task-row">
      <div>${t.title}</div>
      <div style="font-size:12px;color:var(--color-text-secondary);display:flex;gap:8px;align-items:center">
        <span class="cat-tag cat-${t.cat}">${t.cat}</span>
        <span style="background:${t.status === 'done' ? '#dcfce7' : '#fef3c7'};color:${t.status === 'done' ? '#166534' : '#926e2d'};padding:2px 8px;border-radius:4px">${t.status}</span>
      </div>
    </div>
  `).join('');
}

function deleteUser(id){
  if (confirm('Bạn chắc chắn muốn xóa user này?')) {
    users = users.filter(u => u.id !== id);
    renderAdminDashboard();
  }
}

// ==================== REMINDERS ====================
function checkReminders(){
  setInterval(() => {
    const now = new Date();
    const hm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const due = tasks.filter(t => t.remind === hm && t.status !== 'done');
    if (due.length > 0) {
      const nb = document.getElementById('notifyBtn');
      document.getElementById('notifyText').textContent = due[0].title;
      nb.style.display = 'block';
      setTimeout(() => nb.style.display = 'none', 8000);
    }
  }, 60000);
}

function dismissNotify(){
  document.getElementById('notifyBtn').style.display = 'none';
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
