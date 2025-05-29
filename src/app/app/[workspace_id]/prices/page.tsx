"use client";

import { PriceBookFields, useListPriceBooksQuery } from "@/ui/prices/api";
import { NewPriceBookDialog } from "@/ui/prices/NewPriceBookDialog";
import { CardActionArea } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

function PriceBookCard({ id, name, createdBy, isDefault }: PriceBookFields) {
  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardActionArea onClick={() => router.push(`/app/${workspace_id}/prices/${id}`)}>
        <CardContent>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {name}
          </Typography>
          {isDefault && <Chip label="default" />}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Prices() {
  const dialogs = useDialogs();
  const { data, loading, error } = useListPriceBooksQuery({
    variables: {
      page: {
        size: 10,
      },
    },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Price Books
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {data?.listPriceBooks?.items.map((priceBook: PriceBookFields) => (
          <PriceBookCard key={priceBook.id} {...priceBook} />
        ))}
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => dialogs.open(NewPriceBookDialog)}
        >
          Create New Price Book
        </Button>
      </Box>
    </Box>
  );
}
