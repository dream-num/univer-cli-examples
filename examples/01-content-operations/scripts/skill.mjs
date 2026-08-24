import { mkdir, readlink, rmdir, symlink, unlink } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const action = process.argv[2];
const root = fileURLToPath(new URL("..", import.meta.url));
const source = resolve(root, "skills/univer-content");
const link = resolve(root, ".agents/skills/univer-content");
const target = relative(dirname(link), source);

if (action === "install") {
  await mkdir(dirname(link), { recursive: true });
  await createLink();
  process.stdout.write("Installed univer-content for Agents opened in this directory.\n");
} else if (action === "uninstall") {
  await removeLink();
  await removeEmptyDirectory(dirname(link));
  await removeEmptyDirectory(resolve(root, ".agents"));
} else {
  throw new Error("Choose install or uninstall");
}

async function createLink() {
  const current = await currentTarget();
  if (current === target) return;
  if (current !== undefined) throw new Error(`${link} already points to ${current}`);
  await symlink(target, link);
}

async function removeLink() {
  const current = await currentTarget();
  if (current === undefined) return;
  if (current !== target) throw new Error(`${link} points to ${current}, not ${target}`);
  await unlink(link);
}

async function currentTarget() {
  try {
    return await readlink(link);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function removeEmptyDirectory(path) {
  try {
    await rmdir(path);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTEMPTY") throw error;
  }
}
