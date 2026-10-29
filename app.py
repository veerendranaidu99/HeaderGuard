from flask import Flask, render_template_string, request
import requests
from urllib.parse import urlparse
from datetime import datetime

app = Flask(__name__)

SECURITY_HEADERS = {
    "Content-Security-Policy": "Helps prevent cross-site scripting and content injection.",
    "Strict-Transport-Security": "Enforces HTTPS connections.",
    "X-Content-Type-Options": "Prevents MIME-type sniffing.",
    "X-Frame-Options": "Helps prevent clickjacking.",
    "Referrer-Policy": "Controls referrer information sent by the browser.",
    "Permissions-Policy": "Controls access to browser features."
}

HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HeaderGuard | Security Scanner</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#0b1120;color:#e5e7eb;font-family:Arial,sans-serif}
header{padding:22px 6%;background:#111b2e;border-bottom:1px solid #26354e}
header h1{margin:0;color:#4adebb}
header p{color:#9ca3af;margin-bottom:0}
main{max-width:1100px;margin:32px auto;padding:0 20px}
.panel,.card{background:#111b2e;border:1px solid #26354e;border-radius:12px;padding:22px;margin-bottom:20px}
form{display:flex;gap:10px;flex-wrap:wrap}
input{flex:1;min-width:220px;padding:14px;background:#0b1120;color:white;border:1px solid #40516b;border-radius:8px}
button{padding:13px 20px;background:#14b8a6;color:#05201e;border:0;border-radius:8px;font-weight:bold;cursor:pointer}
button:hover{background:#5eead4}
button:focus,input:focus{outline:2px solid #5eead4;outline-offset:2px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px}
.stat strong{display:block;font-size:28px;margin-top:10px}
.good{color:#4ade80}.bad{color:#fb7185}.muted{color:#9ca3af}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:13px;border-bottom:1px solid #26354e;vertical-align:top}
th{color:#9ca3af}
footer{text-align:center;color:#64748b;padding:30px}
@media(max-width:600px){table{font-size:13px}th,td{padding:8px}}
</style>
</head>
<body>
<header>
  <h1>🛡️ HeaderGuard</h1>
  <p>Website Security Header Analyzer</p>
</header>
<main>
  <section class="panel">
    <h2>Scan a website</h2>
    <p class="muted">Enter a public website URL to inspect its HTTP security headers.</p>
    <form method="post">
      <input name="url" type="url" placeholder="https://example.com"
             value="{{ url }}" required>
      <button type="submit">Analyze Headers</button>
    </form>
    {% if error %}<p class="bad">{{ error }}</p>{% endif %}
  </section>

  {% if result %}
  <section class="stats">
    <div class="card stat">Security score<strong>{{ result.score }}/100</strong></div>
    <div class="card stat">Headers present<strong class="good">{{ result.present }}</strong></div>
    <div class="card stat">Headers missing<strong class="bad">{{ result.missing }}</strong></div>
  </section>

  <section class="panel">
    <h2>Scan report</h2>
    <p>Target: <strong>{{ result.url }}</strong></p>
    <p class="muted">HTTP status: {{ result.status }} · Scanned at {{ result.time }}</p>
    <table>
      <thead><tr><th>Security header</th><th>Status</th><th>Purpose</th></tr></thead>
      <tbody>
      {% for item in result.headers %}
      <tr>
        <td>{{ item.name }}</td>
        <td class="{{ 'good' if item.present else 'bad' }}">{{ 'Present' if item.present else 'Missing' }}</td>
        <td>{{ item.purpose }}</td>
      </tr>
      {% endfor %}
      </tbody>
    </table>
    <p class="muted">A present header is not automatically a correctly configured header. Review values and test the website in context.</p>
    <button type="button" onclick="window.print()">Print / Save Report</button>
    <button type="button" onclick="location.href='/'">New Scan</button>
  </section>
  {% endif %}
</main>
<footer>HeaderGuard · Educational cybersecurity project · Scan only authorized public targets</footer>
</body>
</html>
"""

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    error = ""
    url = ""

    if request.method == "POST":
        url = request.form.get("url", "").strip()
        parsed = urlparse(url)

        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            error = "Enter a valid http:// or https:// URL."
        elif parsed.username or parsed.password:
            error = "URLs containing usernames or passwords are not allowed."
        else:
            try:
                response = requests.get(
                    url,
                    timeout=8,
                    allow_redirects=True,
                    headers={"User-Agent": "HeaderGuard-College-Project/1.0"}
                )

                # Do not follow redirects to non-public or local addresses.
                # For a real deployment, enforce DNS/IP checks on every hop.
                final_host = urlparse(response.url).hostname or ""
                if final_host.lower() in (
                    "localhost", "127.0.0.1", "::1", "0.0.0.0"
                ) or final_host.lower().endswith(".local"):
                    raise ValueError("Redirect to a local host was blocked.")

                received = {key.lower(): value for key, value in response.headers.items()}
                rows = []
                for name, purpose in SECURITY_HEADERS.items():
                    rows.append({
                        "name": name,
                        "purpose": purpose,
                        "present": name.lower() in received
                    })

                present = sum(1 for row in rows if row["present"])
                missing = len(rows) - present
                score = round(present / len(rows) * 100)

                result = {
                    "url": response.url,
                    "status": response.status_code,
                    "present": present,
                    "missing": missing,
                    "score": score,
                    "headers": rows,
                    "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            except requests.RequestException:
                error = "Could not reach the website. Check the URL and internet connection."
            except ValueError as exc:
                error = str(exc)

    return render_template_string(HTML, result=result, error=error, url=url)

if __name__ == "__main__":
    app.run(debug=True)