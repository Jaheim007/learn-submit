import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClassSelectionProvider } from "@/components/ClassSelectionProvider";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import StudentProjects from "./pages/StudentProjects";
import SubmitProject from "./pages/SubmitProject";
import StudentSubmissions from "./pages/StudentSubmissions";
import AdminDashboard from "./pages/AdminDashboard";
import TestDashboard from "./pages/TestDashboard";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ClassSelectionProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profil" element={<Profile />} />
              <Route path="/etudiant/mes-projets" element={<StudentProjects />} />
              <Route path="/etudiant/soumettre" element={<SubmitProject />} />
              <Route path="/etudiant/mes-soumissions" element={<StudentSubmissions />} />
              <Route path="/admin/soumissions" element={<AdminDashboard />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/test" element={<TestDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ClassSelectionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;