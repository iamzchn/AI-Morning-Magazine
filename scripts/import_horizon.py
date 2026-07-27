"""Convert Horizon's Chinese and English Markdown briefs into website JSON."""
from __future__ import annotations

import argparse
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ITEM_START = re.compile(r"^## \[(?P<title>.+?)\]\((?P<link>https?://[^)]+)\).*?(?P<score>\d+(?:\.\d+)?)/10$", re.M)
LANG_SUFFIX = re.compile(r"horizon-(?P<date>\d{4}-\d{2}-\d{2})-(?P<language>zh|en)\.md$")


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"\\([()])", r"\1", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def latest_pair(directory: Path) -> tuple[Path, Path | None]:
    chinese = sorted(directory.glob("horizon-*-zh.md"), key=lambda path: path.stat().st_mtime, reverse=True)
    if not chinese:
        raise FileNotFoundError(f"No Chinese Horizon summaries found in {directory}")
    zh_path = chinese[0]
    match = LANG_SUFFIX.search(zh_path.name)
    en_path = directory / f"horizon-{match.group('date')}-en.md" if match else None
    return zh_path, en_path if en_path and en_path.exists() else None


def parse(markdown: str) -> dict[str, dict]:
    matches = list(ITEM_START.finditer(markdown))
    records: dict[str, dict] = {}
    for index, match in enumerate(matches):
        section = markdown[match.end(): matches[index + 1].start() if index + 1 < len(matches) else len(markdown)]
        paragraphs = [clean(block) for block in re.split(r"\n\s*\n", section) if block.strip()]
        summary = next((block for block in paragraphs if not block.startswith(("**Background**", "**Discussion**", "**背景**", "**讨论**", "**标签**")) and " · " not in block), "")
        tags = re.search(r"\*\*(?:Tags|标签)\*\*:\s*(.+)", section)
        link = html.unescape(match.group("link"))
        records[link] = {
            "title": clean(match.group("title")),
            "summary": summary[:700],
            "importance": float(match.group("score")),
            "tags": clean(tags.group(1)) if tags else "",
        }
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", default=r"D:\AI-News-Horizon\data\summaries")
    parser.add_argument("--output", default=str(Path(__file__).parents[1] / "public" / "data" / "latest.json"))
    args = parser.parse_args()
    zh_path, en_path = latest_pair(Path(args.source_dir))
    zh_records = parse(zh_path.read_text(encoding="utf-8"))
    en_records = parse(en_path.read_text(encoding="utf-8")) if en_path else {}
    if not zh_records:
        raise ValueError(f"No items could be parsed from {zh_path}")
    items = []
    for link, zh in zh_records.items():
        en = en_records.get(link, {})
        items.append({
            "source": "Horizon AI 精选",
            "title": zh["title"],
            "title_zh": zh["title"],
            "title_en": en.get("title", ""),
            "link": link,
            "excerpt": zh["summary"],
            "summary_zh": zh["summary"],
            "summary_en": en.get("summary", ""),
            "published": "",
            "sort_date": "",
            "importance": zh["importance"],
            "tags": zh["tags"],
        })
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "sources": ["Horizon + DeepSeek", "OpenAI News", "Hugging Face", "GitHub Blog"],
        "items": items,
        "failures": [],
        "languages": {"zh": zh_path.name, "en": en_path.name if en_path else None},
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported {len(items)} bilingual Horizon items from {zh_path.name} into {output}")


if __name__ == "__main__":
    main()
