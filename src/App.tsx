import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ConditionalClassSelectionProvider } from "@/components/ConditionalClassSelectionProvider";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import StudentProjects from "./pages/StudentProjects";
import SubmitProject from "./pages/SubmitProject";
import StudentSubmissions from "./pages/StudentSubmissions";
import AdminLayout from "./components/admin/AdminLayout";
import AdminGuard from "./components/admin/AdminGuard";
import AdminHome from "./pages/admin/AdminHome";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";

import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorSubmissions from "./pages/SupervisorSubmissions";
import TestDashboard from "./pages/TestDashboard";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <ConditionalClassSelectionProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profil" element={<Profile />} />
              <Route path="/etudiant/mes-projets" element={<StudentProjects />} />
              <Route path="/etudiant/soumettre" element={<SubmitProject />} />
              <Route path="/etudiant/mes-soumissions" element={<StudentSubmissions />} />
              {/* Admin auth routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/register" element={<AdminRegister />} />
              
              {/* Admin dashboard routes */}
              <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                <Route index element={<AdminHome />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              
              <Route path="/superviseur" element={<SupervisorDashboard />} />
              <Route path="/superviseur/soumissions" element={<SupervisorSubmissions />} />
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/test" element={<TestDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ConditionalClassSelectionProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;