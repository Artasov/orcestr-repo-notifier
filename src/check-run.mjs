import {readFileSync, appendFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
const eventName = process.env.GITHUB_EVENT_NAME || "";
const refName = branchName(process.env.GITHUB_REF_NAME || "");
const payload = readJson(process.env.GITHUB_EVENT_PATH);
const customTask = process.env.ORCESTR_NOTIFIER_CUSTOM_TASK || "";
const notifyBranches = parseList(process.env.ORCESTR_NOTIFIER_NOTIFY_BRANCHES || "");
const requireCommitMarker = parseBoolean(process.env.ORCESTR_NOTIFIER_REQUIRE_COMMIT_MARKER || "false");
const commitMarker = (process.env.ORCESTR_NOTIFIER_COMMIT_MARKER || "").trim() || "[notifier]";

function readJson(path) {
  if (!path) return {};

  try {
    return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return {};
  }
}

function parseList(value) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value) {
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function branchName(ref) {
  return String(ref)
    .replace(/^refs\/heads\//, "")
    .replace(/^refs\/tags\//, "");
}

function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, ".*")}$`);
}

function matchesBranch(branch, patterns) {
  if (patterns.length === 0) return true;
  return patterns.some((pattern) => globToRegExp(pattern).test(branch));
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: workspace,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  return result.status === 0 ? result.stdout.trim() : "";
}

function resolveDiffRange() {
  const before = payload.before || "";
  const after = payload.after || process.env.GITHUB_SHA || "";
  const zeroSha = /^0+$/.test(before);

  if (before && after && !zeroSha) return `${before}..${after}`;
  if (after) return `${after}^..${after}`;
  return "HEAD";
}

function pushCommitMessages() {
  const messages = [];

  if (payload.head_commit?.message) {
    messages.push(String(payload.head_commit.message));
  }

  if (Array.isArray(payload.commits)) {
    for (const commit of payload.commits) {
      if (commit?.message) messages.push(String(commit.message));
    }
  }

  if (messages.length > 0) {
    return messages;
  }

  return runGit(["log", "--format=%B%x00", resolveDiffRange()])
    .split("\0")
    .map((message) => message.trim())
    .filter(Boolean);
}

function setOutputs(values) {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    for (const [key, value] of Object.entries(values)) {
      console.log(`${key}=${value}`);
    }
    return;
  }

  appendFileSync(
    outputPath,
    Object.entries(values)
      .map(([key, value]) => `${key}=${String(value).replace(/\r?\n/g, " ")}`)
      .join("\n") + "\n",
    "utf8",
  );
}

function allow(reason) {
  console.log(`Orcestr Repo Notifier will run: ${reason}`);
  setOutputs({"should_run": "true", "skip_reason": ""});
}

function skip(reason) {
  console.log(`Orcestr Repo Notifier skipped: ${reason}`);
  setOutputs({"should_run": "false", "skip_reason": reason});
}

if (eventName !== "push") {
  allow(`event ${eventName || "unknown"} is not a push event`);
} else if (customTask.trim()) {
  allow("custom-task is set");
} else if (!matchesBranch(refName || branchName(payload.ref || ""), notifyBranches)) {
  skip(`branch ${refName || payload.ref || "unknown"} does not match notify-branches`);
} else if (requireCommitMarker && !pushCommitMessages().some((message) => message.includes(commitMarker))) {
  skip(`no pushed commit message contains ${commitMarker}`);
} else {
  allow("push filters matched");
}
