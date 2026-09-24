import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { CareerThemeProvider } from "./live/careerTheme";
import { ToastProvider } from "./context/ToastContext";
import { AuthModalHost } from "./components/AuthModalHost";
import { RouteFallback } from "./components/RouteFallback";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { ScrollToTop } from "./app/ScrollToTop";
import { AppRoutes } from "./app/AppRoutes";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      // Sprint 2A: 5 min sin refetch al enfocar (los badges con
      // refetchInterval propio siguen actualizándose solos).
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

// Proveedores globales + boundary con mensaje de recarga si un chunk lazy falla.
export function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <CareerThemeProvider>
          <ToastProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AuthModalHost>
                <div className="min-h-screen bg-zinc-50 font-body-md text-body-md text-zinc-900 antialiased">
                  <RouteErrorBoundary>
                    <Suspense fallback={<RouteFallback />}>
                      <AppRoutes />
                    </Suspense>
                  </RouteErrorBoundary>
                </div>
              </AuthModalHost>
            </BrowserRouter>
          </ToastProvider>
        </CareerThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
