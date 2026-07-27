"""Launch the built morning-magazine website on this computer."""
from __future__ import annotations

import http.server
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_DIR = ROOT / "dist" / "client"
HOST = "127.0.0.1"
PORT = 8765


class SiteHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def log_message(self, format: str, *args: object) -> None:
        """Do not let a closed console output stream interrupt page requests."""


def main() -> None:
    if not SITE_DIR.is_dir():
        raise SystemExit("Website files are missing. Please run npm run build first.")
    server = http.server.ThreadingHTTPServer((HOST, PORT), SiteHandler)
    url = f"http://{HOST}:{PORT}"
    print(f"AI Morning Magazine is running at {url}")
    print("Keep this window open while reading. Press Ctrl+C here when finished.")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nWebsite stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
