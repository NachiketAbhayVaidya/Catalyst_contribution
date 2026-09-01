import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"

import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"

import DashboardPage from "@/pages/student/DashboardPage"
import ProfilePage from "@/pages/student/ProfilePage"
import CoursesPage from "@/pages/student/CoursesPage"
import CourseDetailPage from "@/pages/student/CourseDetailPage"
import ActivitiesPage from "@/pages/student/ActivitiesPage"
import ActivityDetailPage from "@/pages/student/ActivityDetailPage"
import AssignmentPage from "@/pages/student/AssignmentPage"
import QuizPage from "@/pages/student/QuizPage"
import LeaderboardPage from "@/pages/student/LeaderboardPage"
import MissionsPage from "@/pages/student/MissionsPage"
import TeamPage from "@/pages/student/TeamPage"
import NotificationsPage from "@/pages/student/NotificationsPage"
import AICoachPage from "@/pages/student/AICoachPage"

import AdminDashboardPage from "@/pages/admin/AdminDashboardPage"
import AdminCoursesPage from "@/pages/admin/AdminCoursesPage"
import AdminStudentsPage from "@/pages/admin/AdminStudentsPage"
import AdminStudentDetailPage from "@/pages/admin/AdminStudentDetailPage"
import AdminSubmissionsPage from "@/pages/admin/AdminSubmissionsPage"
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage"
import AdminReportsPage from "@/pages/admin/AdminReportsPage"

function CatchAllRedirect() {
  const { user, initializing } = useAuth()
  if (initializing) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === "ADMIN" ? "/admin" : "/"} replace />
}

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              element={
                <ProtectedRoute role="STUDENT">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
              <Route path="/assignments/:assignmentId" element={<AssignmentPage />} />
              <Route path="/quizzes/:quizId" element={<QuizPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/missions" element={<MissionsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/ai-coach" element={<AICoachPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute role="ADMIN">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/courses" element={<AdminCoursesPage />} />
              <Route path="/admin/students" element={<AdminStudentsPage />} />
              <Route path="/admin/students/:studentId" element={<AdminStudentDetailPage />} />
              <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
            </Route>

            <Route path="*" element={<CatchAllRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-right" />
    </TooltipProvider>
  )
}

export default App
