const https = require("https");
const url = process.env.SLACK_WEBHOOK;

if (!url) throw new Error("No slack endpoint provided");

// Read from stdin
let content = "";
process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  content += chunk;
});

process.stdin.on("end", () => {
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
      },
    },
    (res) => {
      res.on("data", (d) => process.stdout.write(d));
    },
  );

  req.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  req.write(data);
  req.end();
});
