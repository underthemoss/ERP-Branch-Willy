import { Gitlab } from "@gitbeaker/rest";
import { config } from "dotenv";
import { promises as fs } from "fs";
config();
const api = new Gitlab({
  host: "https://gitlab.internal.equipmentshare.com/",
  token: process.env.GITLAB_TOKEN || "",
});

const tag = `<!-- codex-review-bot -->`;

const CI_PROJECT_ID = process.env.CI_PROJECT_ID || "";
const CI_MERGE_REQUEST_IID = Number(process.env.CI_MERGE_REQUEST_IID);

const main = async () => {
  const review = (await fs.readFile("./review.md")).toString();

  const note = (
    await api.MergeRequestNotes.all(CI_PROJECT_ID, CI_MERGE_REQUEST_IID)
  ).find((note) => note.body.includes(tag));

  if (note) {
    await api.MergeRequestNotes.edit(
      CI_PROJECT_ID,
      CI_MERGE_REQUEST_IID,
      note.id,
      {
        body: `${tag}\n${review}`,
      },
    );
  } else {
    await api.MergeRequestNotes.create(
      CI_PROJECT_ID,
      CI_MERGE_REQUEST_IID,
      `${tag}\n${review}`,
    );
  }
};

main();
