import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider, useData } from "@/contexts/DataContext";
import DashboardNavbar from "@/components/DashboardNavbar";
import LoadingScreen from "@/components/LoadingScreen";
import OverviewPage from "@/pages/OverviewPage";
import ProductPage from "@/pages/ProductPage";
import InventoryPage from "@/pages/InventoryPage";
import GeographicPage from "@/pages/GeographicPage";
import QueryExplorerPage from "@/pages/QueryExplorerPage";
import InsightsPage from "@/pages/InsightsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { loading, error } = useData();

  if (loading) return <LoadingScreen />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 max-w-md text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="dark min-h-screen bg-background">
      <DashboardNavbar />
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/geographic" element={<GeographicPage />} />
        <Route path="/query" element={<QueryExplorerPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
