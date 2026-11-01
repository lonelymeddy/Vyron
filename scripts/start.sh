#!/usr/bin/env bash
set -e

# VYRON AI — Unified Startup Shell Script
# Runs backend initialization and launches python start.py

export PYTHONPATH="${PYTHONPATH:-}:$(pwd)/backend"
python3 start.py
