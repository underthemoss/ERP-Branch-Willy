"use server";

import { getUser } from "@/lib/auth";
import { esdb } from "@/lib/esdb";

export const searchUsers = async (term: string) => {
  const { user } = await getUser();

  if (!term) {
    return [user.user_id];
  }

  const users = await esdb.user.findMany({
    where: {
      company_id: Number(user.company_id),
      AND: term
        .split(" ")
        .filter(Boolean)
        .map((t) => ({
          OR: [
            {
              first_name: {
                contains: t,
                mode: "insensitive",
              },
            },
            {
              last_name: {
                contains: t,
                mode: "insensitive",
              },
            },
            {
              username: {
                contains: t,
                mode: "insensitive",
              },
            },
            {
              id: {
                equals: Number(t) || -1,
              },
            },
          ],
        })),
    },
    select: {
      id: true,
    },
    take: 50,
  });
  return users.map((u) => u.id.toString());
};
