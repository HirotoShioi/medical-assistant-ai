import { AuthProvider } from "./auth";
import { PgliteProvider } from "./pglite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PgliteProvider>{children}</PgliteProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
