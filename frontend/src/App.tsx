import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourseOfferingDetails from "./pages/teacher/TeacherCourseOfferingDetails";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AcademicYearSections from "./pages/admin/AcademicYearSections";
import AcademicYearSectionDetail from "./pages/admin/AcademicYearSectionDetail";
import StudentProfile from "./pages/admin/StudentProfile";
import TeacherProfile from "./pages/admin/TeacherProfile";
import CourseOfferingDetails from "./pages/admin/CourseOfferingDetails";
import SectionDetail from "./pages/admin/SectionDetail";
import DepartmentDetail from "./pages/admin/DepartmentDetail";

const RootRedirect = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={`/${role}/dashboard`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Teacher routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/course-offerings/:id"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherCourseOfferingDetails />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academic-year/sections"
            element={
              <ProtectedRoute allowedRole="admin">
                <AcademicYearSections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academic-year/sections/:sectionId"
            element={
              <ProtectedRoute allowedRole="admin">
                <AcademicYearSectionDetail />
              </ProtectedRoute>
            }
          />
          {/* Removed standalone SectionStudents and SectionCourseOfferings routes */}
          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute allowedRole="admin">
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers/:id"
            element={
              <ProtectedRoute allowedRole="admin">
                <TeacherProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/course-offerings/:id"
            element={
              <ProtectedRoute allowedRole="admin">
                <CourseOfferingDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sections/:sectionId"
            element={
              <ProtectedRoute allowedRole="admin">
                <SectionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments/:id"
            element={
              <ProtectedRoute allowedRole="admin">
                <DepartmentDetail />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;