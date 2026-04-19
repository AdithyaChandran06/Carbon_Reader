import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import DataIngestion from "./pages/DataIngestion";
import HotspotAnalysis from "./pages/HotspotAnalysis";
import AuditTrust from "./pages/AuditTrust";
import NotFound from "./pages/NotFound";
import MLInsights from "./pages/MLInsights";
import LiveAPIs from "./pages/LiveAPIs";
import RouteOptimization from "./pages/RouteOptimization";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/data-ops" element={<DataIngestion />} />
            <Route path="/data-ingestion" element={<Navigate to="/data-ops" replace />} />
            <Route path="/calculation" element={<Navigate to="/hotspots" replace />} />
            <Route path="/hotspots" element={<HotspotAnalysis />} />
            <Route path="/audit" element={<AuditTrust />} />
            <Route path="/ml-insights" element={<MLInsights />} />
              <Route path="/live-apis" element={<LiveAPIs />} />
              <Route path="/route-optimization" element={<RouteOptimization />} />
            </Route>
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
