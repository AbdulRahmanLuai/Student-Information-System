import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CourseOfferingDetails from "./pages/teacher/CourseOfferingDetails";

// Both versions
// import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

import AcademicYearSections from "./pages/admin/AcademicYearSections";
import AcademicYearSectionDetail from "./pages/admin/AcademicYearSectionDetail";
import SectionStudents from "./pages/admin/SectionStudents";
import SectionCourseOfferings from "./pages/admin/SectionCourseOfferings";

// 🔥 Toggle here
const useRF = true;

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
                <CourseOfferingDetails />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                {useRF ? <AdminDashboard /> : <AdminDashboard />}
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

          {/* Combined Section Student/Course Routes */}
          <Route
            path="/admin/sections/:sectionId/students"
            element={
              <ProtectedRoute allowedRole="admin">
                <SectionStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sections/:sectionId/course-offerings"
            element={
              <ProtectedRoute allowedRole="admin">
                <SectionCourseOfferings />
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