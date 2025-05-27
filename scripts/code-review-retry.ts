import { spawn } from "child_process";
import * as readline from "readline";

// rxjs 🎈
import { EMPTY, fromEvent, timer, Subscription } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";

const COMMAND = "codex";
const ARGS = [
  "-a",
  "auto-edit",
  "--quiet",
  `Review the code diff in "diff.patch" and provide a comprehensive code review with the following structure:
1. **Overview**: Briefly summarize the purpose and scope of the code changes.
2. **Detailed Review**:
   - For each change, explain what was modified and why.
   - Highlight any potential bugs, security issues, or anti-patterns.
   - Suggest improvements, refactorings, or optimizations.
   - Use markdown diff syntax to propose code changes where appropriate.
   - Add inline comments referencing specific lines or sections.
3. **Best Practices**: Point out adherence to or violations of best practices, coding standards, and design principles.
4. **References**: Add links to relevant documentation, articles, or resources for further reading.
5. **Emojis**: Use emojis to make the review engaging and highlight important points.
6. **Summary Table**: At the end, include a checklist or table summarizing key findings and action items.
Write the code review to ./review.md in markdown format. Be constructive, concise, and actionable.`,
];

const MAX_RETRIES = 5;
const GRACE_PERIOD_MS = 20_000; // 20 s ⏲️

/**
 * Spawns the Codex CLI and watches its output. If, after emitting a JSON line
 * with a `type` of `reasoning`, the CLI stays silent for more than
 * `GRACE_PERIOD_MS`, the process is killed and restarted (up to
 * `MAX_RETRIES`).
 */
function runCommandWithWatch(retriesLeft: number): void {
  if (retriesLeft <= 0) {
    console.error("Maximum retry attempts reached. Exiting with failure.");
    process.exit(1);
  }

  const proc = spawn(COMMAND, ARGS, { stdio: ["ignore", "pipe", "pipe"] });

  /** Standard output *********************************************************/
  const rl = readline.createInterface({ input: proc.stdout });

  // Convert each "line" event from readline into an RxJS stream.
  const line$ = fromEvent(rl, "line").pipe(
    map((line) => line as string),
    tap((line) => console.log("[stdout]", line)),
  );

  /*
   * Watchdog logic 🐶
   * When we observe a JSON line whose `type` is "reasoning" we start a timer.
   * Any subsequent non-reasoning line cancels (switches) the timer. If the
   * timer ever elapses it means Codex has gone quiet and we should kill &
   * retry.
   */
  const watchdogSub = line$
    .pipe(
      map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return undefined;
        }
      }),
      map((obj) => obj?.type === "reasoning"),
      switchMap((isReasoning) =>
        isReasoning ? timer(GRACE_PERIOD_MS) : EMPTY,
      ),
    )
    .subscribe(() => {
      console.log("No output received in grace period. Killing process.");
      watchdogSub.unsubscribe();
      proc.kill();
      runCommandWithWatch(retriesLeft - 1);
    });

  /** Standard error **********************************************************/
  fromEvent<Buffer>(proc.stderr, "data")
    .pipe(tap((data) => console.error("[stderr]", data.toString())))
    .subscribe();

  /** Process termination *****************************************************/
  proc.on("exit", () => {
    watchdogSub.unsubscribe();
  });
}

runCommandWithWatch(MAX_RETRIES);
