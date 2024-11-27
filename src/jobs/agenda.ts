import Agenda, { Job, JobAttributesData } from "agenda";

export const agenda = new Agenda();

agenda.database(
  "mongodb://127.0.0.1:63878/es-erp?replicaSet=testset",
  "agendaJobs"
);

agenda.define("purge-completed-jobs", {}, async () => {
  console.log("purge-completed-jobs");
  await agenda.cancel({
    lastFinishedAt: { $lt: new Date() },
    type: "normal",
  });
});

export const startAgenda = async () => {
  await agenda.every("15 seconds", "purge-completed-jobs");
};
