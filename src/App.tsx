import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import QRCodePage from "./pages/QRCodePage";
import SurveyPage from "./pages/SurveyPage";
import StudentConfirmPage from "./pages/StudentConfirmPage";
import SurveyQuestionsPage from "./pages/SurveyQuestionsPage";
import ResultsPage from "./pages/ResultsPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/qrcode" element={<ProtectedRoute><QRCodePage /></ProtectedRoute>} />
          <Route path="/survey" element={<ProtectedRoute><SurveyPage /></ProtectedRoute>} />
          <Route path="/student-confirm" element={<ProtectedRoute><StudentConfirmPage /></ProtectedRoute>} />
          <Route path="/survey-questions" element={<ProtectedRoute><SurveyQuestionsPage /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
