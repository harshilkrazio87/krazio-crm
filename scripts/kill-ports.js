const { execSync } = require("child_process");
const pids = [];
[3000, 3001, 3002].forEach((p) => {
  try {
    const out = execSync(`lsof -ti:${p}`, { encoding: "utf8" }).trim();
    if (out) pids.push(...out.split(/\s+/).filter(Boolean));
  } catch (_) {}
});
if (pids.length) {
  try {
    execSync(`kill -9 ${pids.join(" ")}`, { stdio: "ignore" });
  } catch (_) {}
}
