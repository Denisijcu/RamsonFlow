#!/bin/bash
# RansomFlow — Setup Script
# Vertex Coders LLC

set -e

echo "╔══════════════════════════════════════════╗"
echo "║     RansomFlow — Docker Stack Setup      ║"
echo "║     Vertex Coders LLC                    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check deps
for cmd in docker docker-compose; do
  command -v $cmd &>/dev/null || { echo "[!] $cmd not found"; exit 1; }
done

# Create .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[+] Created .env from template — edit LM_STUDIO_URL if needed"
fi

echo "[*] Building containers..."
docker-compose build --no-cache

echo "[*] Starting stack..."
docker-compose up -d

echo ""
echo "[+] RansomFlow Stack running!"
echo ""
echo "  Frontend (Angular):   http://localhost:80"
echo "  Backend (NestJS):     http://localhost:3000"
echo "  API Docs (Swagger):   http://localhost:3000/docs"
echo "  LM Proxy:             http://localhost:4000"
echo "  LM Settings:          http://localhost:4000/settings"
echo "  NFS Storage:          http://localhost:5000"
echo "  n8n Automation:       http://localhost:5678"
echo "  Nginx Proxy:          http://localhost:8080"
echo ""
echo "  Default login: admin@ransomflow.htb / admin123"
echo ""
echo "[!] HTB Mode: Docker socket exposed — machine ready for challenge"
