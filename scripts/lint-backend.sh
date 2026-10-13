#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"

uv run --extra dev --locked ruff check .
uv run --extra dev --locked ruff format --check .
