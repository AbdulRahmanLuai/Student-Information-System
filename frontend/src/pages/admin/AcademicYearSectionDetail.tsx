import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getSectionDetail, updateSection } from "../../api/academicYear";
import { SetupSectionDetail, CourseAssignment } from "../../types";

const AcademicYearSectionDetail = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<SetupSectionDetail | null>(null);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSectionDetail(Number(sectionId));
        setSection(data);
        setAssignments(
          data.courses.map((c) => ({
            setup_course_id: c.setup_course_id,
            teacher_id: c.teacher_id,
          }))
        );
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch section detail");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [sectionId]);

  const handleTeacherChange = (setupCourseId: number, teacherId: number | null) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.setup_course_id === setupCourseId ? { ...a, teacher_id: teacherId } : a
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSection(Number(sectionId), assignments);
      navigate("/admin/academic-year/sections");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save section");
    } finally {
      setSaving(false);
    }
  };


  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/academic-year/sections")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Sections
      </button>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {section && (
        <>
          <h1 className="text-2xl font-bold mb-6">
            Configure Section: {section.section}
          </h1>

          <div className="bg-white rounded-lg shadow divide-y mb-6">
            {section.courses.map((course) => {
              const currentAssignment = assignments.find(
                (a) => a.setup_course_id === course.setup_course_id
              );

              return (
                <div
                  key={course.setup_course_id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <p className="font-medium">{course.course_name}</p>
                  <select
                    value={currentAssignment?.teacher_id ?? ""}
                    onChange={(e) =>
                      handleTeacherChange(
                        course.setup_course_id,
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="border rounded px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select a teacher —</option>
                    {course.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition"
          >
            {saving ? "Saving..." : "Save & Back to Sections"}
          </button>
        </>
      )}
    </AdminLayout>
  );
};

export default AcademicYearSectionDetail;