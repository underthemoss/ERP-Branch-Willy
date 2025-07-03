"use client";

import { FulfillmentDetails } from "@/ui/fulfilment/FulfillmentDetails";
import { useParams } from "next/navigation";
import React from "react";

export default function FulfillmentDetailsPage() {
  const params = useParams();
  const fulfillmentId = params?.fulfillment_id as string;

  return (
    <div style={{ padding: "40px 0" }}>
      <FulfillmentDetails fulfillmentId={fulfillmentId} />
    </div>
  );
}
