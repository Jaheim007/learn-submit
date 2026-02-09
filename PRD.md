# Product Requirements Document (PRD)
# NYS Submissions Portal — "Submito"

**Version:** 2.0  
**Date:** 2026-02-09  
**Status:** In Production  
**Product URL:** https://learn-submit.lovable.app

---

## 1. Executive Summary

Submito is an academic project submission and management platform built for NYS-Africa. It enables students to submit projects regularly, while giving administrators, teachers, and academy managers full oversight over submissions, grading, and student progress across multiple classes and organizations.

---

## 2. Problem Statement

Educational institutions struggle with:
- **Fragmented submission workflows** — students submit via email, WhatsApp, or random file-sharing tools
- **No centralized tracking** — instructors lose track of who submitted what and when
- **No structured feedback loop** — grading and feedback happen outside the system
- **Multi-class complexity** — students enrolled in multiple classes have no unified dashboard
- **Security concerns** — student files and data lack proper access control

---

## 3. Target Users

| Role | Description |
|------|-------------|
| **Student** | Submits projects, views grades/feedback, manages profile |
| **Teacher/Supervisor** | Reviews submissions, provides feedback, manages assigned classes |
| **Academy Admin** | Manages classes, projects, students, and teachers within an academy |
| **Super Admin** | Full platform access, user management, system configuration |
| **Organization Owner** | Multi-tenant organization management with own classes, courses, and students |

---

## 4. Core Features

### 4.1 Authentication & Access Control

| Requirement | Details |
|------------|---------|
| Auth provider | Supabase Auth (email/password + magic link) |
| Role system | `user_roles` table with roles: `student`, `admin`, `supervisor`, `academy_admin`, `teacher` |
| Route protection | Role-based guards (`StudentGuard`, `AdminGuard`, `AcademyGuard`, `TeacherGuard`) |
| RLS | Row Level Security on all tables — students see only their own data |
| Admin whitelist | Admin access controlled via role assignments |

### 4.2 Student Dashboard

| Feature | Details |
|---------|---------|
| Class overview | List of enrolled classes with active projects |
| Project list | Per-class projects with code, title, deadline, latest submission status |
| Submit project | Form with up to 3 links, up to 3 files (PDF/DOCX/ZIP, 25MB max), description — all optional but at least one required |
| My submissions | Full history with status badges (Reçu, En révision, Validé, Refusé) |
| Deadline countdown | Visual countdown timer on approaching deadlines |
| Profile management | Full name, email, phone, WhatsApp, Telegram, GitHub profile |
| Leaderboard | Student ranking based on submissions and grades |
| Courses | Access to course materials uploaded by instructors |

### 4.3 Submission System

| Requirement | Details |
|------------|---------|
| Fields | `link1`, `link2`, `link3`, `file1_url`, `file2_url`, `file3_url`, `description` — all optional |
| Validation | At least one file OR one link required |
| File storage | Private Supabase Storage bucket (`submissions`), organized as `user_id/class_code/project_code/` |
| File types | PDF, DOCX, ZIP only |
| Max file size | 25 MB per file |
| Statuses | `received` → `in_review` → `validated` / `refused` |
| Versioning | `version` field + `is_latest` flag for resubmissions |
| Resubmission | Controlled via `allow_resubmit` and `max_resubmits` on projects |
| Feedback | `feedback` field + `grade` (numeric) set by reviewer |
| Locking | `locked_at` timestamp to prevent edits after review |
| Modification | Students can edit/delete only submissions with status = "Reçu" |
| Download | Secure file download via signed URLs (edge function) |

### 4.4 Admin Dashboard

| Feature | Details |
|---------|---------|
| Overview | Statistics: total students, classes, projects, submissions |
| Student management | View all students with contact info, status, class enrollment |
| Class management | Create/edit classes with code, title, description, session, signup settings |
| Project management | Create/edit projects with code, title, deadline, description, image, resubmit rules |
| Submission review | Filter by class, project, student, status, date; inline status update; CSV export |
| Pending students | Approve/reject student registrations |
| User management | Role assignments, admin promotion |

### 4.5 Academy System

| Feature | Details |
|---------|---------|
| Academy home | Dashboard with key metrics |
| Class management | Create/manage classes within the academy |
| Student management | View/manage enrolled students |
| Teacher management | Assign teachers to classes |
| Course management | Upload and organize course materials |
| Project management | Create and assign projects to classes |
| Submission review | Review and grade student submissions |
| Pending approvals | Accept/reject student enrollment requests |
| Settings | Academy configuration |

### 4.6 Organization System (Multi-Tenant)

| Feature | Details |
|---------|---------|
| Onboarding | Organization signup with name, slug, description |
| Classes | Organization-scoped classes (`submito_organization_classes`) |
| Courses | Organization-scoped courses (`submito_organization_courses`) |
| Projects | Organization-scoped projects with deadlines |
| Students | Invite-based enrollment with status tracking |
| Submissions | Per-course submissions with grading |
| Members | Role-based member management (owner, admin, member) |
| Invitations | Token-based email invitations with expiry |
| Analytics | Organization-level analytics dashboard |
| AI Insights | AI-powered insights on organization data |

### 4.7 Teacher Dashboard

| Feature | Details |
|---------|---------|
| Home | Overview of assigned classes and recent submissions |
| Login | Dedicated teacher login flow |

### 4.8 Notifications

| Feature | Details |
|---------|---------|
| In-app | Notification bell with unread count |
| Push | Firebase Cloud Messaging (FCM) integration |
| Types | Submission status updates, new assignments, deadlines |
| Storage | `notifications` table with `read_at` tracking |

### 4.9 Messaging (Chat)

| Feature | Details |
|---------|---------|
| Conversations | Class-based or direct chat conversations |
| Real-time | Live message delivery |
| Participants | Multi-participant conversations with read tracking |

---

## 5. Data Model

### Core Tables

| Table | Purpose |
|-------|---------|
| `students` | Student profiles (full_name, email, phone, whatsapp, telegram, github, avatar, status) |
| `classes` | Academic classes (code, title, description, session, signup settings) |
| `projects` | Projects with deadlines and resubmission rules |
| `submissions` | Student submissions with files, links, status, feedback, grades |
| `enrollments` | Student ↔ Class many-to-many relationship |
| `class_projects` | Class ↔ Project many-to-many relationship |
| `class_enrollments` | Alternative enrollment tracking |
| `admins` | Admin user profiles |
| `profiles` | General user profiles |
| `instructors` | Instructor records |
| `class_instructors` | Instructor ↔ Class assignments |
| `notifications` | In-app notification records |
| `fcm_tokens` | Push notification device tokens |
| `course_materials` | Uploaded course files and resources |

### Organization Tables (Multi-Tenant)

| Table | Purpose |
|-------|---------|
| `submito_organizations` | Organization records |
| `submito_organization_classes` | Org-scoped classes |
| `submito_organization_courses` | Org-scoped courses |
| `submito_organization_projects` | Org-scoped projects |
| `submito_organization_students` | Org-scoped student enrollment |
| `submito_organization_submissions` | Org-scoped submissions |
| `submito_organization_invitations` | Member invitations |
| `submito_organization_class_courses` | Class ↔ Course linking |

### Enums

| Enum | Values |
|------|--------|
| `submission_status` | `received`, `in_review`, `validated`, `refused` |

---

## 6. Edge Functions (Backend API)

| Function | Purpose |
|----------|---------|
| `register-student` | Student registration with profile creation |
| `register-admin` | Admin account registration |
| `me-roles` | Fetch current user's roles |
| `get-admin-state` | Get admin dashboard state |
| `choose-class` | Student class enrollment |
| `create-project` | Admin project creation |
| `update-submission` | Student submission create/update |
| `admin-update-submission` | Admin submission status/feedback update |
| `download-submission-file` | Secure file download via signed URL |
| `download-course-material` | Secure course material download |
| `upload-project-image` | Project image upload |
| `get-leaderboard` | Student leaderboard data |
| `create-notification` | Create in-app notification |
| `send-push-notification` | Send FCM push notification |
| `send-student-magic-link` | Magic link authentication |
| `send-student-invitation` | Student enrollment invitation |
| `send-organization-invitation` | Organization member invitation |
| `accept-organization-invitation` | Accept org invitation |
| `create-academy-user` | Academy user creation |
| `create-supervisor` | Supervisor account creation |
| `update-supervisor` | Supervisor profile update |
| `promote-self-to-admin` | Self-promotion to admin role |
| `handle-oauth-signup` | OAuth signup handling |
| `organization-insight-ai` | AI-powered org analytics |
| `zego-token` | ZegoCloud video token generation |

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State | TanStack React Query |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Push notifications | Firebase Cloud Messaging |
| Video | ZegoCloud |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

---

## 8. Security Requirements

| Requirement | Implementation |
|------------|---------------|
| Authentication | Supabase Auth (email/password + magic link) |
| Authorization | Role-based access with route guards |
| Data isolation | RLS policies on all user-facing tables |
| File security | Private storage bucket with signed URL downloads |
| Input validation | Client-side (Zod) + server-side validation |
| HTTPS | Enforced via Supabase/Lovable infrastructure |

---

## 9. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Response time | < 2s for page loads |
| Availability | 99.9% uptime (Supabase SLA) |
| Mobile support | Fully responsive design |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| File upload limit | 25 MB per file |
| Concurrent users | Scales with Supabase infrastructure |

---

## 10. Future Roadmap

| Feature | Priority |
|---------|----------|
| Automated deadline reminders | High |
| Telegram/WhatsApp notifications | High |
| Trainer-specific dashboards | Medium |
| Conditional certificates based on submissions | Medium |
| Bulk file download for admins | Medium |
| Submission versioning UI | Low |
| Offline submission drafts | Low |
| API for third-party integrations | Low |

---

## 11. Pages & Routes

### Public
- `/` — Landing page
- `/etudiant/connexion` — Student login
- `/etudiant/inscription` — Student registration

### Student (Authenticated)
- `/etudiant` — Student dashboard home
- `/etudiant/mes-projets` — My projects
- `/etudiant/mes-soumissions` — My submissions
- `/etudiant/soumettre` — Submit project form
- `/etudiant/mes-cours` — My courses
- `/etudiant/cours/:id` — Course detail
- `/etudiant/classement` — Leaderboard
- `/etudiant/profil` — Profile
- `/etudiant/notifications` — Notifications

### Admin
- `/admin/login` — Admin login
- `/admin` — Admin dashboard
- `/admin/students` — Student management
- `/admin/classes` — Class management
- `/admin/projects` — Project management
- `/admin/submissions` — Submission review
- `/admin/courses` — Course management
- `/admin/pending` — Pending student approvals
- `/admin/users` — User management
- `/admin/settings` — Settings

### Academy
- `/academy/login` — Academy login
- `/academy` — Academy dashboard
- `/academy/classes` — Classes
- `/academy/students` — Students
- `/academy/teachers` — Teachers
- `/academy/projects` — Projects
- `/academy/submissions` — Submissions
- `/academy/courses` — Courses
- `/academy/pending` — Pending approvals
- `/academy/settings` — Settings

### Organization
- `/organization/signup` — Organization signup
- `/organization/signin` — Organization signin
- `/organization/onboarding` — Onboarding
- `/organization/dashboard` — Dashboard
- `/organization/classes` — Classes
- `/organization/courses` — Courses
- `/organization/projects` — Projects
- `/organization/students` — Students
- `/organization/analytics` — Analytics
- `/organization/insight-ai` — AI Insights
- `/organization/settings` — Settings

---

*This PRD reflects the current production state of the Submito platform as of February 2026.*
