import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherLayout from "../../components/TeacherLayout";
import { getMyCourseOfferings } from "../../api/teacher/courseOfferings";
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
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          My Course Offerings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of your assigned courses and sections
        </p>
      </div>

      {/* STATES */}
      {loading && (
        <p className="text-slate-500 text-sm">Loading course offerings...</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md mb-4">
          {error}
        </p>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courseOfferings.map((co) => (
          <div
            key={co.id}
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition"
          >
            {/* TITLE */}
            <h2 className="font-semibold text-lg text-slate-900">
              {co.course.name}
            </h2>

            {/* META */}
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <p>
                Section:{" "}
                <span className="font-medium text-slate-800">
                  {co.section.grade}
                  {co.section.name}
                </span>
              </p>

              <p>
                Semester:{" "}
                <span className="text-slate-800">
                  {co.semester.academic_year_start}/
                  {co.semester.academic_year_end} — Sem {co.semester.number}
                </span>
              </p>
            </div>

            {/* ACTION */}
            <button
              className="mt-4 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
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