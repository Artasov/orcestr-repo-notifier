#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ./.run/release-action.sh v1.0.0
  RELEASE_VERSION=v1.0.0 ./.run/release-action.sh

Options:
  -n, --dry-run  Print commands without running them.
  -h, --help     Show help.

What it does:
  1. Checks that the git working tree is clean.
  2. Checks that the current branch is main.
  3. Pushes main to origin.
  4. Creates an annotated immutable version tag, for example v1.0.0.
  5. Pushes the version tag.
  6. Updates and force-pushes the floating major tag, for example v1.

After that, users can reference the action as:
  uses: Artasov/orcestr-repo-notifier@v1
USAGE
}

dry_run=0
version="${RELEASE_VERSION:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run)
      dry_run=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$version" ]]; then
        echo "Unexpected extra argument: $1" >&2
        usage >&2
        exit 2
      fi
      version="$1"
      shift
      ;;
  esac
done

if [[ -z "$version" ]]; then
  read -r -p "Release version, for example v1.0.0: " version
fi

if [[ ! "$version" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "Version must look like v1.0.0 or v1.0.0-beta.1, got: $version" >&2
  exit 2
fi

major_tag="v${BASH_REMATCH[1]}"
repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

run() {
  echo "+ $*"
  if [[ "$dry_run" != "1" ]]; then
    "$@"
  fi
}

require_clean_tree() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Working tree is not clean. Commit or stash changes before releasing." >&2
    git status --short >&2
    exit 1
  fi
}

require_main_branch() {
  local branch
  branch="$(git branch --show-current)"
  if [[ "$branch" != "main" ]]; then
    echo "Release must be started from main. Current branch: $branch" >&2
    exit 1
  fi
}

require_origin_remote() {
  if ! git remote get-url origin >/dev/null 2>&1; then
    echo "Remote origin is not configured." >&2
    exit 1
  fi
}

require_version_tag_free() {
  if git rev-parse -q --verify "refs/tags/$version" >/dev/null; then
    echo "Local tag already exists: $version" >&2
    exit 1
  fi

  if git ls-remote --exit-code --tags origin "refs/tags/$version" >/dev/null 2>&1; then
    echo "Remote tag already exists: $version" >&2
    exit 1
  fi
}

require_not_behind_origin_main() {
  if ! git rev-parse -q --verify "refs/remotes/origin/main" >/dev/null; then
    return
  fi

  local base
  local remote_head
  base="$(git merge-base HEAD origin/main)"
  remote_head="$(git rev-parse origin/main)"

  if [[ "$base" != "$remote_head" ]]; then
    echo "Local main is behind or diverged from origin/main. Run git pull --ff-only first." >&2
    exit 1
  fi
}

require_clean_tree
require_main_branch
require_origin_remote

run git fetch origin main --tags

require_not_behind_origin_main
require_version_tag_free

echo "Release: $version"
echo "Floating action tag: $major_tag"
echo

run git push origin HEAD:main
run git tag -a "$version" -m "Release $version" HEAD
run git push origin "$version"
run git tag -f -a "$major_tag" -m "Release $version" HEAD
run git push origin "refs/tags/$major_tag" --force

echo
echo "Done."
echo "GitHub Action reference:"
echo "  uses: Artasov/orcestr-repo-notifier@$major_tag"
