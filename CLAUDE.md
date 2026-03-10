# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

Projects for the **Office of Medical Education (OME)** at John A Burns School of Medicine (JABSOM), University of Hawaiʻi. Project types:
- **Automations**: Python/JS scripts for OME workflow automation
- **KMS Work**: Data pipelines and migrations targeting Notion (primary KMS)
- **Committee Projects**: Tools supporting Ed Tech Committee, Curriculum Committee, and others
- **Instructional Apps**: Interactive learning modules — Unity3D (C#) for anatomy/XR and web-based apps. XR lab is branded **XRCore** (one word, never "XR Core")
- **Claude API Integrations**: AI-powered tools using the Anthropic SDK

## Notion as Primary KMS

Notion is the central knowledge store for OME. This Claude session has the **Claude AI Notion MCP** integration connected — use it for reading, searching, updating, and creating Notion content directly.

Key Notion spaces:
- **Primary board**: [Dashboard](https://www.notion.so/2fbee4627a7481f6a504dafe64440d44) — top-level hub for all departments
- **Teamspace**: "John A Burns School of Medicine" (main OME workspace, ID: `2a4ee462-7a74-81b8-806a-004260608016`)
- **Teamspace**: "XRCore" (instructional app / XR development)
- **OME page**: [Office of Medical Education (OME)](https://www.notion.so/2fbee4627a7481d08e08d90da95c55b4)
- **Ed Tech**: [Educational Technology](https://www.notion.so/2fbee4627a7481b18b7bed9672b14b97) (committee hub)
- **XRCore projects**: XRCore 3D Kanban (Unity-based anatomy apps)

### Notion MCP Usage
Available MCP tools (prefix: `mcp__claude_ai_Notion__`):
- `notion-search` — semantic search across the workspace
- `notion-fetch` — retrieve full page or database content
- `notion-create-pages` — create new pages or database entries
- `notion-update-page` — update page properties or content
- `notion-query-database-view` — query a specific database view
- `notion-query-meeting-notes` — retrieve meeting notes

Always search Notion before creating new content to avoid duplication.

## Tech Stack by Project Type

| Project Type | Language | Key Tools |
|---|---|---|
| Automations | Python | pip, requests, python-dotenv |
| KMS / Notion work | Python or JS | `notion-client` / `@notionhq/client` |
| Google Workspace | Python or JS | `google-api-python-client` |
| Web Instructional Apps | TypeScript/JS | npm, React or vanilla TS |
| Unity Instructional Apps | C# | Unity3D, Unity Package Manager |
| AI Integrations | Python or JS | `anthropic` / `@anthropic-ai/sdk` |

## Package Managers
- Python: `pip` with `requirements.txt`
- JavaScript/TypeScript: `npm`
- Unity: Unity Package Manager (UPM) via `manifest.json`

## Common Commands

### Python projects
```bash
pip install -r requirements.txt
python main.py
python -m pytest
python -m pytest tests/test_foo.py::test_bar   # single test
```

### JS/TS projects
```bash
npm install
npm run dev
npm test
npm run test -- --testNamePattern="test name"  # single test
```

### Unity projects
- Open project folder in Unity Hub
- Builds via Unity Editor: File → Build Settings

## Environment Variables
Notion and Claude API access are handled via MCP integrations — no API keys needed for those. For any standalone scripts that call Google APIs directly, use a `.env` file (never commit):

```
GOOGLE_APPLICATION_CREDENTIALS=   # path to service account JSON
```

Load with `python-dotenv` (Python) or `dotenv` (JS).
