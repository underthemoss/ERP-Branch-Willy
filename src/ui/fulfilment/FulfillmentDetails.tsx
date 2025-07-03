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
        display: "flex",
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: 3,
          padding: "40px 48px 40px 48px",
          borderRight: "1px solid #ececec",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginRight: 16,
              color: "#1a1a1a",
              lineHeight: 1.2,
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
              fontSize: 15,
            }}
          >
            {data.status}
          </span>
        </div>
        <div style={{ marginBottom: 20, color: "#555", fontSize: 15 }}>
          <strong>Assignee:</strong> {data.assignee} &nbsp;|&nbsp;
          <strong>Created:</strong> {data.createdAt} &nbsp;|&nbsp;
          <strong>Last Updated:</strong> {data.updatedAt}
        </div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Description</div>
          <div style={{ color: "#333", fontSize: 15 }}>{data.description}</div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Items</div>
          <ul style={{ marginTop: 8, paddingLeft: 20, color: "#444", fontSize: 15 }}>
            {data.items.map((item, idx) => (
              <li key={idx}>
                {item.name} &times; {item.quantity}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6, color: "#222" }}>Activity</div>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {data.activity.map((act, idx) => (
              <li key={idx} style={{ marginBottom: 6, fontSize: 15 }}>
                <span style={{ color: "#888" }}>{act.date}</span> — {act.action}{" "}
                <span style={{ color: "#555" }}>by {act.user}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Add comment box mock */}
        <div
          style={{
            marginTop: 40,
            background: "#f5f6f8",
            borderRadius: 8,
            padding: "18px 20px",
            border: "1px solid #ececec",
            maxWidth: 600,
          }}
        >
          <input
            type="text"
            placeholder="Leave a comment..."
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              fontSize: 15,
              outline: "none",
              color: "#222",
            }}
            disabled
          />
        </div>
      </div>
      {/* Sidebar */}
      <div
        style={{
          flex: 1,
          padding: "40px 32px",
          background: "#fafbfc",
          minWidth: 260,
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 600, color: "#222", marginBottom: 10 }}>Properties</div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <input type="checkbox" checked={data.status === "In Progress"} readOnly />
            <span style={{ marginLeft: 8, color: "#444", fontSize: 15 }}>Todo</span>
          </div>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>Set priority</div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 600, color: "#222", marginBottom: 10 }}>Assignee</div>
          <div style={{ color: "#444", fontSize: 15 }}>{data.assignee}</div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 600, color: "#222", marginBottom: 10 }}>Labels</div>
          <div style={{ color: "#888", fontSize: 14 }}>Add label</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#222", marginBottom: 10 }}>Project</div>
          <div style={{ color: "#888", fontSize: 14 }}>Add to project</div>
        </div>
      </div>
    </div>
  );
}
