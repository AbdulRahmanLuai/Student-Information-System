import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getStudentById } from "../../api/students";
import { Student } from "../../types";

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;
      try {
        const data = await getStudentById(Number(id));
        setStudent(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load student");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
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
        {student && (
          <>
            <h1 className="text-2xl font-bold mb-4">
              {student.first_name} {student.last_name}
            </h1>
            <div className="space-y-2">
              <p><strong>Email:</strong> {student.email}</p>
              <p><strong>Status:</strong> {student.status}</p>
              <p><strong>Enrollment Date:</strong> {student.enrollment_date || "—"}</p>
              <p><strong>Section:</strong> {student.section ? `${student.section.grade}${student.section.name}` : "—"}</p>
            </div>
            {/* Add more tabs/sections later: enrollments, marks, etc. */}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default StudentProfile;