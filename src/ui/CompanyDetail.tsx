"use server";
import DataLoader from "dataloader";
import { esdb } from "@/lib/esdb";
import { getUser } from "@/lib/auth";
import { GenericEntityDetails } from "./GenericEntityDetails";
import { Entity } from "@/db/mongoose";
import { Avatar } from "@mui/material";

const getUserBatch = async (companyIds: number[]) => {
  const companies = await Entity.find({
    type: "company",
    "data.id": companyIds.map((c) => c.toString()),
  });
  return companyIds.map((id) => ({
    ...companies
      .map((c: any) => ({
        id: c.data.id,
        name: c.data.name,
        domain: c.data.domain,
      }))
      .find((r) => r.id === id.toString()),
  }));
};

const companyLoader = new DataLoader<number, any>(
  (keys) => getUserBatch(keys as any),
  {
    batchScheduleFn: (res) => setTimeout(res, 10),
    maxBatchSize: 10000,
    cache: true,
  }
);

export const CompanyDetail = async (props: {
  companyId: string | number;
  nameOnly?: boolean;
}) => {
  const id = Number(props.companyId);
  if (id) {
    const company = await companyLoader.load(Number(props.companyId));
    if (company) {
      return (
        <GenericEntityDetails
          id={company.id}
          label={`${company?.name} `}
          secondary={company.id}
          logo={
            <Avatar
              src={`https://logo.clearbit.com/${company.domain}`}
            ></Avatar>
          }
        />
      );
    } else {
      return (
        <GenericEntityDetails
          id={props.companyId}
          label={props.companyId.toString()}
          secondary={"Not found"}
        />
      );
    }
  }
  return (
    <GenericEntityDetails
      id={props.companyId}
      label={props.companyId.toString()}
      secondary={""}
    />
  );
};
