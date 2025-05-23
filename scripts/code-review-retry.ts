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
const GRACE_PERIOD_MS = 60_000;

function runCommandWithWatch(retriesLeft: number): void {
  console.log(`Starting codex process. Retries left: ${retriesLeft}`);
  const proc = spawn(COMMAND, ARGS, { stdio: ["ignore", "pipe", "pipe"] });

  let graceTimer: NodeJS.Timeout | null = null;

  function resetGraceTimer() {
    if (graceTimer) clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
      console.warn(
        'No output within 10 seconds after "reasoning" message. Restarting process...',
      );
      proc.kill("SIGKILL");
      if (retriesLeft > 0) {
        runCommandWithWatch(retriesLeft - 1);
      } else {
        console.error("Max retries reached. Exiting.");
      }
    }, GRACE_PERIOD_MS);
  }

  const rl = readline.createInterface({ input: proc.stdout });

  rl.on("line", (line) => {
    console.log("[stdout]", line);
    try {
      const obj = JSON.parse(line);
      if (obj?.type === "reasoning") {
        console.log("[trigger] Reasoning detected — starting grace period");
        resetGraceTimer();
      } else if (graceTimer) {
        console.log("[progress] Output received — resetting grace period");
        resetGraceTimer();
      }
    } catch {
      if (graceTimer) {
        console.log(
          "[progress] Non-JSON output received — resetting grace period",
        );
        resetGraceTimer();
      }
    }
  });

  proc.stderr.on("data", (data) => {
    console.error("[stderr]", data.toString());
  });

  proc.on("exit", (code) => {
    if (graceTimer) clearTimeout(graceTimer);
    if (code === 0) {
      console.log("codex completed successfully.");
    } else {
      console.warn(`codex exited with code ${code}.`);
      if (retriesLeft > 0) {
        runCommandWithWatch(retriesLeft - 1);
      } else {
        console.error("Max retries reached. Exiting.");
      }
    }
  });
}

runCommandWithWatch(MAX_RETRIES);
