const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((item) => {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      walk(full, callback);
    } else {
      callback(full);
    }
  });
}

const base = path.join(__dirname, "src", "app", "api");

walk(base, (file) => {
  if (!file.endsWith(".ts")) return;
  let content = fs.readFileSync(file, "utf8");
  // replace any relative path to controllers with @/controllers/
  content = content.replace(/from ["']\.\.\/[\.\/]*controllers\//g, 'from "@/controllers/');
  // replace any relative path to models with @/models/
  content = content.replace(/from ["']\.\.\/[\.\/]*models\//g, 'from "@/models/');
  fs.writeFileSync(file, content);
});

console.log("imports fixed");
