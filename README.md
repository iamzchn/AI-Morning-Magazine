# AI 晨读

一个面向手机与电脑的 AI 每日精选杂志原型。

## 打开方式

直接双击 `index.html`，或在此目录运行：

```powershell
py -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 下一步

## 更新真实资讯

运行 `py collect_news.py`。它会抓取 OpenAI、Hugging Face、GitHub Blog 的官方 RSS 更新，生成 `data/latest.json`，网页刷新后会自动显示真实内容。

此功能借鉴了开源 RSS 聚合项目的做法，但不需要部署多个复杂服务。
