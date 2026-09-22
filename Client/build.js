const fs = require("fs");
const path = require("path");

const sourceDirectory = __dirname;
const outputDirectory = path.join(sourceDirectory, "dist");

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
  if (entry.name === "dist" || entry.name === "node_modules") continue;

  fs.cpSync(
    path.join(sourceDirectory, entry.name),
    path.join(outputDirectory, entry.name),
    { recursive: true },
  );
}
