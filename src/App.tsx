import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";

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
        
          {/* 선생님 전용 (로그인 필요) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/results" 
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            } 
          />
        
          {/* 학생 전용 (로그인 불필요) */}
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/student-confirm" element={<StudentConfirmPage />} />
          <Route path="/survey-questions" element={<SurveyQuestionsPage />} />
        
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
