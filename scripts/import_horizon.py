"""Convert Horizon's newest daily Markdown brief into the website's JSON feed."""
from __future__ import annotations

import argparse
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ITEM_START = re.compile(r"^## \[(?P<title>.+?)\]\((?P<link>https?://[^)]+)\).*?(?P<score>\d+(?:\.\d+)?)/10$", re.M)


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"\\([()])", r"\1", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def find_latest(directory: Path) -> Path:
    chinese = sorted(directory.glob("horizon-*-zh.md"), key=lambda path: path.stat().st_mtime, reverse=True)
    files = chinese or sorted(directory.glob("horizon-*.md"), key=lambda path: path.stat().st_mtime, reverse=True)
    if not files:
        raise FileNotFoundError(f"No Horizon summaries found in {directory}")
    return files[0]


def parse(markdown: str) -> list[dict]:
    matches = list(ITEM_START.finditer(markdown))
    items = []
    for index, match in enumerate(matches):
        section = markdown[match.end(): matches[index + 1].start() if index + 1 < len(matches) else len(markdown)]
        paragraphs = [clean(block) for block in re.split(r"\n\s*\n", section) if block.strip()]
        summary = next((block for block in paragraphs if not block.startswith(("**Background**", "**Discussion**", "**Tags**")) and "路" not in block), "")
        tags = re.search(r"\*\*Tags\*\*:\s*(.+)", section)
        items.append({
            "source": "Horizon AI 精选",
            "title": clean(match.group("title")),
            "link": html.unescape(match.group("link")),
            "excerpt": summary[:500],
            "published": "",
            "sort_date": "",
            "importance": float(match.group("score")),
            "tags": clean(tags.group(1)) if tags else "",
        })
    return items


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", default=r"D:\AI-News-Horizon\data\summaries")
    parser.add_argument("--output", default=str(Path(__file__).parents[1] / "public" / "data" / "latest.json"))
    args = parser.parse_args()
    source = find_latest(Path(args.source_dir))
    items = parse(source.read_text(encoding="utf-8"))
    if not items:
        raise ValueError(f"No items could be parsed from {source}")
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "sources": ["Horizon + DeepSeek", "OpenAI News", "Hugging Face", "GitHub Blog"],
        "items": items,
        "failures": [],
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported {len(items)} Horizon items from {source.name} into {output}")


if __name__ == "__main__":
    main()
