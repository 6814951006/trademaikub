const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.CLIENT_PORT || 5500;
const ROOT_DIRECTORY = __dirname;
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const requestedPath = decodeURIComponent(request.url.split("?")[0]);
  const relativePath = requestedPath === "/" ? "/index.html" : requestedPath;
  const filePath = path.resolve(ROOT_DIRECTORY, `.${relativePath}`);

  if (!filePath.startsWith(ROOT_DIRECTORY + path.sep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      response.end(
        error.code === "ENOENT" ? "Not found" : "Unable to read file",
      );
      return;
    }

    response.writeHead(200, {
      "Content-Type":
        contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Client running on http://localhost:${PORT}`);
});
