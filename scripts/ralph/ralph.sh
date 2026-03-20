#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# Usage: ./ralph.sh [--tool amp|claude] [--agent <agent-name>] [--phase plan|implement|test|review|security] [max_iterations]
#
# Agents (from .claude/agents/):
#   implementer     — Default. Implements user stories from PRD (ralph-implementer.md)
#   tester          — Writes tests using Vitest (ralph-tester.md)
#   planner         — Produces implementation plans (ralph-planner.md)
#   reviewer        — Reviews completed stories (ralph-reviewer.md)
#   build-fixer     — Fixes build/typecheck/test errors (ralph-build-fixer.md)
#   security-reviewer — Security audit (ralph-security-reviewer.md)
#   merger          — Resolves merge conflicts (ralph-merger.md)
#
# Phases (run a predefined sequence of agents):
#   plan            — planner only (1 iteration)
#   implement       — implementer (default behavior)
#   test            — tester only
#   review          — reviewer + security-reviewer
#   full            — plan → implement → test → review (complete pipeline)

set -e

# Parse arguments
TOOL="claude"  # Default to claude
AGENT=""       # Default agent (empty = use CLAUDE.md for backward compat)
PHASE=""       # Optional phase for multi-agent pipeline
MAX_ITERATIONS=10

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    --agent)
      AGENT="$2"
      shift 2
      ;;
    --agent=*)
      AGENT="${1#*=}"
      shift
      ;;
    --phase)
      PHASE="$2"
      shift 2
      ;;
    --phase=*)
      PHASE="${1#*=}"
      shift
      ;;
    *)
      # Assume it's max_iterations if it's a number
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

# Validate tool choice
if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'."
  exit 1
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    # Strip "ralph/" prefix from branch name for folder
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch and check out / create it (skip when called from ralph-parallel.sh)
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"

    REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

    if [ -z "${RALPH_PARALLEL:-}" ]; then
      ACTUAL_BRANCH=$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

      if [ "$ACTUAL_BRANCH" != "$CURRENT_BRANCH" ]; then
        if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$CURRENT_BRANCH" 2>/dev/null; then
          echo "Checking out existing branch: $CURRENT_BRANCH"
          git -C "$REPO_ROOT" checkout "$CURRENT_BRANCH"
        else
          echo "Creating new branch: $CURRENT_BRANCH"
          git -C "$REPO_ROOT" checkout -b "$CURRENT_BRANCH"
        fi
      else
        echo "Already on branch: $CURRENT_BRANCH"
      fi
    fi
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

# Determine working directory from prd.json or fallback
REPO_ROOT="${REPO_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
WORK_DIR=""
if [ -f "$PRD_FILE" ]; then
  WORK_DIR=$(jq -r '.workingDir // empty' "$PRD_FILE" 2>/dev/null || echo "")
fi

if [ -n "$WORK_DIR" ] && [ -d "$REPO_ROOT/$WORK_DIR" ]; then
  cd "$REPO_ROOT/$WORK_DIR"
  echo "Working directory: $REPO_ROOT/$WORK_DIR"
else
  cd "$REPO_ROOT"
  echo "Working directory: $REPO_ROOT"
fi

# ── Resolve agent definition file ────────────────────────────────────────────
AGENTS_DIR="$REPO_ROOT/.claude/agents"
AGENT_FILE=""
STOP_SIGNAL="<promise>COMPLETE</promise>"

resolve_agent() {
  local agent_name="$1"
  local candidate="$AGENTS_DIR/ralph-${agent_name}.md"
  if [[ -f "$candidate" ]]; then
    AGENT_FILE="$candidate"
    # Extract stop_condition from YAML frontmatter
    local stop
    stop=$(awk '/^---$/{n++; next} n==1 && /^stop_condition:/{gsub(/[" ]/, "", $2); print $2; exit}' "$candidate" 2>/dev/null || true)
    if [[ -n "$stop" ]]; then
      STOP_SIGNAL="$stop"
    fi
    echo "  Agent: $agent_name ($candidate)"
    echo "  Stop signal: $STOP_SIGNAL"
  else
    echo "Warning: Agent file not found: $candidate (falling back to CLAUDE.md)"
    AGENT_FILE=""
  fi
}

# ── Phase support: run a sequence of agents ──────────────────────────────────
run_agent_phase() {
  local phase_agent="$1"
  local phase_iters="$2"
  local phase_label="$3"

  echo ""
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "  PHASE: $phase_label (agent: $phase_agent, max: $phase_iters iterations)"
  echo "╚══════════════════════════════════════════════════════════════════╝"

  AGENT="$phase_agent"
  resolve_agent "$AGENT"
  run_iterations "$phase_iters"
}

# ── Core iteration loop ──────────────────────────────────────────────────────
run_iterations() {
  local max="$1"
  for i in $(seq 1 "$max"); do
    echo ""
    echo "==============================================================="
    echo "  Ralph Iteration $i of $max ($TOOL${AGENT:+ / $AGENT})"
    echo "==============================================================="

    # Build the prompt: agent file content + CLAUDE.md context
    local prompt_content=""
    if [[ -n "$AGENT_FILE" && -f "$AGENT_FILE" ]]; then
      prompt_content="$(cat "$AGENT_FILE")

---

$(cat "$SCRIPT_DIR/CLAUDE.md")"
    else
      prompt_content="$(cat "$SCRIPT_DIR/CLAUDE.md")"
    fi

    # Run the selected tool
    TMPOUT=$(mktemp)
    if [[ "$TOOL" == "amp" ]]; then
      echo "$prompt_content" | amp --dangerously-allow-all 2>&1 | tee "$TMPOUT" || true
    else
      echo "$prompt_content" | claude --dangerously-skip-permissions --print 2>&1 | tee "$TMPOUT" || true
    fi
    OUTPUT=$(cat "$TMPOUT")
    rm -f "$TMPOUT"

    # Check for completion signal
    if echo "$OUTPUT" | grep -qF "$STOP_SIGNAL"; then
      echo ""
      echo "Agent completed! Signal: $STOP_SIGNAL"
      echo "Completed at iteration $i of $max"
      return 0
    fi

    echo "Iteration $i complete. Continuing..."
    sleep 2
  done

  echo ""
  echo "Reached max iterations ($max) without completion signal."
  return 1
}

# ── Handle phase-based execution ─────────────────────────────────────────────
if [[ -n "$PHASE" ]]; then
  echo "Starting Ralph - Tool: $TOOL - Phase: $PHASE"

  case "$PHASE" in
    plan)
      run_agent_phase "planner" 1 "Planning"
      ;;
    implement)
      run_agent_phase "implementer" "$MAX_ITERATIONS" "Implementation"
      ;;
    test)
      run_agent_phase "tester" "$MAX_ITERATIONS" "Testing"
      ;;
    review)
      run_agent_phase "reviewer" 1 "Code Review"
      run_agent_phase "security-reviewer" 1 "Security Review"
      ;;
    full)
      run_agent_phase "planner" 1 "Planning"
      run_agent_phase "implementer" "$MAX_ITERATIONS" "Implementation"
      run_agent_phase "tester" "$MAX_ITERATIONS" "Testing"
      run_agent_phase "reviewer" 1 "Code Review"
      run_agent_phase "security-reviewer" 1 "Security Review"
      echo ""
      echo "Full pipeline complete!"
      ;;
    *)
      echo "Error: Unknown phase '$PHASE'. Must be: plan, implement, test, review, full"
      exit 1
      ;;
  esac
  exit $?
fi

# ── Single-agent execution (original behavior + agent support) ───────────────
if [[ -n "$AGENT" ]]; then
  resolve_agent "$AGENT"
fi

echo "Starting Ralph - Tool: $TOOL - Max iterations: $MAX_ITERATIONS${AGENT:+ - Agent: $AGENT}"

if run_iterations "$MAX_ITERATIONS"; then
  echo ""
  echo "Ralph completed all tasks!"
  exit 0
else
  echo "Check $PROGRESS_FILE for status."
  exit 1
fi
