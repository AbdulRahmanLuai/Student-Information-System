import { useState } from "react";
import { CourseOffering, Teacher, Enrollment } from "../types";
import { getEnrollmentsForCourseOffering } from "../api/enrollments";

interface CourseOfferingCardProps {
  offerings: CourseOffering[];
  onUpdateTeacher?: (offeringId: number, teacherId: number) => Promise<CourseOffering>;
  fetchTeachers?: (departmentId: number) => Promise<Teacher[]>;
  canEdit?: boolean;
  readOnly?: boolean;
  showSection?: boolean;
}

const CourseOfferingCard = ({
  offerings,
  onUpdateTeacher,
  fetchTeachers,
  canEdit = true,
  readOnly = false,
  showSection = false,
}: CourseOfferingCardProps) => {
  const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Enrollments modal state
  const [enrollmentsOffering, setEnrollmentsOffering] = useState<CourseOffering | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState("");

  const showEdit = !readOnly && canEdit;

  const handleEditClick = async (co: CourseOffering) => {
    if (!fetchTeachers) return;
    setEditingOffering(co);
    setSelectedTeacherId(co.teacher?.id ?? null);  // handle null teacher
    setError("");
    setLoadingTeachers(true);

    try {
      const teachers = await fetchTeachers(co.course.department_id);
      setAvailableTeachers(teachers);
    } catch (err: any) {
      setError(err.message || "Failed to fetch teachers");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSave = async () => {
    if (!editingOffering || !selectedTeacherId || !onUpdateTeacher) return;
    setSaving(true);
    setError("");

    try {
      await onUpdateTeacher(editingOffering.id, selectedTeacherId);
      setEditingOffering(null);
    } catch (err: any) {
      setError(err.message || "Failed to update teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleViewEnrollments = async (co: CourseOffering) => {
    setEnrollmentsOffering(co);
    setEnrollments([]);
    setEnrollmentsError("");
    setLoadingEnrollments(true);

    try {
      const data = await getEnrollmentsForCourseOffering(co.id);
      setEnrollments(data);
    } catch (err: any) {
      setEnrollmentsError(err.response?.data?.detail || "Failed to load enrollments");
    } finally {
      setLoadingEnrollments(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
          <thead className="bg-gray-100 text-left">
            <tr>
              {showSection && <th className="px-4 py-2 border-b">Section</th>}
              <th className="px-4 py-2 border-b">Course</th>
              <th className="px-4 py-2 border-b">Code</th>
              <th className="px-4 py-2 border-b">Teacher</th>
              <th className="px-4 py-2 border-b">Department</th>
              <th className="px-4 py-2 border-b">Enrollments</th>
              {showEdit && <th className="px-4 py-2 border-b">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {offerings.map((co) => (
              <tr key={co.id} className="hover:bg-gray-50">
                {showSection && (
                  <td className="px-4 py-2 border-b text-sm text-gray-600">
                    {co.section.grade}{co.section.name}
                  </td>
                )}
                <td className="px-4 py-2 border-b font-medium">{co.course.name}</td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">{co.course.code}</td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {co.teacher ? `${co.teacher.user.first_name} ${co.teacher.user.last_name}` : "Not assigned"}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {co.course.department.name}
                </td>
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => handleViewEnrollments(co)}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    View Enrollments
                  </button>
                </td>
                {showEdit && (
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => handleEditClick(co)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Edit Teacher
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Teacher Modal */}
      {showEdit && editingOffering && (
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
                <label className="block text-sm text-gray-600 mb-1">Select Teacher</label>
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

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingOffering(null)}
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

      {/* View Enrollments Modal */}
      {enrollmentsOffering && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-2">
              Enrollments for {enrollmentsOffering.course.name} ({enrollmentsOffering.course.code})
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Section: {enrollmentsOffering.section.grade}{enrollmentsOffering.section.name}<br />
              Teacher: {enrollmentsOffering.teacher ? `${enrollmentsOffering.teacher.user.first_name} ${enrollmentsOffering.teacher.user.last_name}` : "Not assigned"}            </p>

            {loadingEnrollments ? (
              <p className="text-gray-500">Loading enrollments...</p>
            ) : enrollmentsError ? (
              <p className="text-red-500">{enrollmentsError}</p>
            ) : enrollments.length === 0 ? (
              <p className="text-gray-500">No enrollments found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border-b text-left">Student</th>
                      <th className="px-4 py-2 border-b text-left">Email</th>
                      <th className="px-4 py-2 border-b text-left">Final Mark</th>
                      <th className="px-4 py-2 border-b text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enr) => (
                      <tr key={enr.id}>
                        <td className="px-4 py-2 border-b">
                          {enr.student.first_name} {enr.student.last_name}
                        </td>
                        <td className="px-4 py-2 border-b text-sm text-gray-600">
                          {enr.student.email}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {enr.final_mark ?? "—"}
                        </td>
                        <td className="px-4 py-2 border-b">
                          <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                            enr.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {enr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setEnrollmentsOffering(null)}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseOfferingCard;