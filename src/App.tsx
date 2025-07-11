import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './wagmi';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { PayPage } from './pages/PayPage';
import BusinessPage from './pages/BusinessPage';
import PaymentProcessor from './components/PaymentProcessor';
import NotFound from "./pages/NotFound";
import MainAppTour from './components/MainAppTour';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MainAppTour>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/pay" element={<PayPage />} />
                  <Route path="/business" element={<BusinessPage />} />
                  <Route path="/payment/:paymentId" element={<PaymentProcessor />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </MainAppTour>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
