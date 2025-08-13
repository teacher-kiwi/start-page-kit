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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qrcode" element={<QRCodePage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/student-confirm" element={<StudentConfirmPage />} />
          <Route path="/survey-questions" element={<SurveyQuestionsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
