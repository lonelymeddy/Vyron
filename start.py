#!/usr/bin/env python3
"""
VYRON AI — Unified Frontend & Backend Production/Dev Runner.

This script launches:
  1. Backend: FastAPI running via Uvicorn on an internal port (default: 8000).
  2. Frontend: Next.js running on the public $PORT (or 3000), which proxies
     /api/*, /static/uploads/*, /docs, and /openapi.json to the backend.

Both processes run concurrently, stream their logs, and terminate together
cleanly upon receiving SIGINT or SIGTERM.
"""

import os
import signal
import subprocess
import sys
import time
import socket

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0

def wait_for_port(port: int, host: str = "127.0.0.1", timeout: float = 15.0) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            if s.connect_ex((host, port)) == 0:
                return True
        time.sleep(0.2)
    return False

def main():
    repo_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(repo_root)

    # Public port for the web service (Render, Railway, Heroku pass $PORT)
    public_port = int(os.environ.get("PORT", "3000"))

    # Internal port for FastAPI backend
    backend_port = int(os.environ.get("BACKEND_PORT", "8000"))
    if backend_port == public_port:
        backend_port = 8001

    backend_internal_url = f"http://127.0.0.1:{backend_port}"
    print(f"==================================================")
    print(f" VYRON AI — CREATE BEYOND REALITY")
    print(f" Unified Frontend & Backend Orchestrator")
    print(f" Public Port  : {public_port} (Next.js with API Proxy)")
    print(f" Backend Port : {backend_port} (FastAPI Engine)")
    print(f"==================================================")

    # 1. Initialize database schema
    print("[VYRON] Initializing database schema...")
    env_backend = os.environ.copy()
    env_backend["PYTHONPATH"] = os.path.join(repo_root, "backend")
    init_db_path = os.path.join(repo_root, "backend", "app", "db", "init_db.py")
    try:
        subprocess.run([sys.executable, init_db_path], env=env_backend, check=True)
    except Exception as err:
        print(f"[VYRON] Warning during DB initialization: {err}")

    # 2. Launch FastAPI backend
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(backend_port),
    ]
    print(f"[VYRON] Launching FastAPI backend on 127.0.0.1:{backend_port}...")
    backend_proc = subprocess.Popen(backend_cmd, env=env_backend)

    # Wait for backend to be ready
    if not wait_for_port(backend_port, timeout=10.0):
        print(f"[VYRON] Warning: Backend did not report ready on port {backend_port} within timeout.")

    # 3. Launch Next.js frontend
    env_frontend = os.environ.copy()
    env_frontend["PORT"] = str(public_port)
    env_frontend["BACKEND_INTERNAL_URL"] = backend_internal_url
    # Ensure client-side requests in browser use relative origin unless overridden
    if "NEXT_PUBLIC_API_URL" not in env_frontend:
        env_frontend["NEXT_PUBLIC_API_URL"] = ""

    # Choose between production 'next start' or fallback 'next dev'
    next_dist = os.path.join(repo_root, "frontend", ".next")
    frontend_mode = "start" if os.path.isdir(next_dist) else "dev"
    print(f"[VYRON] Launching Next.js frontend in '{frontend_mode}' mode on port {public_port}...")

    frontend_cmd = ["npm", "--prefix", "frontend", "run", frontend_mode]
    if frontend_mode == "start":
        frontend_cmd.extend(["--", "-p", str(public_port), "-H", "0.0.0.0"])
    else:
        frontend_cmd.extend(["--", "-p", str(public_port), "-H", "0.0.0.0"])

    frontend_proc = subprocess.Popen(frontend_cmd, env=env_frontend)

    # Process management and signal handler
    procs = [backend_proc, frontend_proc]

    def shutdown(signum, frame):
        print("\n[VYRON] Shutting down unified servers gracefully...")
        try:
            # Terminate process group if available or individual processes
            for p in procs:
                if p.poll() is None:
                    p.terminate()
        except OSError:
            pass
        time.sleep(1)
        for p in procs:
            if p.poll() is None:
                try:
                    p.kill()
                except OSError:
                    pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Monitor processes
    while True:
        time.sleep(1)
        if backend_proc.poll() is not None:
            print(f"[VYRON] Backend process exited unexpectedly with code {backend_proc.returncode}")
            shutdown(None, None)
            break
        if frontend_proc.poll() is not None:
            print(f"[VYRON] Frontend process exited unexpectedly with code {frontend_proc.returncode}")
            shutdown(None, None)
            break

if __name__ == "__main__":
    main()
