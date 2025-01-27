import DataLoader from "dataloader";
import { esdb } from "@/lib/esdb";
import { useAuth } from "@/lib/auth";
import { GenericEntityDetails } from "./GenericEntityDetails";

const getUserBatch = async (userIds: number[]) => {
  const results = await esdb.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      first_name: true,
      last_name: true,
      company: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });
  return userIds.map((id) => results.find((r) => r.id === id));
};

const userLoader = new DataLoader<number, any>(
  (keys) => getUserBatch(keys as any),
  {
    batchScheduleFn: (res) => setTimeout(res, 10),
    maxBatchSize: 10000,
  }
);

export const UserDetail = async (props: {
  userId: string | number;
  nameOnly?: boolean;
}) => {
  const {
    user: { user_id },
  } = await useAuth();
  const id = Number(props.userId);

  if (id) {
    const user = await userLoader.load(Number(props.userId));
    if (user) {
      return (
        <GenericEntityDetails
          id={user.id}
          label={`${user?.first_name} ${user?.last_name}`}
          secondary={props.nameOnly ? "" : user?.username}
        />
      );
    } else {
      return (
        <GenericEntityDetails
          id={props.userId}
          label={props.userId.toString()}
          secondary={"Not found"}
        />
      );
    }
  }
  return (
    <GenericEntityDetails
      id={props.userId}
      label={props.userId.toString()}
      secondary={""}
    />
  );
};
