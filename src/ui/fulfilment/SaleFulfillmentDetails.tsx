import React from "react";

type SaleFulfillmentDetailsProps = {
  fulfilment: any;
  price?: {
    name?: string | null;
    pimCategory?: { path?: string | null; name?: string | null } | null;
  };
};

export function SaleFulfillmentDetails({ fulfilment, price }: SaleFulfillmentDetailsProps) {
  // Helper for assignedTo
  const assignedTo =
    fulfilment.assignedTo &&
    fulfilment.assignedTo !== null &&
    [fulfilment.assignedTo.firstName, fulfilment.assignedTo.lastName].filter(Boolean).join(" ");

  return (
    <>
      <div style={{ marginBottom: 32 }}></div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Sale Details</div>
        <div style={{ color: "#333", fontSize: 15 }}>
          Price: {fulfilment.salePrice ?? "-"}
          <br />
          Quantity: {fulfilment.quantity ?? "-"}
        </div>
      </div>
    </>
  );
}

export default SaleFulfillmentDetails;
