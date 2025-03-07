import { Entity } from "@/db/mongoose";
import { pgConfig } from "@/lib/pool";
import { ContentTypeDataModel } from "@/types/generated/content-types";
import { IDatabaseConnection, PreparedQuery } from "@pgtyped/runtime";
import { Client } from "pg";
import Cursor from "pg-cursor";

export const dataSync = async <
  QueryParams,
  QueryResult,
  MappedResult extends ContentTypeDataModel,
>(props: {
  query: PreparedQuery<QueryParams, QueryResult>;
  batchSize: number;
  params: QueryParams;
  map: (row: QueryResult) => MappedResult[];
}) => {
  const client = new Client(pgConfig);
  const connection: IDatabaseConnection = {
    query: (query, bindings) => client.query(query, bindings) as any,
    stream: (query, bindings) => client.query(new Cursor(query, bindings)),
  };
  await client.connect();
  const cursor = props.query.stream(props.params, connection);

  try {
    while (true) {
      const rows = await cursor.read(props.batchSize);

      if (rows.length === 0) {
        break;
      }

      await Entity.bulkWrite(
        rows.flatMap((row) => {
          const records = props.map(row);
          return records.map((record) => ({
            updateOne: {
              filter: { _id: record._id },
              upsert: true,
              update: {
                $set: {
                  ...record,
                },
              },
            },
          }));
        }),
        { writeConcern: { w: 0 } }
      );
    }
  } finally {
    await cursor.close();
    await client.end();
  }
};

export const sharded = async (
  props: { number_shards: number },
  func: (args: {
    number_of_shards: number;
    current_shard: number;
  }) => Promise<void>
) => {
  const shards = Array.from({ length: props.number_shards }).map((_, i) => i);
  await Promise.all(
    shards.map((shard) =>
      func({ number_of_shards: props.number_shards, current_shard: shard })
    )
  );
};
