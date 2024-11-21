import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";

import { ulid } from "ulid";
import { EventStore } from "../common/EventStore";
import { commandHandler } from "../common/commandHandler";
import { folderCommandProcessor } from "./folder";

jest.setTimeout(5_000);
let replset: MongoMemoryReplSet;
beforeAll(async () => {
  replset = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  await mongoose.connect(replset.getUri(), {
    dbName: "es-erp",
  });
  await mongoose.connection.asPromise();
  await EventStore.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await replset.stop();
  await replset.cleanup();
});

describe("Folder", () => {
  const folderCommandHandler = commandHandler(folderCommandProcessor, {
    correlation_id: ulid(),
    principal_id: ulid(),
    tenant_id: ulid(),
  });

  test.concurrent("Folder aggregate type should never cahnge", async () => {
    expect(folderCommandProcessor.getAggregateType()).toBe("folder");
  });

  test.concurrent("Can persist events to eventstore", async () => {
    const state = await folderCommandHandler.execute("", {
      type: "create_folder",
      name: "test",
    });
    const events = await EventStore.getAggregateEvents(state.folder_id);
    expect(events).toHaveLength(1);
  });

  test.concurrent("Cannot create folder that already exists ", async () => {
    const state = await folderCommandHandler.execute("", {
      type: "create_folder",
      name: "test",
    });
    await expect(
      folderCommandHandler.execute(state.folder_id, {
        type: "create_folder",
        name: "test",
      })
    ).rejects.toThrow("Folder already created");
  });
  test.concurrent("Can rename a folder", async () => {
    const { folder_id } = await folderCommandHandler.execute("", {
      type: "create_folder",
      name: "old name",
    });
    const folder = await folderCommandHandler.execute(folder_id, {
      type: "rename_folder",
      name: "new name",
      folderId: folder_id,
    });
    expect(folder.name).toBe("new name");
  });
  test.concurrent("Can not rename a folder to empty text", async () => {
    const { folder_id } = await folderCommandHandler.execute("", {
      type: "create_folder",
      name: "old name",
    });
    await expect(
      folderCommandHandler.execute(folder_id, {
        type: "rename_folder",
        name: "",
        folderId: folder_id,
      })
    ).rejects.toThrow("Folder must have a name");
  });
  test.concurrent("Can manage concurrency", async () => {
    const { folder_id } = await folderCommandHandler.execute("", {
      type: "create_folder",
      name: "old name",
    });
    await expect(
      Promise.all(
        Array.from({ length: 20 }).map((_, i) =>
          folderCommandHandler.execute(folder_id, {
            type: "rename_folder",
            name: "folder" + i,
            folderId: folder_id,
          })
        )
      )
    ).resolves.toHaveLength(20);
  });
});
