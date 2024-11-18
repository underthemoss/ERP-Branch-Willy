import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DefaultPage } from "./pages/DefaultPage";
import { client } from "./api/generated";
import { RouterProvider, createHashRouter } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import { Folders } from "./pages/Folders";

const router = createHashRouter([
  {
    path: "/",
    element: <DefaultPage />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Folders />,
      },
    ],
  },
]);

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
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
