const STORAGE_KEY = "cha-gpt-messages-v1";
const THEME_KEY = "cha-gpt-theme";

const chatLog = document.querySelector("#chatLog");
const emptyState = document.querySelector("#emptyState");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const newChatButton = document.querySelector("#newChatButton");
const clearChatButton = document.querySelector("#clearChatButton");
const historyTitle = document.querySelector("#historyTitle");
const openSidebarButton = document.querySelector("#openSidebar");
const closeSidebarButton = document.querySelector("#closeSidebar");
const scrim = document.querySelector("#scrim");
const themeButton = document.querySelector("#themeButton");
const promptButtons = Array.from(document.querySelectorAll(".prompt-chip"));

let messages = loadMessages();
let isReplying = false;
let replyTimer = 0;
let chatVersion = 0;

setTheme(loadTheme());
renderMessages();
resizeInput();

form.addEventListener("submit", handleSubmit);
input.addEventListener("input", () => {
  resizeInput();
  updateSendState();
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

newChatButton.addEventListener("click", startNewChat);
clearChatButton.addEventListener("click", startNewChat);
openSidebarButton.addEventListener("click", openSidebar);
closeSidebarButton.addEventListener("click", closeSidebar);
scrim.addEventListener("click", closeSidebar);
themeButton.addEventListener("click", toggleTheme);

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent.trim();
    resizeInput();
    updateSendState();
    form.requestSubmit();
  });
});

function handleSubmit(event) {
  event.preventDefault();

  const content = input.value.trim();
  if (!content || isReplying) {
    return;
  }

  addMessage("user", content);
  input.value = "";
  resizeInput();
  updateSendState();
  closeSidebar();

  isReplying = true;
  updateSendState();
  showTyping();

  const version = chatVersion;
  replyTimer = window.setTimeout(() => {
    if (version !== chatVersion) {
      return;
    }

    hideTyping();
    addMessage("assistant", makeMaw());
    isReplying = false;
    updateSendState();
    input.focus();
  }, 420 + Math.round(Math.random() * 560));
}

function addMessage(role, content) {
  messages.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content
  });

  saveMessages();
  renderMessages();
}

function renderMessages() {
  chatLog.querySelectorAll(".message").forEach((message) => message.remove());
  emptyState.hidden = messages.length > 0;

  const fragment = document.createDocumentFragment();
  messages.forEach((message) => {
    fragment.appendChild(createMessageElement(message));
  });

  chatLog.appendChild(fragment);
  updateHistory();
  scrollToBottom();
}

function createMessageElement(message) {
  const article = document.createElement("article");
  article.className = `message message-${message.role}`;

  const inner = document.createElement("div");
  inner.className = "message-inner";

  const avatar = document.createElement(message.role === "assistant" ? "img" : "div");
  avatar.className = `avatar ${message.role}-avatar`;

  if (message.role === "assistant") {
    avatar.src = "assets/cha-mark.svg";
    avatar.alt = "";
  } else {
    avatar.textContent = "You";
  }

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = message.content;

  inner.append(avatar, content);
  article.appendChild(inner);
  return article;
}

function showTyping() {
  hideTyping();

  const typing = document.createElement("article");
  typing.className = "message message-assistant typing-message";
  typing.innerHTML = `
    <div class="message-inner">
      <img class="avatar assistant-avatar" src="assets/cha-mark.svg" alt="">
      <div class="message-content">
        <span class="typing-dots" aria-label="Cha-GPT is typing">
          <span></span><span></span><span></span>
        </span>
      </div>
    </div>
  `;

  chatLog.appendChild(typing);
  scrollToBottom();
}

function hideTyping() {
  chatLog.querySelector(".typing-message")?.remove();
}

function makeMaw() {
  const fixedReplies = ["Mawmawmaw", "Mawmaw"];
  if (Math.random() < 0.5) {
    return fixedReplies[Math.floor(Math.random() * fixedReplies.length)];
  }

  const count = randomInt(1, 12);
  return Array.from({ length: count }, (_, index) => (index === 0 ? "Maw" : "maw")).join("");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startNewChat() {
  chatVersion += 1;
  window.clearTimeout(replyTimer);
  isReplying = false;
  messages = [];
  saveMessages();
  hideTyping();
  renderMessages();
  closeSidebar();
  input.focus();
}

function updateHistory() {
  const firstUserMessage = messages.find((message) => message.role === "user");
  historyTitle.textContent = firstUserMessage ? trimTitle(firstUserMessage.content) : "Fresh chat";
}

function trimTitle(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 38 ? `${clean.slice(0, 35)}...` : clean;
}

function updateSendState() {
  sendButton.disabled = isReplying || input.value.trim().length === 0;
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 168)}px`;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatLog.scrollTop = chatLog.scrollHeight;
  });
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
  openSidebarButton.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  openSidebarButton.setAttribute("aria-expanded", "false");
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch {
    return;
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(isValidMessage) : [];
  } catch {
    return [];
  }
}

function saveMessages() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    return;
  }
}

function isValidMessage(message) {
  return (
    message &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}
