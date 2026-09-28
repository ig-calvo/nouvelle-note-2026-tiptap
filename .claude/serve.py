#!/usr/bin/env python3
"""Static file server for the Omnimed prototype bundle.

Launched by .claude/launch.json via `preview_start`. Runs as an absolute
script path (not `-m http.server` / `-c`) so Python never puts the
inaccessible launch CWD on sys.path, and serves an explicit absolute
directory so os.getcwd() is never called — both fail under the preview
sandbox's forbidden working directory.

The bundle was moved out of ~/Downloads (a macOS TCC-protected folder the
preview subprocess cannot read) to this home-folder location.
"""
import os
import functools
import http.server
import socketserver

ROOT = "/Users/ignaciocalvo/Prototypes nouvelles note/nouvelle-note-2026-tiptap/project"
PORT = int(os.environ.get("PORT", "8000"))

# Best-effort: move off the (possibly forbidden) inherited CWD. Not required
# because the handler is pinned to ROOT below, so failure here is harmless.
try:
    os.chdir(ROOT)
except OSError:
    pass

socketserver.TCPServer.allow_reuse_address = True
class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.endswith('.jsx') or self.path.split('?')[0].endswith('.jsx'):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

Handler = functools.partial(NoCacheHandler, directory=ROOT)

# ThreadingTCPServer, not the plain (single-connection-at-a-time) TCPServer :
# the loader in Note Clinique.html fetches ~35 files (scripts, styles, the
# two CIM-10 JSON files) in one burst on every reload. A browser opens
# several concurrent connections per origin for that burst, and a
# single-threaded server can only complete them one at a time — the rest
# queue on the OS backlog and some get reset, which the browser reports as
# net::ERR_CONNECTION_RESET and can leave the app stuck on a script that
# never loaded (React's error boundary does not retry on its own).
class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True

with ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.serve_forever()
