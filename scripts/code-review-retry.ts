import { spawn } from "child_process";
import * as readline from "readline";

const COMMAND = "codex";
const ARGS = [
  "-a",
  "auto-edit",
  "--quiet",
  'review the code diff in "diff.patch" and perform a code review, include an overview of the code changes, potential bugs, and potential improvements. Use emojis and mermaid diagrams where appropriate. Write the code review to ./review.md in markdown format',
];

const MAX_RETRIES = 5;

const GRACE_PERIOD_MS = 20_000;

function runCommandWithWatch(retriesLeft: number): void {
  // If we've exhausted all retries, exit the script with a non-zero code so the CI job fails.
  if (retriesLeft <= 0) {
    console.error("Maximum retry attempts reached. Exiting with failure.");
    process.exit(1);
  }
  const proc = spawn(COMMAND, ARGS, { stdio: ["ignore", "pipe", "pipe"] });

  const rl = readline.createInterface({ input: proc.stdout });

  let graceTimeout: NodeJS.Timeout | null = null;

  rl.on("line", (line) => {
    console.log("[stdout]", line);
    try {
      const obj = JSON.parse(line);
      if (obj?.type === "reasoning") {
        graceTimeout = setTimeout(() => {
          console.log("No output received in grace period. Killing process.");
          proc.kill();
          runCommandWithWatch(retriesLeft - 1);
        }, GRACE_PERIOD_MS);
      } else {
        if (graceTimeout) clearTimeout(graceTimeout);
      }
    } catch {}
  });

  proc.stderr.on("data", (data) => {
    console.error("[stderr]", data.toString());
  });

  proc.on("exit", () => {
    if (graceTimeout) clearTimeout(graceTimeout);
  });
}

runCommandWithWatch(MAX_RETRIES);
