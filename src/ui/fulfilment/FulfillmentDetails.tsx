import React from "react";

export type FulfillmentDetailsProps = {
  fulfillmentId: string;
  // Optionally, pass fulfillment data directly if already fetched
  fulfillment?: {
    id: string;
    title: string;
    status: string;
    assignee: string;
    createdAt: string;
    updatedAt: string;
    description: string;
    items: { name: string; quantity: number }[];
    activity: { date: string; action: string; user: string }[];
  };
};

const mockFulfillment = {
  id: "12345",
  title: "Fulfillment Order #12345",
  status: "In Progress",
  assignee: "Jane Doe",
  createdAt: "2025-03-01",
  updatedAt: "2025-03-06",
  description:
    "This is a placeholder for the fulfillment details. Replace with real data fetching.",
  items: [
    { name: "Item A", quantity: 2 },
    { name: "Item B", quantity: 1 },
  ],
  activity: [
    { date: "2025-03-06", action: "Status changed to In Progress", user: "Jane Doe" },
    { date: "2025-03-01", action: "Fulfillment created", user: "System" },
  ],
};

export function FulfillmentDetails({ fulfillmentId, fulfillment }: FulfillmentDetailsProps) {
  // TODO: Replace mockFulfillment with real data fetching using fulfillmentId
  const data = fulfillment || mockFulfillment;

  return (
    <div
      style={{
        margin: "0 auto",
        //padding: 32,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginRight: 16,
            color: "#1a1a1a",
          }}
        >
          {data.title}{" "}
          <span
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: "#888",
            }}
          >
            ({fulfillmentId})
          </span>
        </div>
        <span
          style={{
            background: "#e6f4ea",
            color: "#218a5a",
            borderRadius: 4,
            padding: "4px 12px",
            fontWeight: 500,
            marginLeft: 8,
          }}
        >
          {data.status}
        </span>
      </div>
      <div style={{ marginBottom: 16, color: "#555" }}>
        <strong>Assignee:</strong> {data.assignee} &nbsp;|&nbsp;
        <strong>Created:</strong> {data.createdAt} &nbsp;|&nbsp;
        <strong>Last Updated:</strong> {data.updatedAt}
      </div>
      <div style={{ marginBottom: 24 }}>
        <strong>Description:</strong>
        <div style={{ marginTop: 8, color: "#333" }}>{data.description}</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <strong>Items:</strong>
        <ul style={{ marginTop: 8 }}>
          {data.items.map((item, idx) => (
            <li key={idx}>
              {item.name} &times; {item.quantity}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Activity:</strong>
        <ul style={{ marginTop: 8 }}>
          {data.activity.map((act, idx) => (
            <li key={idx}>
              <span style={{ color: "#888" }}>{act.date}</span> — {act.action}{" "}
              <span style={{ color: "#555" }}>by {act.user}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
