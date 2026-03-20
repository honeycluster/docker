#!/usr/bin/env bash
# ralph-parallel.sh — Run multiple Ralph PRDs simultaneously in isolated git worktrees
#
# Usage:
#   ./ralph-parallel.sh [OPTIONS] <prd1.json> [prd2.json ...]
#   ./ralph-parallel.sh [OPTIONS] --dir <directory-of-prd-jsons>
#
# Options:
#   --tool amp|claude     AI tool to use (default: amp)
#   --iterations N        Max iterations per Ralph instance (default: 10)
#   --agent <name>        Agent to use (default: implementer). See .claude/agents/ralph-*.md
#   --phase <name>        Run a phase pipeline: plan, implement, test, review, full
#   --dir <path>          Run all *.json files in a directory as PRDs
#   --no-symlink          Copy node_modules instead of symlinking (slower, safer)
#   --align-every N       Run alignment check every N iterations (default: 0 = disabled)
#   --align-tool amp|claude  Tool for alignment agent (default: same as --tool)
#   --help                Show this help
#
# Examples:
#   ./ralph-parallel.sh offer.json escrow.json
#   ./ralph-parallel.sh --tool claude --iterations 15 offer.json escrow.json
#   ./ralph-parallel.sh --dir scripts/ralph/prds/
#   ./ralph-parallel.sh --align-every 3 --dir scripts/ralph/prds/
#
# Workflow:
#   1. Create a PRD:              /prd  → tasks/prd-<feature>.md
#   2. Convert to Ralph JSON:     /ralph → when prompted to save, use
#                                          scripts/ralph/prds/<feature>.json
#                                          (NOT scripts/ralph/prd.json — that is
#                                          for single-feature sequential runs only)
#   3. Repeat for each feature, then run:
#        bash scripts/ralph/ralph-parallel.sh scripts/ralph/prds/*.json
#   4. Merge when done:
#        bash scripts/ralph/ralph-merge.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKTREES_DIR="$REPO_ROOT/.worktrees"

TOOL="claude"
MAX_ITERATIONS=10
AGENT=""
PHASE=""
SYMLINK_MODULES=true
ALIGN_EVERY=0
ALIGN_TOOL=""
PRDFILES=()

# ── Argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)         TOOL="$2";                shift 2 ;;
    --tool=*)       TOOL="${1#*=}";           shift ;;
    --iterations|-n) MAX_ITERATIONS="$2";    shift 2 ;;
    --iterations=*) MAX_ITERATIONS="${1#*=}"; shift ;;
    --align-every)  ALIGN_EVERY="$2";       shift 2 ;;
    --align-every=*) ALIGN_EVERY="${1#*=}"; shift ;;
    --agent)        AGENT="$2";             shift 2 ;;
    --agent=*)      AGENT="${1#*=}";        shift ;;
    --phase)        PHASE="$2";            shift 2 ;;
    --phase=*)      PHASE="${1#*=}";       shift ;;
    --align-tool)   ALIGN_TOOL="$2";        shift 2 ;;
    --align-tool=*) ALIGN_TOOL="${1#*=}";   shift ;;
    --dir)
      PRDDIR="$2"; shift 2
      while IFS= read -r -d '' f; do PRDFILES+=("$f"); done \
        < <(find "$PRDDIR" -maxdepth 1 -name '*.json' -print0 | sort -z)
      ;;
    --no-symlink)   SYMLINK_MODULES=false;    shift ;;
    --help|-h)
      sed -n '2,15p' "$0" | sed 's/^# \?//'
      exit 0 ;;
    -*)             echo "Unknown option: $1" >&2; exit 1 ;;
    *)              PRDFILES+=("$1");         shift ;;
  esac
done

if [[ ${#PRDFILES[@]} -eq 0 ]]; then
  echo "Usage: $0 [--tool amp|claude] [--iterations N] <prd1.json> [prd2.json ...]" >&2
  echo "Run '$0 --help' for full usage." >&2
  exit 1
fi

if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: --tool must be 'amp' or 'claude'" >&2
  exit 1
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

# Extract the "## Codebase Patterns" section from a progress.txt file.
# This carries forward accumulated learnings into each new worktree.
extract_codebase_patterns() {
  local src="$1"
  [[ ! -f "$src" ]] && return
  awk '
    /^## Codebase Patterns/ { found=1 }
    found && /^# Ralph Progress Log/ { exit }
    found { print }
  ' "$src"
}

# ── Validate PRDs and plan worktrees ──────────────────────────────────────────
declare -a BRANCHES NAMES WORKTREES LOGS

echo "Ralph Parallel — validating ${#PRDFILES[@]} PRD(s)..."
echo ""

for PRDFILE in "${PRDFILES[@]}"; do
  PRDFILE="$(realpath "$PRDFILE")"
  if [[ ! -f "$PRDFILE" ]]; then
    echo "Error: PRD file not found: $PRDFILE" >&2
    exit 1
  fi

  BRANCH=$(jq -r '.branchName // empty' "$PRDFILE" 2>/dev/null)
  if [[ -z "$BRANCH" ]]; then
    echo "Error: No 'branchName' field in $PRDFILE" >&2
    exit 1
  fi

  # Check for duplicate branches
  for b in "${BRANCHES[@]+"${BRANCHES[@]}"}"; do
    if [[ "$b" == "$BRANCH" ]]; then
      echo "Error: Duplicate branchName '$BRANCH' in PRD files" >&2
      exit 1
    fi
  done

  NAME="${BRANCH#ralph/}"
  WORKTREE="$WORKTREES_DIR/$NAME"
  LOG="$WORKTREES_DIR/$NAME.log"

  BRANCHES+=("$BRANCH")
  NAMES+=("$NAME")
  WORKTREES+=("$WORKTREE")
  LOGS+=("$LOG")

  echo "  ✓ $BRANCH ($PRDFILE)"
done

echo ""
mkdir -p "$WORKTREES_DIR"

# ── Spin up worktrees ─────────────────────────────────────────────────────────
PIDS=()

for i in "${!PRDFILES[@]}"; do
  PRDFILE="$(realpath "${PRDFILES[$i]}")"
  BRANCH="${BRANCHES[$i]}"
  NAME="${NAMES[$i]}"
  WORKTREE="${WORKTREES[$i]}"
  LOG="${LOGS[$i]}"

  echo "▶ Setting up worktree: $BRANCH"

  # Create or reuse the worktree
  if [[ -d "$WORKTREE" ]]; then
    echo "  Worktree already exists, reusing: $WORKTREE"
  else
    if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$BRANCH" 2>/dev/null; then
      git -C "$REPO_ROOT" worktree add "$WORKTREE" "$BRANCH"
    else
      git -C "$REPO_ROOT" worktree add -b "$BRANCH" "$WORKTREE" HEAD
    fi
  fi

  # Symlink (or skip) node_modules — worktrees share the repo's installed deps
  if [[ "$SYMLINK_MODULES" == true ]]; then
    if [[ ! -e "$WORKTREE/node_modules" ]]; then
      ln -s "$REPO_ROOT/node_modules" "$WORKTREE/node_modules"
    fi
  fi

  # Set up the ralph directory inside the worktree
  RALPH_DIR="$WORKTREE/scripts/ralph"
  mkdir -p "$RALPH_DIR/archive"

  cp "$SCRIPT_DIR/CLAUDE.md"  "$RALPH_DIR/"
  cp "$SCRIPT_DIR/ralph.sh"   "$RALPH_DIR/"
  [[ -f "$SCRIPT_DIR/prompt.md" ]] && cp "$SCRIPT_DIR/prompt.md" "$RALPH_DIR/"

  # Write the PRD for this instance
  cp "$PRDFILE" "$RALPH_DIR/prd.json"

  # Initialize progress.txt: carry forward codebase patterns, fresh log header
  {
    extract_codebase_patterns "$SCRIPT_DIR/progress.txt"
    echo ""
    echo "# Ralph Progress Log"
    echo "Started: $(date)"
    echo "---"
  } > "$RALPH_DIR/progress.txt"

  echo "  Launching → log: $LOG"

  # Run ralph.sh in background.
  # Each line is prefixed with [feature-name] and printed to the terminal in
  # real time via awk. tee writes the raw (unprefixed) output to the log file
  # so per-feature logs remain clean. set -o pipefail ensures the subshell
  # exits with ralph.sh's exit code, not awk's.
  (
    set -o pipefail
    cd "$WORKTREE"
    RALPH_PARALLEL=1 bash scripts/ralph/ralph.sh --tool "$TOOL" ${AGENT:+--agent "$AGENT"} ${PHASE:+--phase "$PHASE"} "$MAX_ITERATIONS" 2>&1 | \
      tee "$LOG" | \
      awk -v name="$NAME" '{ printf "[%s] %s\n", name, $0; fflush() }'
  ) &

  PIDS+=("$!")
  echo "  PID: ${PIDS[-1]}"
  echo ""
done

# ── Running ───────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "All ${#PIDS[@]} Ralph instance(s) running — output streaming below."
echo "Raw logs (no prefix) also written to:"
for LOG in "${LOGS[@]}"; do
  echo "  $LOG"
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Alignment check helper ────────────────────────────────────────────────────
ALIGN_TOOL="${ALIGN_TOOL:-$TOOL}"
ALIGN_LOG="$WORKTREES_DIR/alignment.log"
ALIGN_COUNT=0

run_alignment_check() {
  ALIGN_COUNT=$((ALIGN_COUNT + 1))
  local report_file="$WORKTREES_DIR/alignment-report-${ALIGN_COUNT}.md"

  echo ""
  echo "┌──────────────────────────────────────────────────────────────┐"
  echo "│  ALIGNMENT CHECK #${ALIGN_COUNT}                                        │"
  echo "└──────────────────────────────────────────────────────────────┘"

  # Build worktree list as context for the agent
  local worktree_info=""
  for idx in "${!NAMES[@]}"; do
    local wt_branch="${BRANCHES[$idx]}"
    local wt_path="${WORKTREES[$idx]}"
    local wt_prd
    wt_prd="$(realpath "${PRDFILES[$idx]}")"
    worktree_info="${worktree_info}
- Branch: ${wt_branch}
  Worktree: ${wt_path}
  PRD: ${wt_prd}"
  done

  # Invoke the branch-alignment agent — it already knows what to check.
  # We only pass it the worktree locations.
  local prompt="Check alignment between these branches:
${worktree_info}"

  if [[ "$ALIGN_TOOL" == "amp" ]]; then
    echo "$prompt" | amp --agent branch-alignment --dangerously-allow-all 2>&1 | tee "$report_file" | \
      awk '{ printf "[alignment] %s\n", $0; fflush() }' || true
  else
    echo "$prompt" | CLAUDECODE= claude --agent branch-alignment --dangerously-skip-permissions --print 2>&1 | tee "$report_file" | \
      awk '{ printf "[alignment] %s\n", $0; fflush() }' || true
  fi

  echo ""
  echo "  Alignment report saved: $report_file"

  # ── Inject findings into each worktree's progress.txt ──
  # Ralph reads progress.txt (especially "Codebase Patterns") at the start of
  # every iteration, so appending here ensures the next iteration sees the
  # alignment feedback and can self-correct.
  if [[ -f "$report_file" ]]; then
    for idx in "${!WORKTREES[@]}"; do
      local wt_progress="${WORKTREES[$idx]}/scripts/ralph/progress.txt"
      if [[ -f "$wt_progress" ]]; then
        {
          echo ""
          echo "## $(date '+%Y-%m-%d %H:%M') - ALIGNMENT CHECK #${ALIGN_COUNT} (cross-branch)"
          echo "The alignment agent compared all parallel branches and found the following."
          echo "**If any CRITICAL items below affect YOUR branch, fix them in your next story.**"
          echo ""
          sed 's/\x1b\[[0-9;]*m//g' "$report_file" | grep -v '<promise>' || true
          echo "---"
        } >> "$wt_progress"
        echo "  Injected into: $wt_progress"
      fi
    done
  fi
  echo ""
}

BASE_COMMIT_COUNT=$(git -C "$REPO_ROOT" rev-list --count HEAD 2>/dev/null || echo "0")

# ── Wait for all instances (with alignment checks) ───────────────────────────
FAILED=()
declare -A PID_DONE
LAST_ALIGN_ITERATION=0

if [[ "$ALIGN_EVERY" -gt 0 ]]; then
  echo "Alignment checks enabled every $ALIGN_EVERY iterations (per branch)"
fi
echo ""

while true; do
  ALL_DONE=true

  for i in "${!PIDS[@]}"; do
    PID="${PIDS[$i]}"
    [[ -n "${PID_DONE[$PID]:-}" ]] && continue

    if ! kill -0 "$PID" 2>/dev/null; then
      if wait "$PID" 2>/dev/null; then
        echo "✓ ${NAMES[$i]} — completed"
        PID_DONE[$PID]="ok"
      else
        echo "✗ ${NAMES[$i]} — failed"
        PID_DONE[$PID]="fail"
        FAILED+=("${NAMES[$i]}")
      fi
    else
      ALL_DONE=false
    fi
  done

  $ALL_DONE && break

  # Count total iterations across all branches by counting commits
  TOTAL_ITERATIONS=0
  for idx in "${!BRANCHES[@]}"; do
    wt="${WORKTREES[$idx]}"
    if [[ -d "$wt/.git" ]] || [[ -f "$wt/.git" ]]; then
      count=$(git -C "$wt" rev-list --count HEAD 2>/dev/null || echo "0")
      branch_commits=$((count - BASE_COMMIT_COUNT))
      TOTAL_ITERATIONS=$((TOTAL_ITERATIONS + (branch_commits > 0 ? branch_commits : 0)))
    fi
  done

  # Alignment check (if enabled)
  if [[ "$ALIGN_EVERY" -gt 0 ]] && [[ $TOTAL_ITERATIONS -gt 0 ]] && \
     [[ $((TOTAL_ITERATIONS - LAST_ALIGN_ITERATION)) -ge $ALIGN_EVERY ]]; then
    LAST_ALIGN_ITERATION=$TOTAL_ITERATIONS
    run_alignment_check
  fi

  sleep 30
done

# ── Final alignment check (always, if multiple branches) ─────────────────────
if [[ ${#PRDFILES[@]} -gt 1 ]]; then
  echo ""
  echo "Running final pre-merge alignment check..."
  run_alignment_check
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ ${#FAILED[@]} -eq 0 ]]; then
  echo "All instances completed successfully!"
else
  echo "${#FAILED[@]} instance(s) failed: ${FAILED[*]}"
  echo "Review logs:"
  for NAME in "${FAILED[@]}"; do
    echo "  cat $WORKTREES_DIR/$NAME.log"
  done
fi

echo ""
echo "Review branches:"
for BRANCH in "${BRANCHES[@]}"; do
  echo "  git log --oneline main..$BRANCH"
done

echo ""
echo "Merge when ready:"
for BRANCH in "${BRANCHES[@]}"; do
  echo "  git merge $BRANCH"
done

echo ""
echo "Clean up worktrees:"
for NAME in "${NAMES[@]}"; do
  echo "  git worktree remove --force .worktrees/$NAME"
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[[ ${#FAILED[@]} -eq 0 ]] && exit 0 || exit 1
