/**
 * Studio File System
 *
 * Git-backed file system using isomorphic-git + lightning-fs
 * Provides undo/redo via git commits
 */

import LightningFS from "@isomorphic-git/lightning-fs";
import git from "isomorphic-git";

// ============================================================================
// Types
// ============================================================================

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface Commit {
  oid: string;
  message: string;
  timestamp: number;
}

// ============================================================================
// Singleton FS Instance
// ============================================================================

let fsInstance: LightningFS | null = null;
let initialized = false;
const subscribers = new Set<() => void>();

/**
 * Get the filesystem instance (creates on first call)
 */
export function getFS(): LightningFS {
  if (!fsInstance) {
    fsInstance = new LightningFS("studio-workspace");
  }
  return fsInstance;
}

/**
 * Initialize git repo if not exists, and sync filesystem to git HEAD
 */
export async function initializeFS(): Promise<void> {
  // Always sync on every call (cold load should sync fresh)
  const fs = getFS();

  let isNewRepo = false;
  try {
    await fs.promises.stat("/.git");
  } catch {
    // No .git folder - initialize repo
    isNewRepo = true;
    await git.init({ fs, dir: "/" });
    // Create a placeholder file for initial commit (git needs at least one file)
    await fs.promises.writeFile("/.gitkeep", "");
    await git.add({ fs, dir: "/", filepath: ".gitkeep" });
    await git.commit({
      fs,
      dir: "/",
      message: "Initial commit",
      author: { name: "Studio", email: "studio@local" },
    });
  }

  // Always sync filesystem to match git HEAD (cleans up orphans)
  if (!isNewRepo) {
    await syncToGitHead();
  }

  initialized = true;
}

/**
 * Sync filesystem to match git HEAD - removes orphaned files/directories
 */
async function syncToGitHead(): Promise<void> {
  const fs = getFS();

  try {
    // Get list of files tracked by git
    const trackedFiles = await git.listFiles({ fs, dir: "/" });
    const trackedSet = new Set(trackedFiles);

    // Walk filesystem and collect all files
    const fsFiles = await walkFilesystem("/");

    // Remove files not tracked by git (orphans)
    for (const file of fsFiles) {
      const relativePath = file.startsWith("/") ? file.slice(1) : file;
      if (!trackedSet.has(relativePath)) {
        try {
          await fs.promises.unlink(file);
        } catch {
          // Ignore errors
        }
      }
    }

    // Clean up empty directories
    await cleanEmptyDirectories("/");
  } catch (err) {
    console.error("Failed to sync filesystem to git:", err);
  }
}

/**
 * Recursively walk filesystem and return all file paths
 */
async function walkFilesystem(dir: string): Promise<string[]> {
  const fs = getFS();
  const files: string[] = [];

  try {
    const entries = await fs.promises.readdir(dir);
    for (const entry of entries) {
      // Skip .git directory
      if (entry === ".git") continue;

      const fullPath = dir === "/" ? `/${entry}` : `${dir}/${entry}`;
      try {
        const stat = await fs.promises.stat(fullPath);
        if (stat.isDirectory()) {
          // Recurse into directory
          const subFiles = await walkFilesystem(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      } catch {
        // Skip entries we can't stat
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Recursively remove empty directories
 */
async function cleanEmptyDirectories(dir: string): Promise<boolean> {
  const fs = getFS();

  try {
    const entries = await fs.promises.readdir(dir);
    const nonGitEntries = entries.filter((e) => e !== ".git");

    // Check each subdirectory
    for (const entry of nonGitEntries) {
      const fullPath = dir === "/" ? `/${entry}` : `${dir}/${entry}`;
      try {
        const stat = await fs.promises.stat(fullPath);
        if (stat.isDirectory()) {
          // Recurse - returns true if directory was empty and removed
          await cleanEmptyDirectories(fullPath);
        }
      } catch {
        // Skip
      }
    }

    // Re-check entries after cleaning subdirectories
    const remainingEntries = await fs.promises.readdir(dir);
    const remainingNonGit = remainingEntries.filter((e) => e !== ".git");

    // If directory is now empty (except maybe .git at root), remove it
    if (remainingNonGit.length === 0 && dir !== "/") {
      await fs.promises.rmdir(dir);
      return true;
    }
  } catch {
    // Directory doesn't exist
  }

  return false;
}

// ============================================================================
// File Operations (with auto-commit)
// ============================================================================

/**
 * Read file contents as string
 */
export async function readFile(path: string): Promise<string | null> {
  const fs = getFS();
  const normalizedPath = normalizePath(path);

  try {
    const content = await fs.promises.readFile(normalizedPath, { encoding: "utf8" });
    return content as string;
  } catch {
    return null;
  }
}

/**
 * Write file and auto-commit
 */
export async function writeFile(path: string, content: string): Promise<void> {
  await initializeFS();
  const fs = getFS();
  const normalizedPath = normalizePath(path);

  // Ensure parent directories exist
  const parentDir = getParentPath(normalizedPath);
  if (parentDir !== "/") {
    await mkdirRecursive(parentDir);
  }

  // Write file
  await fs.promises.writeFile(normalizedPath, content);

  // Git add + commit
  const gitPath = normalizedPath.startsWith("/") ? normalizedPath.slice(1) : normalizedPath;
  await git.add({ fs, dir: "/", filepath: gitPath });
  await git.commit({
    fs,
    dir: "/",
    message: `Update ${path}`,
    author: { name: "Studio", email: "studio@local" },
  });

  notify();
}

/**
 * List directory contents
 */
export async function readDir(path: string): Promise<FileEntry[]> {
  const fs = getFS();
  const normalizedPath = normalizePath(path);

  try {
    const names = await fs.promises.readdir(normalizedPath);
    const entries: FileEntry[] = [];

    for (const name of names) {
      // Skip .git
      if (name === ".git") continue;

      const entryPath = normalizedPath === "/" ? `/${name}` : `${normalizedPath}/${name}`;
      try {
        const stat = await fs.promises.stat(entryPath);
        entries.push({
          name,
          path: entryPath,
          isDirectory: stat.isDirectory(),
        });
      } catch {
        // Skip entries we can't stat
      }
    }

    // Sort: directories first, then alphabetically
    return entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

/**
 * Check if path exists
 */
export async function exists(path: string): Promise<boolean> {
  const fs = getFS();
  const normalizedPath = normalizePath(path);

  try {
    await fs.promises.stat(normalizedPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create directory (with .gitkeep so it's tracked by git)
 */
export async function mkdir(path: string): Promise<void> {
  await initializeFS();
  const fs = getFS();
  const normalizedPath = normalizePath(path);

  await mkdirRecursive(normalizedPath);

  // Create .gitkeep to track the directory in git
  const gitkeepPath = `${normalizedPath}/.gitkeep`;
  await fs.promises.writeFile(gitkeepPath, "");

  // Git add + commit
  const gitPath = gitkeepPath.slice(1); // Remove leading /
  await git.add({ fs, dir: "/", filepath: gitPath });
  await git.commit({
    fs,
    dir: "/",
    message: `Create ${path}`,
    author: { name: "Studio", email: "studio@local" },
  });

  notify();
}

/**
 * Delete file or directory
 */
export async function remove(path: string): Promise<void> {
  await initializeFS();
  const fs = getFS();
  const normalizedPath = normalizePath(path);

  try {
    const stat = await fs.promises.stat(normalizedPath);

    if (stat.isDirectory()) {
      // Recursively delete directory contents
      const entries = await readDir(normalizedPath);
      for (const entry of entries) {
        await remove(entry.path);
      }
      await fs.promises.rmdir(normalizedPath);
    } else {
      await fs.promises.unlink(normalizedPath);

      // Git rm + commit
      const gitPath = normalizedPath.startsWith("/") ? normalizedPath.slice(1) : normalizedPath;
      try {
        await git.remove({ fs, dir: "/", filepath: gitPath });
        await git.commit({
          fs,
          dir: "/",
          message: `Delete ${path}`,
          author: { name: "Studio", email: "studio@local" },
        });
      } catch {
        // File might not be tracked
      }
    }

    notify();
  } catch {
    // Already doesn't exist
  }
}

// ============================================================================
// Git Operations (Undo/Redo)
// ============================================================================

// Track position in history for redo
let historyPosition = 0;
let historyCache: string[] = [];

/**
 * Undo last change (checkout previous commit)
 */
export async function undo(): Promise<boolean> {
  await initializeFS();
  const fs = getFS();

  // Get commit history
  const commits = await git.log({ fs, dir: "/", depth: 100 });
  if (commits.length < 2) return false;

  // Move back in history
  if (historyPosition === 0) {
    historyCache = commits.map((c) => c.oid);
  }

  if (historyPosition >= historyCache.length - 1) return false;
  historyPosition++;

  const targetOid = historyCache[historyPosition];

  // Checkout files from that commit
  await git.checkout({
    fs,
    dir: "/",
    ref: targetOid,
    force: true,
  });

  // Sync filesystem to remove orphans
  await syncToGitHead();

  notify();
  return true;
}

/**
 * Redo (move forward in history)
 */
export async function redo(): Promise<boolean> {
  await initializeFS();
  const fs = getFS();

  if (historyPosition <= 0 || historyCache.length === 0) return false;

  historyPosition--;
  const targetOid = historyCache[historyPosition];

  await git.checkout({
    fs,
    dir: "/",
    ref: targetOid,
    force: true,
  });

  // Sync filesystem to remove orphans
  await syncToGitHead();

  notify();
  return true;
}

/**
 * Get commit history
 */
export async function getHistory(limit = 20): Promise<Commit[]> {
  await initializeFS();
  const fs = getFS();

  try {
    const commits = await git.log({ fs, dir: "/", depth: limit });
    return commits.map((c) => ({
      oid: c.oid,
      message: c.commit.message,
      timestamp: c.commit.author.timestamp * 1000,
    }));
  } catch {
    return [];
  }
}

/**
 * Check if undo is available
 */
export async function canUndo(): Promise<boolean> {
  const fs = getFS();
  try {
    const commits = await git.log({ fs, dir: "/", depth: 2 });
    return commits.length > 1;
  } catch {
    return false;
  }
}

/**
 * Check if redo is available
 */
export function canRedo(): boolean {
  return historyPosition > 0 && historyCache.length > 0;
}

// ============================================================================
// Subscriptions
// ============================================================================

/**
 * Subscribe to filesystem changes
 */
export function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers
 */
export function notify(): void {
  subscribers.forEach((cb) => cb());
}

// ============================================================================
// Helpers
// ============================================================================

function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  if (path !== "/" && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path.replace(/\/+/g, "/");
}

function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "/") return "/";
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === 0 ? "/" : normalized.slice(0, lastSlash);
}

async function mkdirRecursive(path: string): Promise<void> {
  const fs = getFS();
  const normalizedPath = normalizePath(path);

  if (normalizedPath === "/") return;

  // Check if already exists
  try {
    await fs.promises.stat(normalizedPath);
    return;
  } catch {
    // Doesn't exist, create it
  }

  // Create parent first
  const parentPath = getParentPath(normalizedPath);
  if (parentPath !== "/") {
    await mkdirRecursive(parentPath);
  }

  // Create this directory
  await fs.promises.mkdir(normalizedPath);
}
