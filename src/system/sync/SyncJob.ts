import _ from "lodash";

export class SyncJob<T extends { id: number }> {
  constructor(
    private props: {
      sourceBatchSize: number;
      sinkBatchSize: number;
      source: (queryArgs: {
        skip: number;
        take: number;
        orderBy: { id: "asc" };
        cursor: { id: number } | undefined;
      }) => Promise<T[]>;
      sink: (batch: T[]) => void;
    }
  ) {}

  async run() {
    console.time("[SYNC] Assets");

    let lastCursor: number | undefined = undefined;

    while (true) {
      const batch = await this.props.source({
        skip: lastCursor ? 1 : 0,
        take: this.props.sourceBatchSize,
        orderBy: { id: "asc" },
        cursor: lastCursor ? { id: lastCursor } : undefined,
      });
      if (batch.length === 0) break; // Stop iteration if no data

      const chunks = _.chunk(batch, this.props.sinkBatchSize);
      for (const chunk of chunks) {
        await this.props.sink(chunk); // Process batch via sink function
      }

      lastCursor = batch[batch.length - 1]?.id; // Update cursor to last item in batch
    }
    console.timeEnd("[SYNC] Assets");
  }
}
