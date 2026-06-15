# Agent Instructions

## Local Development Server

- Never use `localhost:8000` for this repo.
- Use `localhost:2500` for the local static server unless that port is already in use.
- Start the app with:

```bash
python3 -m http.server 2500
```

- Before starting a server, check whether a server is already running and avoid killing unrelated `http.server` processes.
