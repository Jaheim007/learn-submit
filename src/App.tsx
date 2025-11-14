import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ConditionalClassSelectionProvider } from "@/components/ConditionalClassSelectionProvider";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import Profile from "./pages/Profile";
import StudentProjects from "./pages/StudentProjects";
import SubmitProject from "./pages/SubmitProject";
import StudentSubmissions from "./pages/StudentSubmissions";
import StudentLeaderboard from "./pages/StudentLeaderboard";
import StudentGuard from "./components/StudentGuard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminGuard from "./components/admin/AdminGuard";
import AdminHome from "./pages/admin/AdminHome";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import StudentCourses from "./pages/StudentCourses";
import CourseDetail from "./pages/CourseDetail";

import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorSubmissions from "./pages/SupervisorSubmissions";
import TestDashboard from "./pages/TestDashboard";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ConditionalClassSelectionProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Student auth routes */}
              <Route path="/etudiant/login" element={<StudentLogin />} />
              <Route path="/etudiant/register" element={<StudentRegister />} />
              
              {/* Student protected routes */}
              <Route path="/etudiant/profil" element={<StudentGuard><Profile /></StudentGuard>} />
              <Route path="/etudiant/projets" element={<StudentGuard><StudentProjects /></StudentGuard>} />
              <Route path="/etudiant/soumettre/:projectId" element={<StudentGuard><SubmitProject /></StudentGuard>} />
              <Route path="/etudiant/soumissions" element={<StudentGuard><StudentSubmissions /></StudentGuard>} />
              <Route path="/etudiant/classement" element={<StudentGuard><StudentLeaderboard /></StudentGuard>} />
              <Route path="/etudiant/cours" element={<StudentGuard><StudentCourses /></StudentGuard>} />
              <Route path="/etudiant/cours/:courseId" element={<StudentGuard><CourseDetail /></StudentGuard>} />

              {/* Admin auth routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/register" element={<AdminRegister />} />
              
              {/* Admin dashboard routes */}
              <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                <Route index element={<AdminHome />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="courses" element={<AdminCourses />} />
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
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;