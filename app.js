const key = "ai-morning-magazine-saved";
const savedCount = document.querySelector("#saved-count");
const dialog = document.querySelector("#saved-dialog");
const savedList = document.querySelector("#saved-list");
const emptySaved = document.querySelector("#empty-saved");

function savedItems() { return JSON.parse(localStorage.getItem(key) || "[]"); }
function render() {
  const items = savedItems();
  savedCount.textContent = items.length;
  savedList.innerHTML = items.map(item => `<li>${item}</li>`).join("");
  emptySaved.hidden = items.length > 0;
  document.querySelectorAll(".save").forEach(button => {
    const isSaved = items.includes(button.dataset.title);
    button.classList.toggle("saved", isSaved);
    button.textContent = isSaved ? "已收藏" : "收藏";
  });
}
function bindSaveButtons() { document.querySelectorAll(".save").forEach(button => button.addEventListener("click", () => {
  const items = savedItems(); const title = button.dataset.title;
  localStorage.setItem(key, JSON.stringify(items.includes(title) ? items.filter(item => item !== title) : [...items, title]));
  render();
})); }
document.querySelector("#show-saved").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
async function loadIssue() {
  try {
    const response = await fetch("data/latest.json", { cache: "no-store" });
    if (!response.ok) throw new Error("资讯数据尚未生成");
    const issue = await response.json();
    const items = issue.items || [];
    document.querySelector("#issue-date").textContent = `今日更新 · ${new Date(issue.updated_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}`;
    document.querySelector("#cover-lede").textContent = `已从 ${issue.sources.join("、")} 的官方更新中，为你挑出 ${items.length} 条近期资讯。`;
    const headline = items[0];
    if (headline) {
      document.querySelector("#headline-category").textContent = headline.source;
      document.querySelector("#headline-title").textContent = headline.title;
      document.querySelector("#headline-summary").textContent = headline.excerpt || `这是 ${headline.source} 的最新官方更新。点击“阅读原文”查看完整内容。`;
      document.querySelector("#headline-link").href = headline.link;
      document.querySelector("#headline-link").previousElementSibling;
      document.querySelector(".hero-story .save").dataset.title = headline.title;
    }
    document.querySelector("#brief-grid").innerHTML = items.slice(1, 4).map((item, index) => `<article class="brief-card ${index === 1 ? "accent" : ""}"><p class="category">${item.source}</p><h3>${item.title}</h3><p>${item.excerpt || "点击阅读来自官方的完整更新。"}</p><p><a href="${item.link}" target="_blank" rel="noreferrer">阅读原文 ↗</a></p><button class="save" type="button" data-title="${item.title.replaceAll('"', '&quot;')}">收藏</button></article>`).join("");
  } catch (error) {
    document.querySelector("#issue-date").textContent = "尚未生成今日资讯";
    document.querySelector("#cover-lede").textContent = "在项目文件夹运行 py collect_news.py 后刷新本页。";
  }
  bindSaveButtons(); render();
}
loadIssue();
