import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getAdminCourseOfferings, updateCourseOfferingTeacher } from "../../api/courseOfferings";
import { getTeachers } from "../../api/teachers";
import { CourseOffering, Teacher } from "../../types";

const SectionCourseOfferings = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit modal state
  const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

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

  const handleEditClick = async (co: CourseOffering) => {
    setEditingOffering(co);
    setSelectedTeacherId(co.teacher.id);
    setEditError("");
    setLoadingTeachers(true);

    try {
      const teachers = await getTeachers(co.course.department_id);
      setAvailableTeachers(teachers);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || "Failed to fetch teachers");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSave = async () => {
    if (!editingOffering || !selectedTeacherId) return;
    setSaving(true);
    setEditError("");

    try {
      const updated = await updateCourseOfferingTeacher(
        editingOffering.id,
        selectedTeacherId
      );
      setCourseOfferings((prev) =>
        prev.map((co) => (co.id === updated.id ? updated : co))
      );
      setEditingOffering(null);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || "Failed to update teacher");
    } finally {
      setSaving(false);
    }
  };

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
              <th className="px-4 py-2 border-b">Actions</th>
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
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => handleEditClick(co)}
                    className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                  >
                    Edit Teacher
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Teacher Modal */}
      {editingOffering && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-1">Edit Teacher</h2>
            <p className="text-sm text-gray-500 mb-4">
              {editingOffering.course.name} — {editingOffering.course.department.name}
            </p>

            {loadingTeachers ? (
              <p className="text-sm text-gray-500">Loading teachers...</p>
            ) : (
              <>
                <label className="block text-sm text-gray-600 mb-1">
                  Select Teacher
                </label>
                <select
                  value={selectedTeacherId ?? ""}
                  onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2 mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Select a teacher —</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.first_name} {t.user.last_name}
                    </option>
                  ))}
                </select>
              </>
            )}

            {editError && (
              <p className="text-red-500 text-sm mb-3">{editError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditingOffering(null);
                  setEditError("");
                }}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedTeacherId || saving || loadingTeachers}
                className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SectionCourseOfferings;