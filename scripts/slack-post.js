const https = require("https");
const fs = require("fs");
const url = process.env.SLACK_WEBHOOK;

if (!url) throw new Error("No slack endpoint provided");
const content = fs.readFileSync("release_note.md", "utf8").toString();

const data = JSON.stringify({
  content,
  channel: "C0912S17B9B",
});
console.log(data);
const req = https.request(
  url,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  },
  (res) => {
    res.on("data", (d) => process.stdout.write(d));
  }
);
req.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
req.write(data);
req.end();
