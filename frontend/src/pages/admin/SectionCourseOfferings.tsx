import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getAdminCourseOfferings } from "../../api/courseOfferings";
import { CourseOffering } from "../../types";

const SectionCourseOfferings = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminCourseOfferings({
          section_id: Number(sectionId),
        });
        setCourseOfferings(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch course offerings");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [sectionId]);

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">Course Offerings</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && courseOfferings.length === 0 && (
        <p className="text-gray-500">No course offerings found for this section.</p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">Course</th>
              <th className="px-4 py-2 border-b">Code</th>
              <th className="px-4 py-2 border-b">Teacher</th>
              <th className="px-4 py-2 border-b">Department</th>
            </tr>
          </thead>
          <tbody>
            {courseOfferings.map((co) => (
              <tr key={co.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b font-medium">
                  {co.course.name}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {co.course.code}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {co.teacher.user.first_name} {co.teacher.user.last_name}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {co.course.department.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default SectionCourseOfferings;