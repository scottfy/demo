# Python HTTP Web Server for AI News Writing Assistant
# Run with: python server.py

import http.server
import socketserver
import os

PORT = 8089
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("====================================================")
        print(f"  AI News Writing Assistant Web Server Started!")
        print(f"  URL: http://localhost:{PORT}/")
        print("====================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
