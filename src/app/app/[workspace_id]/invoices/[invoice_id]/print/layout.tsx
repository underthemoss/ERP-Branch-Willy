export default function Layout({ children }: any) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: -10,
        right: 0,
        bottom: 0,
        backgroundColor: "white",
      }}
    >
      {children}
    </div>
  );
}
