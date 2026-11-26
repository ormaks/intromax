import { createInterface } from "node:readline";
import { Writable } from "node:stream";

/**
 * Terminal questions, including ones whose answer isn't echoed (passwords).
 *
 * Every line read is queued and each question takes the next one, so piped
 * input (all lines arriving at once) works as well as typing. readline
 * echoes what's typed by writing it to its output stream, so a hidden
 * question mutes that stream until its answer arrives.
 */
export function createPrompter() {
  let muted = false;
  const output = new Writable({
    write(chunk, encoding, done) {
      if (!muted) process.stdout.write(chunk, encoding);
      done();
    },
  });
  const rl = createInterface({
    input: process.stdin,
    output,
    terminal: Boolean(process.stdin.isTTY),
  });

  const queued: string[] = [];
  const waiting: { resolve: (line: string) => void; reject: () => void }[] = [];
  let ended = false;
  rl.on("line", (line) => {
    const next = waiting.shift();
    if (next) next.resolve(line);
    else queued.push(line);
  });
  rl.on("close", () => {
    ended = true;
    for (const next of waiting.splice(0)) next.reject();
  });

  function nextLine(): Promise<string> {
    const line = queued.shift();
    if (line !== undefined) return Promise.resolve(line);
    return new Promise((resolve, reject) => {
      const fail = () => reject(new Error("Input ended before an answer."));
      if (ended) fail();
      else waiting.push({ resolve, reject: fail });
    });
  }

  return {
    async ask(question: string) {
      // readline redraws its prompt when the line is edited (e.g. on
      // backspace), so the question is set as that prompt.
      rl.setPrompt(question);
      rl.prompt();
      return (await nextLine()).trim();
    },
    async askHidden(question: string) {
      process.stdout.write(question);
      rl.setPrompt("");
      muted = true;
      try {
        return await nextLine();
      } finally {
        muted = false;
        process.stdout.write("\n");
      }
    },
    close() {
      rl.close();
    },
  };
}
