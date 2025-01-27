"use server";
import DataLoader from "dataloader";
import { esdb } from "@/lib/esdb";
import { getAuthUser } from "@/lib/auth";

export const getUserBatch = async (userIds: number[]) => {
  const { user } = await getAuthUser();

  const results = await esdb.user.findMany({
    where: { id: { in: userIds }, company_id: Number(user.company_id) },
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

  return userIds.map((id) => results.find((r) => r.id === id) || null);
};
