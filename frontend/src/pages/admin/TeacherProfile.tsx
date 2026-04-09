import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getTeacherById } from "../../api/teachers";
import { Teacher } from "../../types";

const TeacherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!id) return;
      try {
        const data = await getTeacherById(Number(id));
        setTeacher(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load teacher");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ← Back to Dashboard
      </button>
      <div className="bg-white rounded-lg shadow p-6">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {teacher && (
          <>
            <h1 className="text-2xl font-bold mb-4">
              {teacher.user.first_name} {teacher.user.last_name}
            </h1>
            <div className="space-y-2">
              <p><strong>Email:</strong> {teacher.user.email}</p>
              <p><strong>Hire Date:</strong> {teacher.hire_date || "—"}</p>
              <p><strong>Department:</strong> {teacher.department_id ? `ID: ${teacher.department_id}` : "—"}</p>
            </div>
            {/* Add tabs for course offerings, etc. */}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default TeacherProfile;