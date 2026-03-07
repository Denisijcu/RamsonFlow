# RansomFlow 🔴
**HTB Machine #6 | Vertex Coders LLC**  
Difficulty: Medium | OS: Linux | Category: AI / Web

---

## Overview

RansomFlow is a fictional AI-powered workflow automation platform built for ransomware operators. It features a full-stack application with Angular 19 frontend, NestJS backend, LM Studio AI integration, n8n automation, and NFS storage — all intentionally vulnerable for HTB gameplay.

---

## Stack

| Service | Tech | Port |
|---|---|---|
| Frontend | Angular 19 + Tailwind | 80 |
| Backend | NestJS + TypeScript | 3000 |
| LM Proxy | Node.js | 4000 |
| NFS Storage | Node.js HTTP | 5000 |
| n8n | Automation | 5678 |
| Nginx | Reverse Proxy | 8080 |

---

## Quick Start

```bash
git clone https://github.com/Denisijcu/ransomflow
cd ransomflow

# Configure environment
cp .env.example .env
# Edit .env — set LM_STUDIO_URL and DEFAULT_MODEL

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

> **Requires:** Docker, Docker Compose, LM Studio running on host with a model loaded.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `LM_STUDIO_URL` | LM Studio host URL | `http://host.docker.internal:1234` |
| `DEFAULT_MODEL` | Model ID loaded in LM Studio | `google/gemma-3-4b` |
| `API_MODE` | LM Studio API format (`auto`/`native`/`openai`) | `auto` |
| `TELEGRAM_BOT_TOKEN` | Optional — for n8n notifications | — |

---

## Credentials

| Service | Username | Password |
|---|---|---|
| Frontend / API | admin@ransomflow.htb | admin123 |
| Frontend / API | flowuser@ransomflow.htb | Fl0wUs3r! |
| NFS Storage | storageadmin | Fl0wSt0r@ge2026 |
| n8n | admin | n8nAdmin2026! |

---

## Project Structure

```
ransomflow/
├── frontend/          # Angular 19 — dark hacker UI
├── backend/           # NestJS — vulnerable API
├── lm-studio-proxy/   # Node.js — LM Studio adapter
├── nfs-storage/       # Node.js — misconfigured file server
├── scripts/           # ransom.py encryptor + setup.sh
├── docker-compose.yml
└── .env.example
```

---

*Vertex Coders LLC — Miami, FL*  
*HTB Creator Submission #6*