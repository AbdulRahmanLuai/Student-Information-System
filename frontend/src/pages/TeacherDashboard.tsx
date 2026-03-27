import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import client from "../api/client";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

interface CourseOfferingUI {
  id: number;
  courseName: string;
  sectionName: string;
  semesterName: string;
}

const Dashboard = () => {
  const { isAuthenticated, logout } = useAuth();
  const [courseOfferings, setCourseOfferings] = useState<CourseOfferingUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCourseOfferings = async () => {
      try {
        const res = await client.get("/course-offerings");

        const normalized = res.data.map((co: any) => ({
          id: co.id,
          courseName: co.course.name,
          sectionName: co.section.name,
          semesterName: `${co.semester.academic_year_start}/${co.semester.academic_year_end} - Sem ${co.semester.number}`,
        }));

        setCourseOfferings(normalized);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch course offerings");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseOfferings();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div className="p-4">Unauthorized. Please log in as a teacher.</div>;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>
  
      {loading && <p>Loading course offerings...</p>}
      {error && <p className="text-red-500">{error}</p>}
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courseOfferings.map((co) => (
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
            <h2 className="font-semibold text-lg">{co.courseName}</h2>
            <p className="text-gray-600">Section: {co.sectionName}</p>
            <p className="text-gray-600">Semester: {co.semesterName}</p>
  
            <button
              className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              onClick={() => navigate(`/course-offerings/${co.id}`)}
            >
              View Enrollments
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Dashboard;