"use client";

import { FulfillmentDetails } from "@/ui/fulfilment/FulfillmentDetails";
import { Dialog, DialogContent } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function FulfillmentDetailsInterceptor() {
  const params = useParams();
  const fulfillmentId = params?.fulfillment_id as string;
  const router = useRouter();

  return (
    <Dialog open onClose={() => router.back()} fullWidth maxWidth="md">
      <DialogContent>
        <FulfillmentDetails fulfillmentId={fulfillmentId} />
      </DialogContent>
    </Dialog>
  );
}
