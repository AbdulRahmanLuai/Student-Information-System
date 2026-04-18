import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getCourseOfferingById, updateCourseOfferingTeacher } from "../../api/courseOfferings";
import { getEnrollmentsForCourseOffering } from "../../api/enrollments";
import { getTeachers } from "../../api/teachers";
import { CourseOffering, Enrollment, Teacher, StudentBasic } from "../../types";
import { deleteEnrollment, addEnrollment, getAvailableStudentsForEnrollment } from "../../api/enrollments";


const CourseOfferingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Teacher editing state
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Enrollment editing state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Enrollment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<StudentBasic[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editMode, setEditMode] = useState(false);


  // Delete handler
  const handleDeleteEnrollment = async () => {
    if (!showDeleteConfirm) return;
    setDeleting(true);
    try {
      await deleteEnrollment(showDeleteConfirm.id);
      // Refresh enrollments
      const newEnrollments = await getEnrollmentsForCourseOffering(Number(id));
      setEnrollments(newEnrollments);
      setShowDeleteConfirm(null);
      setEditMode(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete enrollment");
    } finally {
      setDeleting(false);
    }
  };
  const handleOpenAddModal = async () => {
    if (!offering) return;
    setShowAddModal(true);
    try {
      const students = await getAvailableStudentsForEnrollment(offering.id);
      console.log("Available students:", students); // debug
      setAvailableStudents(students);
      setSelectedStudentId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEnrollment = async () => {
    if (!offering || !selectedStudentId) return;
    setAdding(true);
    try {
      await addEnrollment(offering.id, selectedStudentId);
      const newEnrollments = await getEnrollmentsForCourseOffering(Number(id));
      setEnrollments(newEnrollments);
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to add enrollment");
    } finally {
      setAdding(false);
    }
  };


  const isCurrentSemester = offering?.semester?.status === "current";

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [offeringData, enrollmentsData] = await Promise.all([
          getCourseOfferingById(Number(id)),
          getEnrollmentsForCourseOffering(Number(id)),
        ]);
        setOffering(offeringData);
        setEnrollments(enrollmentsData);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleEditTeacherClick = async () => {
    if (!offering) return;
    setShowEditTeacherModal(true);
    setSelectedTeacherId(offering.teacher?.id ?? null);
    setTeacherError("");
    setLoadingTeachers(true);
    try {
      const teachers = await getTeachers(offering.course.department_id);
      setAvailableTeachers(teachers);
    } catch (err: any) {
      setTeacherError(err.response?.data?.detail || "Failed to fetch teachers");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSaveTeacher = async () => {
    if (!offering || !selectedTeacherId) return;
    setSavingTeacher(true);
    setTeacherError("");
    try {
      const updated = await updateCourseOfferingTeacher(offering.id, selectedTeacherId);
      setOffering(updated);
      setShowEditTeacherModal(false);
    } catch (err: any) {
      setTeacherError(err.response?.data?.detail || "Failed to update teacher");
    } finally {
      setSavingTeacher(false);
    }
  };

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="text-red-500">{error}</div></AdminLayout>;
  if (!offering) return <AdminLayout><div>Course offering not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {offering.course.name} ({offering.course.code})
        </h1>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Section</p>
            <p className="font-medium">{offering.section.grade}{offering.section.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Semester</p>
            <p className="font-medium">
              Year {offering.semester.academic_year_start}-{offering.semester.academic_year_end}, Sem {offering.semester.number}
              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${offering.semester.status === "current" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {offering.semester.status}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Teacher</p>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {offering.teacher ? `${offering.teacher.user.first_name} ${offering.teacher.user.last_name}` : "Not assigned"}
              </p>
              {isCurrentSemester && (
                <button
                  onClick={handleEditTeacherClick}
                  className="text-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                >
                  Edit Teacher
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Department</p>
            <p className="font-medium">{offering.course.department.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">
              <span className={`text-xs px-2 py-1 rounded-full ${
                offering.status === "active" ? "bg-green-100 text-green-700" : 
                offering.status === "completed" ? "bg-blue-100 text-blue-700" : 
                "bg-gray-100 text-gray-500"
              }`}>
                {offering.status || "unknown"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Enrollments</h2>
          <div className="flex gap-2">
            {isCurrentSemester && (
              <>
                <button
                  onClick={handleOpenAddModal}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Enroll Student
                </button>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Edit Enrollments
                  </button>
                ) : (
                  <button
                    onClick={() => setEditMode(false)}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-white border rounded-lg shadow">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2 border-b">ID</th>
                <th className="px-4 py-2 border-b">Student</th>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">Final Mark</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr) => (
                <tr key={enr.id}>
                  <td className="px-4 py-2 border-b text-sm text-gray-600">{enr.student.id}</td>
                  <td className="px-4 py-2 border-b font-medium">
                    {enr.student.first_name} {enr.student.last_name}
                  </td>
                  <td className="px-4 py-2 border-b text-sm text-gray-600">{enr.student.email}</td>
                  <td className="px-4 py-2 border-b">{enr.final_mark ?? "—"}</td>
                  <td className="px-4 py-2 border-b">
                    <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                      enr.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {enr.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b">
                    {editMode && (
                      <button
                        onClick={() => setShowDeleteConfirm(enr)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Edit Teacher Modal */}
      {showEditTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-1">Edit Teacher</h2>
            <p className="text-sm text-gray-500 mb-4">
              {offering.course.name} — {offering.course.department.name}
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

            {teacherError && <p className="text-red-500 text-sm mb-3">{teacherError}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEditTeacherModal(false)}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeacher}
                disabled={!selectedTeacherId || savingTeacher || loadingTeachers}
                className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {savingTeacher ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <h2 className="text-lg font-semibold mb-2">Confirm Delete</h2>
              <p>Are you sure you want to remove {showDeleteConfirm.student.first_name} {showDeleteConfirm.student.last_name} from this course offering? Their mark and progress will be lost.</p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1 border rounded">Cancel</button>
                <button onClick={handleDeleteEnrollment} disabled={deleting} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Add student modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Enroll Student</h2>
              <label className="block text-sm text-gray-600 mb-1">Select Student</label>
              <select
                value={selectedStudentId ?? ""}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 mb-4"
              >
                <option value="">— Select a student —</option>
                {availableStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddModal(false)} className="px-3 py-1 border rounded">Cancel</button>
                <button onClick={handleAddEnrollment} disabled={!selectedStudentId || adding} className="px-3 py-1 bg-blue-600 text-white rounded">Enroll</button>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default CourseOfferingDetails;