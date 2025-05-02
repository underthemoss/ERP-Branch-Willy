"use client";

import { graphql } from "@/graphql";
import { useFetchCurrentUserQuery } from "@/graphql/hooks";
import { PageContainer } from "@toolpad/core/PageContainer";
import * as React from "react";

graphql(`
  query fetchCurrentUser {
    currentUser {
      es_user_name
    }
  }
`);

export default function ColumnVirtualizationGrid() {
  const { data } = useFetchCurrentUserQuery();
  return <PageContainer>{data?.currentUser?.es_user_name}</PageContainer>;
}
