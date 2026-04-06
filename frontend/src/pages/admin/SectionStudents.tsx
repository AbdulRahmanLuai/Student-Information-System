import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import client from "../../api/client";
import { Student } from "../../types";
import { getSectionById } from "../../api/sections";

const SectionStudents = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionName, setSectionName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = Number(sectionId);

        // fetch in parallel (cleaner + faster)
        const [studentsRes, section] = await Promise.all([
          client.get("/admin/students", {
            params: { section_id: id },
          }),
          getSectionById(id),
        ]);

        setStudents(studentsRes.data);
        setSectionName(`Grade ${section.grade} - ${section.name}`);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) fetchData();
  }, [sectionId]);

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Students {sectionName && `— ${sectionName}`}
      </h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && students.length === 0 && (
        <p className="text-gray-500">
          No students found for this section.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Email</th>
              <th className="px-4 py-2 border-b">Enrollment Date</th>
              <th className="px-4 py-2 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b font-medium">
                  {s.first_name} {s.last_name}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {s.email}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {s.enrollment_date ?? "—"}
                </td>
                <td className="px-4 py-2 border-b">
                  <span
                    className={`text-sm px-2 py-1 rounded-full font-medium ${
                      s.status === "active"
                        ? "bg-green-100 text-green-700"
                        : s.status === "graduated"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default SectionStudents;