import { useQuery } from "@tanstack/react-query";
import { getApiReadyzOptions } from "../api/generated/@tanstack/react-query.gen";

export const DefaultPage = () => {
  const { data } = useQuery({ ...getApiReadyzOptions({}) });
  return (
    <div>
      <h1>ES ERP - {data?.status}</h1>
    </div>
  );
};
