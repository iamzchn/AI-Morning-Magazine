"""Collect recent items from trusted AI and developer RSS feeds.

No API key is needed. Run this script whenever you want a new issue:
    py collect_news.py
"""
from __future__ import annotations

import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

FEEDS = {
    "OpenAI": "https://openai.com/news/rss.xml",
    "Hugging Face": "https://huggingface.co/blog/feed.xml",
    "GitHub Blog": "https://github.blog/feed/",
}
ATOM = "{http://www.w3.org/2005/Atom}"


def text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    raw = "".join(element.itertext())
    return re.sub(r"\s+", " ", html.unescape(raw)).strip()


def parse_date(value: str) -> datetime:
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc)
    except (TypeError, ValueError):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
        except ValueError:
            return datetime(1970, 1, 1, tzinfo=timezone.utc)


def fetch_feed(source: str, url: str) -> list[dict]:
    request = urllib.request.Request(url, headers={"User-Agent": "AI-Morning-Magazine/0.1"})
    with urllib.request.urlopen(request, timeout=25) as response:
        root = ET.fromstring(response.read())
    entries = root.findall(".//item") or root.findall(f".//{ATOM}entry")
    items = []
    for entry in entries[:8]:
        is_atom = entry.tag.endswith("entry")
        title = text(entry.find(f"{ATOM}title" if is_atom else "title"))
        link = ""
        if is_atom:
            link_node = entry.find(f"{ATOM}link[@rel='alternate']") or entry.find(f"{ATOM}link")
            link = link_node.get("href", "") if link_node is not None else ""
        else:
            link = text(entry.find("link"))
        description = text(entry.find(f"{ATOM}summary" if is_atom else "description"))
        published = text(entry.find(f"{ATOM}updated" if is_atom else "pubDate"))
        if title and link:
            items.append({"source": source, "title": title, "link": link, "excerpt": description[:260], "published": published, "sort_date": parse_date(published).isoformat()})
    return items


def main() -> None:
    all_items = []
    failures = []
    for source, url in FEEDS.items():
        try:
            all_items.extend(fetch_feed(source, url))
        except Exception as error:  # One failed source must not stop the issue.
            failures.append(f"{source}: {error}")
    all_items.sort(key=lambda item: item["sort_date"], reverse=True)
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "sources": list(FEEDS),
        "items": all_items[:9],
        "failures": failures,
    }
    target = Path(__file__).parent / "data" / "latest.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Collected {len(payload['items'])} items into {target}")
    if failures:
        print("Some sources failed:", "; ".join(failures))


if __name__ == "__main__":
    main()
