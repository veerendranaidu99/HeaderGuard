# HeaderGuard — Website Security Header Analyzer

A beginner-friendly cybersecurity project that checks public HTTPS response headers, scores header presence, explains findings, stores scan history in SQLite, and exports JSON/CSV reports.

## Features
- Flask backend and interactive responsive dashboard
- Checks CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options, COOP, CORP and COEP
- Weighted 0–100 presence score with grade
- SQLite scan history and JSON/CSV exports
- URL validation, HTTPS-only scanning, DNS address checks, TLS verification, request timeout, bounded response read, and redirects disabled
- Pytest starter tests

## Requirements
- Python 3.10 or newer
- VS Code
- Git

## Run locally (Windows PowerShell)
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000 in your browser. Keep the terminal running while you use the app.

If PowerShell blocks virtual-environment activation, use:
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

## Run tests
```powershell
python -m pytest -q
```

## GitHub submission
Create an empty repository on GitHub, then run:
```powershell
git init -b main
git add .
git commit -m "Build HeaderGuard security header analyzer"
git remote add origin https://github.com/YOUR-USERNAME/HeaderGuard.git
git push -u origin main
```
Replace the URL with your repository URL. Never commit credentials, environment files, or the generated `headerguard.db`.

## Security and limitations
Use only against systems you own or are explicitly authorized to assess. This educational tool is not a penetration tester, a compliance certification, or a complete vulnerability scanner. It scores presence only; a present header can still be weak or incorrect. The URL validation is a starter safeguard, not a guarantee suitable for an exposed multi-user production service. Before public deployment, add robust DNS-rebinding-resistant egress controls, rate limiting, authentication, CSRF protection where applicable, logging, and a production WSGI server. Do not run Flask's debug server on a public network.

## Reference
OWASP HTTP Headers Cheat Sheet:
https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
