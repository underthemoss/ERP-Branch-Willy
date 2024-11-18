import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DefaultPage } from "./pages/DefaultPage";
import { client } from "./api/generated";
const queryClient = new QueryClient();
function App() {
  client.setConfig({
    baseUrl:
      process.env.NODE_ENV === "production"
        ? "/es-erp"
        : "http://localhost:5000",
  });
  return (
    <QueryClientProvider client={queryClient}>
      <DefaultPage />
    </QueryClientProvider>
  );
}

export default App;
