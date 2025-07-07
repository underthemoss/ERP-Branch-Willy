import React from "react";

type ServiceFulfillmentDetailsProps = {
  fulfilment: any;
  price?: {
    name?: string | null;
    pimCategory?: { path?: string | null; name?: string | null } | null;
  };
};

export function ServiceFulfillmentDetails({ fulfilment, price }: ServiceFulfillmentDetailsProps) {
  // Helper for assignedTo
  const assignedTo =
    fulfilment.assignedTo &&
    fulfilment.assignedTo !== null &&
    [fulfilment.assignedTo.firstName, fulfilment.assignedTo.lastName].filter(Boolean).join(" ");

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Service Details</div>
        <div style={{ color: "#333", fontSize: 15 }}>
          Service Date: {fulfilment.serviceDate || "-"}
        </div>
      </div>
      {/* Add comment box mock */}
    </>
  );
}

export default ServiceFulfillmentDetails;
