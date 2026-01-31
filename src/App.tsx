import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { BettingProvider } from "@/contexts/BettingContext";
import { Layout } from "@/components/layout/Layout";
import { BettingSlip } from "@/components/betting/BettingSlip";
import { BettingSlipTrigger } from "@/components/betting/BettingSlipTrigger";
import Landing from "@/pages/Landing";
import Matches from "@/pages/Matches";
import LiveMatch from "@/pages/LiveMatch";
import Leaderboard from "@/pages/Leaderboard";
import HowItWorks from "@/pages/HowItWorks";
import WalletDashboard from "@/pages/WalletDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <BettingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/match/:matchId" element={<LiveMatch />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/wallet" element={<WalletDashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
            <BettingSlip />
            <BettingSlipTrigger />
          </BrowserRouter>
        </TooltipProvider>
      </BettingProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
