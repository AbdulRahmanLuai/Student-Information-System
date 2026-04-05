import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherLayout from "../../components/TeacherLayout";
import { getMyCourseOfferings } from "../../api/courseOfferings";
import { CourseOffering } from "../../types";

const TeacherDashboard = () => {
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMyCourseOfferings();
        setCourseOfferings(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch course offerings");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <TeacherLayout>
      <h1 className="text-2xl font-bold mb-6">My Course Offerings</h1>

      {loading && <p>Loading course offerings...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courseOfferings.map((co) => (
          <div
            key={co.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
          >
            <h2 className="font-semibold text-lg">{co.course.name}</h2>
            <p className="text-gray-600">
              Section: {co.section.grade}{co.section.name}
            </p>
            <p className="text-gray-600">
              Semester: {co.semester.academic_year_start}/{co.semester.academic_year_end} — Sem {co.semester.number}
            </p>
            <button
              className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              onClick={() => navigate(`/teacher/course-offerings/${co.id}`)}
            >
              View Enrollments
            </button>
          </div>
        ))}
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;