"use client";

import { useGetPriceBookByIdQuery } from "@/ui/prices/api";
import { PricesTable } from "@/ui/prices/PriceBookPricesTable";
import { Typography } from "@mui/material";
import { PageContainer } from "@toolpad/core/PageContainer";
import { useParams } from "next/navigation";
import * as React from "react";

export default function PriceBook() {
  const { price_book_id } = useParams();
  const { data, loading, error } = useGetPriceBookByIdQuery({
    variables: {
      id: price_book_id as string,
    },
  });

  const priceBook = data?.getPriceBookById;
  const isLoading = loading || !priceBook;
  const hasError = Boolean(error);

  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>
        Price Book:{" "}
        {isLoading ? "Loading..." : hasError ? "Error loading price book" : priceBook?.name}
      </Typography>
      <PricesTable />
    </PageContainer>
  );
}
