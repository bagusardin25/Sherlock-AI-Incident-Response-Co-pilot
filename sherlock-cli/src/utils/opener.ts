import { spawn } from "child_process";

/**
 * Cross-platform "open URL/file in default app".
 * Resolves to true on success (process spawned), false otherwise.
 *
 * Uses the OS shell handler so it picks up the user's default browser:
 *   - Windows: `cmd /c start "" <url>`
 *   - macOS:   `open <url>`
 *   - Linux:   `xdg-open <url>`
 */
export function openUrl(url: string): boolean {
  try {
    let command: string;
    let args: string[];

    if (process.platform === "win32") {
      command = "cmd";
      // The empty quoted string after `start` is the title argument; required
      // to avoid it being interpreted as the URL when the URL contains spaces.
      args = ["/c", "start", "", url];
    } else if (process.platform === "darwin") {
      command = "open";
      args = [url];
    } else {
      command = "xdg-open";
      args = [url];
    }

    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      shell: false,
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
