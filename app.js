const key = "ai-morning-magazine-saved";
const savedCount = document.querySelector("#saved-count");
const dialog = document.querySelector("#saved-dialog");
const savedList = document.querySelector("#saved-list");
const emptySaved = document.querySelector("#empty-saved");

const escapeHtml = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const savedItems = () => JSON.parse(localStorage.getItem(key) || "[]");

function renderSaved() {
  const items = savedItems();
  savedCount.textContent = items.length;
  savedList.innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  emptySaved.hidden = items.length > 0;
  document.querySelectorAll(".save").forEach(button => {
    const isSaved = items.includes(button.dataset.title);
    button.classList.toggle("saved", isSaved);
    button.textContent = isSaved ? "已收藏" : "收藏";
  });
}

function bindSaveButtons() {
  document.querySelectorAll(".save").forEach(button => button.addEventListener("click", () => {
    const items = savedItems();
    const title = button.dataset.title;
    localStorage.setItem(key, JSON.stringify(items.includes(title) ? items.filter(item => item !== title) : [...items, title]));
    renderSaved();
  }));
}

function bilingualTitle(item) {
  const chinese = item.title_zh || item.title || "未命名资讯";
  const english = item.title_en || "";
  return `<h3>${escapeHtml(chinese)}</h3>${english && english !== chinese ? `<p class="english-title">${escapeHtml(english)}</p>` : ""}`;
}

function newsCard(item) {
  const chineseSummary = item.summary_zh || item.excerpt || "暂无中文解读。";
  const englishSummary = item.summary_en || "";
  const score = Number.isFinite(Number(item.importance)) ? `${Number(item.importance).toFixed(1)}/10` : "待评分";
  return `<article class="news-card"><div class="news-card-header"><p class="category">${escapeHtml(item.source || "AI 资讯")}</p><strong class="news-score">${score}</strong></div>${bilingualTitle(item)}<p class="zh-summary">${escapeHtml(chineseSummary)}</p>${englishSummary ? `<p class="en-summary">${escapeHtml(englishSummary)}</p>` : ""}<div class="news-meta">${item.tags ? `<span>${escapeHtml(item.tags)}</span>` : ""}</div><p><a class="news-link" href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">阅读英文原文 →</a></p><button class="save" type="button" data-title="${escapeHtml(item.title_zh || item.title)}">收藏</button></article>`;
}

async function loadIssue() {
  try {
    const response = await fetch("data/latest.json", { cache: "no-store" });
    if (!response.ok) throw new Error("资讯数据尚未生成");
    const issue = await response.json();
    const items = issue.items || [];
    document.querySelector("#issue-date").textContent = `今日更新 · ${new Date(issue.updated_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}`;
    document.querySelector("#cover-lede").textContent = `已抓取 ${items.length} 条资讯：顶部为高分精选，下方保留全部条目及中英文对照。`;
    document.querySelector("#all-news-count").textContent = `${items.length} 条全部展示`;
    const headline = items[0];
    if (headline) {
      document.querySelector("#headline-category").textContent = headline.source || "AI 资讯";
      document.querySelector("#headline-title").textContent = headline.title_zh || headline.title;
      document.querySelector("#headline-summary").textContent = headline.summary_zh || headline.excerpt || "点击查看原文。";
      document.querySelector("#headline-link").href = headline.link;
      document.querySelector(".hero-story .save").dataset.title = headline.title_zh || headline.title;
    }
    document.querySelector("#brief-grid").innerHTML = items.slice(1, 4).map((item, index) => `<article class="brief-card ${index === 1 ? "accent" : ""}"><p class="category">${escapeHtml(item.source)}</p><h3>${escapeHtml(item.title_zh || item.title)}</h3><p>${escapeHtml(item.summary_zh || item.excerpt || "点击阅读原文。")}</p><p><a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">阅读原文 →</a></p><button class="save" type="button" data-title="${escapeHtml(item.title_zh || item.title)}">收藏</button></article>`).join("");
    document.querySelector("#all-news-grid").innerHTML = items.length ? items.map(newsCard).join("") : '<p class="empty-news">本次没有抓到可展示的资讯。</p>';
  } catch (error) {
    document.querySelector("#issue-date").textContent = "尚未生成今日资讯";
    document.querySelector("#cover-lede").textContent = "数据读取失败，请稍后刷新。";
  }
  bindSaveButtons();
  renderSaved();
}

document.querySelector("#show-saved").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
loadIssue();
