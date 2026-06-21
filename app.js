// ============================================
// DARK IA WEB - Logique frontend
// Powered by MOISETECH - Le jeune Sénégalais 🇸🇳
// ============================================

// ----- Éléments DOM -----
const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const newChatBtn = document.getElementById('newChatBtn');
const historyList = document.getElementById('historyList');
const statusDot = document.getElementById('statusDot');
const themeSwitcher = document.getElementById('themeSwitcher');

// ----- État global -----
let conversations = JSON.parse(localStorage.getItem('darkia_conversations') || '[]');
let currentConvId = null;
let currentMessages = [];
let attachedFile = null; // { fileName, mimeType, base64Data }

// ============================================
// THÈMES
// ============================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('darkia_theme', theme);
  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.themeOption === theme);
  });
}

themeSwitcher.addEventListener('click', (e) => {
  const dot = e.target.closest('.theme-dot');
  if (dot) applyTheme(dot.dataset.themeOption);
});

// Initialisation du thème sauvegardé (ou violet par défaut)
applyTheme(localStorage.getItem('darkia_theme') || 'violet');

// ============================================
// GESTION DE L'HISTORIQUE (localStorage)
// ============================================
function saveConversations() {
  localStorage.setItem('darkia_conversations', JSON.stringify(conversations));
}

function renderHistory() {
  historyList.innerHTML = '';
  conversations
    .slice()
    .reverse()
    .forEach(conv => {
      const item = document.createElement('div');
      item.className = 'history-item' + (conv.id === currentConvId ? ' active' : '');
      item.innerHTML = `
        <span>${escapeHtml(conv.title)}</span>
        <button class="delete-btn" title="Supprimer">🗑</button>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
          deleteConversation(conv.id);
        } else {
          loadConversation(conv.id);
        }
      });
      historyList.appendChild(item);
    });
}

function deleteConversation(id) {
  conversations = conversations.filter(c => c.id !== id);
  saveConversations();
  if (id === currentConvId) startNewConversation();
  renderHistory();
}

function loadConversation(id) {
  const conv = conversations.find(c => c.id === id);
  if (!conv) return;
  currentConvId = id;
  currentMessages = conv.messages;
  renderMessages();
  renderHistory();
  if (window.innerWidth <= 768) sidebar.classList.remove('open');
}

function startNewConversation() {
  currentConvId = null;
  currentMessages = [];
  renderMessages();
  renderHistory();
}

function persistCurrentConversation(firstUserMessage) {
  if (!currentConvId) {
    currentConvId = 'conv_' + Date.now();
    conversations.push({
      id: currentConvId,
      title: firstUserMessage.slice(0, 40) || 'Nouvelle conversation',
      messages: currentMessages
    });
  } else {
    const conv = conversations.find(c => c.id === currentConvId);
    if (conv) conv.messages = currentMessages;
  }
  saveConversations();
  renderHistory();
}

newChatBtn.addEventListener('click', startNewConversation);

// ============================================
// AFFICHAGE DES MESSAGES
// ============================================
function renderMessages() {
  chatWindow.innerHTML = '';
  if (currentMessages.length === 0) {
    chatWindow.innerHTML = `
      <div class="welcome">
        <h1>🌑 DARK IA WEB</h1>
        <p>Pose ta question, envoie une image ou un fichier — l'IA s'occupe du reste.</p>
        <p class="welcome-tag">Powered by MOISETECH — Le jeune Sénégalais 🇸🇳</p>
      </div>`;
    return;
  }
  currentMessages.forEach(msg => appendMessageToDOM(msg.role, msg.content, msg.imagePreview));
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMessageToDOM(role, content, imagePreview) {
  const div = document.createElement('div');
  div.className = `message ${role === 'assistant' ? 'ai' : role}`;
  div.textContent = content;
  if (imagePreview) {
    const img = document.createElement('img');
    img.src = imagePreview;
    img.className = 'attached';
    div.appendChild(img);
  }
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

function showTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'typing';
  div.id = 'typingIndicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ============================================
// UPLOAD DE FICHIER / IMAGE
// ============================================
attachBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  filePreview.classList.remove('hidden');
  filePreview.innerHTML = `<span>⏳ Envoi de ${escapeHtml(file.name)}...</span>`;

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Erreur upload');

    attachedFile = {
      fileName: data.fileName,
      mimeType: data.mimeType,
      base64Data: data.base64Data
    };

    const isImage = data.mimeType.startsWith('image/');
    filePreview.innerHTML = `
      ${isImage ? `<img src="data:${data.mimeType};base64,${data.base64Data}">` : '📄'}
      <span>${escapeHtml(data.fileName)}</span>
      <button type="button" class="remove-file">✕</button>
    `;
    filePreview.querySelector('.remove-file').addEventListener('click', () => {
      attachedFile = null;
      filePreview.classList.add('hidden');
      filePreview.innerHTML = '';
      fileInput.value = '';
    });
  } catch (err) {
    filePreview.innerHTML = `<span style="color:var(--danger)">❌ ${escapeHtml(err.message)}</span>`;
    setTimeout(() => {
      filePreview.classList.add('hidden');
      filePreview.innerHTML = '';
    }, 3000);
  }
});

// ============================================
// ENVOI DE MESSAGE AU CHAT
// ============================================
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text && !attachedFile) return;

  sendBtn.disabled = true;

  const imagePreview = attachedFile && attachedFile.mimeType.startsWith('image/')
    ? `data:${attachedFile.mimeType};base64,${attachedFile.base64Data}`
    : null;

  // Affiche le message utilisateur
  appendMessageToDOM('user', text, imagePreview);
  currentMessages.push({ role: 'user', content: text, imagePreview });

  const isFirstMessage = currentMessages.length === 1;
  const historyForApi = currentMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  const fileToSend = attachedFile;

  // Reset de l'input
  messageInput.value = '';
  autoResizeTextarea();
  attachedFile = null;
  filePreview.classList.add('hidden');
  filePreview.innerHTML = '';
  fileInput.value = '';

  showTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: historyForApi,
        fileData: fileToSend
      })
    });

    const data = await res.json();
    removeTypingIndicator();

    if (!res.ok) throw new Error(data.error || 'Erreur lors de la réponse.');

    appendMessageToDOM('assistant', data.reply);
    currentMessages.push({ role: 'assistant', content: data.reply });
    setStatus(true);
  } catch (err) {
    removeTypingIndicator();
    appendMessageToDOM('error', '⚠️ ' + err.message);
    setStatus(false);
  }

  persistCurrentConversation(isFirstMessage ? text : null);
  sendBtn.disabled = false;
});

// Envoi avec Entrée (Shift+Entrée = nouvelle ligne)
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
}
messageInput.addEventListener('input', autoResizeTextarea);

// ============================================
// SIDEBAR (mobile)
// ============================================
toggleSidebarBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

// ============================================
// STATUT SERVEUR
// ============================================
function setStatus(online) {
  statusDot.classList.toggle('online', online);
  statusDot.classList.toggle('offline', !online);
}

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    setStatus(res.ok);
  } catch {
    setStatus(false);
  }
}

// ----- Initialisation -----
checkHealth();
renderHistory();
renderMessages();
