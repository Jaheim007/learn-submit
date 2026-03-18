import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ConditionalClassSelectionProvider } from "@/components/ConditionalClassSelectionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

// Guards are kept eager (small + needed immediately)
import StudentGuard from "./components/StudentGuard";
import AdminGuard from "./components/admin/AdminGuard";
import AcademyGuard from "./components/academy/AcademyGuard";
import TeacherGuard from "./components/teacher/TeacherGuard";

// Lazy-loaded pages — each becomes its own chunk
const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
// Auth page removed for security — redirects to unified login
const AuthRedirect = lazy(() => import("./pages/AuthRedirect"));
const StudentLogin = lazy(() => import("./pages/StudentLogin"));
const StudentRegister = lazy(() => import("./pages/StudentRegister"));
const Profile = lazy(() => import("./pages/Profile"));
const StudentProjects = lazy(() => import("./pages/StudentProjects"));
const SubmitProject = lazy(() => import("./pages/SubmitProject"));
const StudentSubmissions = lazy(() => import("./pages/StudentSubmissions"));
const StudentLeaderboard = lazy(() => import("./pages/StudentLeaderboard"));
const StudentPending = lazy(() => import("./pages/StudentPending"));
const StudentRejected = lazy(() => import("./pages/StudentRejected"));
const StudentCourses = lazy(() => import("./pages/StudentCourses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const StudentSetup = lazy(() => import("./pages/StudentSetup"));
const StudentSignin = lazy(() => import("./pages/StudentSignin"));
const StudentTutorials = lazy(() => import("./pages/StudentTutorials"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminPendingStudents = lazy(() => import("./pages/admin/AdminPendingStudents"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminClasses = lazy(() => import("./pages/admin/AdminClasses"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminRegister = lazy(() => import("./pages/admin/AdminRegister"));
const AdminAcademyUsers = lazy(() => import("./pages/admin/AdminAcademyUsers"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));

const AcademyLogin = lazy(() => import("./pages/academy/AcademyLogin"));
const AcademyLayout = lazy(() => import("./pages/academy/AcademyLayout"));
const AcademyHome = lazy(() => import("./pages/academy/AcademyHome"));
const AcademyStudents = lazy(() => import("./pages/academy/AcademyStudents"));
const AcademyPendingStudents = lazy(() => import("./pages/academy/AcademyPendingStudents"));
const AcademySubmissions = lazy(() => import("./pages/academy/AcademySubmissions"));
const AcademyProjects = lazy(() => import("./pages/academy/AcademyProjects"));
const AcademyCourses = lazy(() => import("./pages/academy/AcademyCourses"));
const AcademyTeachers = lazy(() => import("./pages/academy/AcademyTeachers"));
const AcademySettings = lazy(() => import("./pages/academy/AcademySettings"));
const AcademyClasses = lazy(() => import("./pages/academy/AcademyClasses"));

const TeacherLogin = lazy(() => import("./pages/teacher/TeacherLogin"));
const TeacherLayout = lazy(() => import("./pages/teacher/TeacherLayout"));
const TeacherHome = lazy(() => import("./pages/teacher/TeacherHome"));
const TeacherStudents = lazy(() => import("./pages/teacher/TeacherStudents"));
const TeacherMessages = lazy(() => import("./pages/teacher/TeacherMessages"));
const TeacherCourses = lazy(() => import("./pages/teacher/TeacherCourses"));
const TeacherProjects = lazy(() => import("./pages/teacher/TeacherProjects"));
const TeacherProfile = lazy(() => import("./pages/teacher/TeacherProfile"));
const TeacherTutorials = lazy(() => import("./pages/teacher/TeacherTutorials"));

const SupervisorDashboard = lazy(() => import("./pages/SupervisorDashboard"));
const SupervisorSubmissions = lazy(() => import("./pages/SupervisorSubmissions"));
const TestDashboard = lazy(() => import("./pages/TestDashboard"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Forbidden = lazy(() => import("./pages/Forbidden"));

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
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ConditionalClassSelectionProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/old-home" element={<Index />} />
              <Route path="/auth" element={<Navigate to="/etudiant/login" replace />} />
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
              <Route path="/etudiant/tutoriels" element={<StudentGuard><StudentTutorials /></StudentGuard>} />

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
                <Route path="tutorials" element={<TeacherTutorials />} />
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
                <Route path="projects" element={<TeacherProjects />} />
                <Route path="submissions" element={<SupervisorSubmissions />} />
                <Route path="courses" element={<TeacherCourses />} />
                <Route path="tutorials" element={<TeacherTutorials />} />
                <Route path="messages" element={<TeacherMessages />} />
                <Route path="profile" element={<TeacherProfile />} />
              </Route>
              
              <Route path="/superviseur" element={<SupervisorDashboard />} />
              <Route path="/superviseur/soumissions" element={<SupervisorSubmissions />} />
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/test" element={<TestDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            
          </ConditionalClassSelectionProvider>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
