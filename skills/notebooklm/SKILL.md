---
name: notebooklm
version: 1.0.0
description: "Google NotebookLM: Create notebooks, add sources, run analysis, and generate audio overviews, mind maps, flashcards, and infographics."
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["notebooklm"]
    installHint: 'pip install "notebooklm-py[browser]" && playwright install chromium && notebooklm login'
    cliHelp: "notebooklm --help"
---

# notebooklm

Unofficial Python CLI and API for Google NotebookLM. Provides programmatic access to capabilities beyond the web UI, including batch artifact generation and export formats not available in the browser.

```bash
notebooklm [-p PROFILE] [--storage PATH] [-v|--quiet] <command> [OPTIONS]
```

**PREREQUISITE:** Authenticate before first use:
```bash
pip install "notebooklm-py[browser]"
playwright install chromium
notebooklm login          # opens browser for Google OAuth
```

---

## Notebook Management

```bash
# List all notebooks
notebooklm list [--json]

# Create a notebook
notebooklm create "My Research" [--json]
# → returns { "notebook": { "id": "<id>", "title": "..." } }

# Set the active notebook (persists in session context)
notebooklm use <notebook_id>

# Show current status (active notebook, auth state)
notebooklm status

# Rename a notebook
notebooklm rename <notebook_id> "New Title"

# Delete a notebook (requires confirmation)
notebooklm delete <notebook_id>

# Get notebook summary
notebooklm summary [-n <notebook_id>]
```

> Always prefer `-n <notebook_id>` over `notebooklm use` in parallel or scripted workflows to avoid context conflicts.

---

## Adding Sources

Sources are processed asynchronously. Add `--wait` to block until ready, or poll with `notebooklm source status`.

### URLs and YouTube

```bash
# Add a web URL or YouTube video
notebooklm source add "https://example.com/article" [-n <notebook_id>] [--wait]
notebooklm source add "https://www.youtube.com/watch?v=<video_id>" [-n <notebook_id>] [--wait]
```

### Local Files

Supported: PDF, TXT, Markdown, Word (.docx), EPUB, audio (MP3/WAV), video (MP4), images (PNG/JPG).

```bash
notebooklm source add "./paper.pdf" [-n <notebook_id>] [--wait]
notebooklm source add "./notes.md" [-n <notebook_id>] [--wait]
```

### Pasted Text

```bash
notebooklm source add --text "Paste your raw text content here..." [-n <notebook_id>]
```

### Google Drive

```bash
notebooklm source add "https://docs.google.com/document/d/<doc_id>" [-n <notebook_id>] [--wait]
```

### Bulk / Research Agent

```bash
# Auto-discover and import web sources on a topic
notebooklm source add-research "quantum computing" --mode deep [-n <notebook_id>]
```

### Manage Sources

```bash
# List sources in the active notebook
notebooklm source list [-n <notebook_id>] [--json]

# Check processing status of a source
notebooklm source status <source_id> [-n <notebook_id>]

# Remove a source
notebooklm source remove <source_id> [-n <notebook_id>]
```

---

## Chat / Analysis

```bash
# Ask a question about the sources
notebooklm ask "What are the key themes?" [-n <notebook_id>] [--json]

# Continue conversation (uses history)
notebooklm ask "Can you expand on the second point?" [-n <notebook_id>]

# View conversation history
notebooklm history [-n <notebook_id>]

# Configure chat persona / instructions
notebooklm configure --persona "Act as a skeptical scientist" [-n <notebook_id>]
```

The `--json` flag returns `{ "answer": "...", "references": [{ "source_id": "...", "text": "..." }] }`.

---

## Generating Deliverables

All `generate` commands are async by default (returns a `task_id` immediately). Use `--wait` to block, or poll with `notebooklm artifact wait <task_id>`.

### Audio Overview (Podcast)

```bash
# Deep-dive conversation (default)
notebooklm generate audio [-n <notebook_id>] [--wait]
notebooklm generate audio "focus on practical applications" [-n <notebook_id>] [--wait]

# Style variants
notebooklm generate audio --style brief    # short overview
notebooklm generate audio --style critique # critical analysis
notebooklm generate audio --style debate   # debate format

# Download as MP3
notebooklm download audio ./overview.mp3 [-n <notebook_id>]
```

### Mind Map

```bash
# Generate hierarchical mind map
notebooklm generate mindmap [-n <notebook_id>] [--wait]

# Download as JSON
notebooklm download mindmap ./mindmap.json [-n <notebook_id>]
```

Mind map JSON structure:
```json
{ "root": { "label": "...", "children": [ { "label": "...", "children": [] } ] } }
```

### Flashcards / Quiz

```bash
# Generate flashcards
notebooklm generate quiz [-n <notebook_id>] [--wait]
notebooklm generate quiz --difficulty hard [-n <notebook_id>] [--wait]

# Download in multiple formats
notebooklm download quiz --format json     ./flashcards.json  [-n <notebook_id>]
notebooklm download quiz --format markdown ./flashcards.md    [-n <notebook_id>]
notebooklm download quiz --format html     ./flashcards.html  [-n <notebook_id>]
```

### Infographic

```bash
# Generate infographic
notebooklm generate infographic [-n <notebook_id>] [--wait]
notebooklm generate infographic --orientation landscape [-n <notebook_id>] [--wait]

# Download as PNG
notebooklm download infographic ./infographic.png [-n <notebook_id>]
```

### Other Artifacts

| Deliverable | Generate | Download formats |
|-------------|----------|-----------------|
| Video | `generate video [--style whiteboard\|explainer\|cinematic]` | MP4 |
| Slide deck | `generate slides [--style detailed\|presenter]` | PDF, PPTX |
| Report / Study guide | `generate report` | Markdown, PDF |
| Data table | `generate table "columns: name, value, date"` | CSV |

---

## Waiting for Async Tasks

```bash
# Block until a task completes (returns exit 0 on success, 2 on timeout)
notebooklm artifact wait <task_id> [--timeout 300] [--interval 10]

# List all artifacts and their status
notebooklm artifact list [-n <notebook_id>] [--json]

# Batch download all ready artifacts
notebooklm download all ./output-dir/ [-n <notebook_id>]
```

---

## Common Workflows

### Research to Audio Overview

```bash
NB=$(notebooklm create "AI Safety Research" --json | jq -r '.notebook.id')
notebooklm source add "https://arxiv.org/abs/..." -n "$NB" --wait
notebooklm source add "https://www.youtube.com/watch?v=..." -n "$NB" --wait
notebooklm generate audio "make it engaging and accessible" -n "$NB" --wait
notebooklm download audio ./ai-safety-overview.mp3 -n "$NB"
```

### Full Deliverables Suite

```bash
NB=$(notebooklm create "Topic Deep Dive" --json | jq -r '.notebook.id')
notebooklm source add "./research.pdf" -n "$NB" --wait
notebooklm source add "https://youtube.com/watch?v=..." -n "$NB" --wait

# Launch all generation tasks in parallel (non-blocking)
AUDIO_TASK=$(notebooklm generate audio -n "$NB" --json | jq -r '.task_id')
MAP_TASK=$(notebooklm generate mindmap -n "$NB" --json | jq -r '.task_id')
QUIZ_TASK=$(notebooklm generate quiz -n "$NB" --json | jq -r '.task_id')
INFO_TASK=$(notebooklm generate infographic -n "$NB" --json | jq -r '.task_id')

# Wait for each
notebooklm artifact wait "$AUDIO_TASK"
notebooklm artifact wait "$MAP_TASK"
notebooklm artifact wait "$QUIZ_TASK"
notebooklm artifact wait "$INFO_TASK"

# Download
mkdir -p ./output
notebooklm download audio       ./output/overview.mp3       -n "$NB"
notebooklm download mindmap     ./output/mindmap.json        -n "$NB"
notebooklm download quiz --format markdown ./output/flashcards.md -n "$NB"
notebooklm download infographic ./output/infographic.png     -n "$NB"
```

### Document Q&A

```bash
notebooklm create "Document Analysis" | notebooklm use -
notebooklm source add "./contract.pdf" --wait
notebooklm ask "What are the key obligations for each party?" --json | jq '.answer'
notebooklm ask "List any termination clauses."
```

---

## Output & Parsing (--json)

| Field | Path |
|-------|------|
| Notebook ID | `.notebook.id` |
| Source ID | `.source.id` |
| Task ID | `.task_id` |
| Answer text | `.answer` |
| Source citations | `.references[].source_id` |
| Artifact status | `.artifact.status` |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NOTEBOOKLM_PROFILE` | Active profile name |
| `NOTEBOOKLM_NOTEBOOK` | Default notebook ID (avoids `-n` flag) |
| `NOTEBOOKLM_HOME` | Configuration directory |
| `NOTEBOOKLM_AUTH_JSON` | Inline auth JSON for headless environments |
| `NOTEBOOKLM_HL` | Default output language for artifacts |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (not found, processing failed, auth error) |
| `2` | Timeout (wait commands only) |
| `130` | Interrupted (SIGINT) |

---

## Tips

- Use `--json` on all commands for reliable parsing in scripts.
- Use explicit `-n <notebook_id>` instead of `notebooklm use` in parallel workflows.
- Generation is rate-limited by Google — space out heavy batch jobs.
- `notebooklm doctor` diagnoses auth and dependency issues.
- Run `notebooklm auth refresh` if requests start failing with 401s.
