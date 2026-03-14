import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ConditionalClassSelectionProvider } from "@/components/ConditionalClassSelectionProvider";

import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthRedirect from "./pages/AuthRedirect";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import Profile from "./pages/Profile";
import StudentProjects from "./pages/StudentProjects";
import SubmitProject from "./pages/SubmitProject";
import StudentSubmissions from "./pages/StudentSubmissions";
import StudentLeaderboard from "./pages/StudentLeaderboard";
import StudentPending from "./pages/StudentPending";
import StudentRejected from "./pages/StudentRejected";
import StudentGuard from "./components/StudentGuard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminGuard from "./components/admin/AdminGuard";
import AdminHome from "./pages/admin/AdminHome";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPendingStudents from "./pages/admin/AdminPendingStudents";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminAcademyUsers from "./pages/admin/AdminAcademyUsers";
import AdminEmails from "./pages/admin/AdminEmails";
import AcademyLogin from "./pages/academy/AcademyLogin";
import AcademyLayout from "./pages/academy/AcademyLayout";
import AcademyHome from "./pages/academy/AcademyHome";
import AcademyStudents from "./pages/academy/AcademyStudents";
import AcademyPendingStudents from "./pages/academy/AcademyPendingStudents";
import AcademySubmissions from "./pages/academy/AcademySubmissions";
import AcademyProjects from "./pages/academy/AcademyProjects";
import AcademyCourses from "./pages/academy/AcademyCourses";
import AcademyTeachers from "./pages/academy/AcademyTeachers";
import AcademySettings from "./pages/academy/AcademySettings";
import AcademyClasses from './pages/academy/AcademyClasses';
import AcademyGuard from "./components/academy/AcademyGuard";
import TeacherLogin from "./pages/teacher/TeacherLogin";
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TeacherHome from "./pages/teacher/TeacherHome";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherMessages from "./pages/teacher/TeacherMessages";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherProjects from "./pages/teacher/TeacherProjects";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherGuard from "./components/teacher/TeacherGuard";
import StudentCourses from "./pages/StudentCourses";
import CourseDetail from "./pages/CourseDetail";
import StudentSetup from "./pages/StudentSetup";
import StudentSignin from "./pages/StudentSignin";

import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorSubmissions from "./pages/SupervisorSubmissions";
import TestDashboard from "./pages/TestDashboard";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ConditionalClassSelectionProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/old-home" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth-redirect" element={<AuthRedirect />} />
              
              {/* Student setup and auth routes */}
              <Route path="/student/setup" element={<StudentSetup />} />
              <Route path="/student/signin" element={<StudentSignin />} />
              
              {/* Student auth routes */}
              <Route path="/etudiant/login" element={<StudentLogin />} />
              <Route path="/etudiant/register" element={<StudentRegister />} />
              <Route path="/etudiant/pending" element={<StudentPending />} />
              <Route path="/etudiant/rejected" element={<StudentRejected />} />
              
              {/* Student protected routes */}
              <Route path="/etudiant/profil" element={<StudentGuard><Profile /></StudentGuard>} />
              <Route path="/etudiant/projets" element={<StudentGuard><StudentProjects /></StudentGuard>} />
              <Route path="/etudiant/soumettre/:projectId" element={<StudentGuard><SubmitProject /></StudentGuard>} />
              <Route path="/etudiant/soumissions" element={<StudentGuard><StudentSubmissions /></StudentGuard>} />
              <Route path="/etudiant/classement" element={<StudentGuard><StudentLeaderboard /></StudentGuard>} />
              <Route path="/etudiant/cours" element={<StudentGuard><StudentCourses /></StudentGuard>} />
              <Route path="/etudiant/cours/:courseId" element={<StudentGuard><CourseDetail /></StudentGuard>} />

              {/* Legacy admin auth URLs redirected to unified auth */}
              <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
              <Route path="/admin/register" element={<Navigate to="/auth" replace />} />
              
              {/* Admin dashboard routes */}
              <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                <Route index element={<AdminHome />} />
                <Route path="pending-students" element={<AdminPendingStudents />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="users" element={<AdminUsers />} />
                {/* academy-users merged into users */}
                <Route path="emails" element={<AdminEmails />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              
              {/* Academy Routes */}
              <Route path="/academy/login" element={<AcademyLogin />} />
              <Route path="/academy" element={<AcademyGuard><AcademyLayout /></AcademyGuard>}>
                <Route index element={<AcademyHome />} />
                <Route path="pending-students" element={<AcademyPendingStudents />} />
                <Route path="students" element={<AcademyStudents />} />
                <Route path="submissions" element={<AcademySubmissions />} />
                <Route path="projects" element={<AcademyProjects />} />
                <Route path="courses" element={<AcademyCourses />} />
                <Route path="classes" element={<AcademyClasses />} />
                <Route path="teachers" element={<AcademyTeachers />} />
                <Route path="settings" element={<AcademySettings />} />
              </Route>
              
              {/* Teacher Routes */}
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher" element={<TeacherGuard><TeacherLayout /></TeacherGuard>}>
                <Route index element={<TeacherHome />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="submissions" element={<SupervisorSubmissions />} />
                <Route path="courses" element={<TeacherCourses />} />
                <Route path="messages" element={<TeacherMessages />} />
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
