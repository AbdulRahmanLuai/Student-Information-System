import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeacherLayout from "../../components/TeacherLayout";
import CommitWarningModal from "./components/CommitWarningModal";
import {
  getEnrollments,
  commitMarks,
  getCourseOfferingById,
  uploadMarks,
  enterMarks,
} from "../../api/teacher/courseOfferings";
import { Enrollment, CourseOffering } from "../../types";

const TeacherCourseOfferingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [committing, setCommitting] = useState(false);
  const [ShowCommitWarning, setShowCommitWarning] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [previewData, setPreviewData] = useState<
    { student_id: number; current_mark: string | null; new_mark: number }[]
  >([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [courseOffering, setCourseOffering] = useState<CourseOffering | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadMarks(Number(id), file);

      if (!result.data) {
        alert("Upload failed: " + (result.message || "Unknown error"));
        return;
      }

      const preview = result.data.map((item: any) => {
        const enrollment = enrollments.find(en => en.student.id === item.student_id);
        return {
          student_id: item.student_id,
          current_mark: enrollment?.final_mark ?? null,
          new_mark: item.final_mark,
        };
      });

      setPreviewData(preview);
      setShowPreviewModal(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      alert(typeof detail === "string" ? detail : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const confirmUpload = async () => {
    const updates = previewData.map(p => {
      const enrollment = enrollments.find(e => e.student.id === p.student_id);
      return { enrollment_id: enrollment!.id, final_mark: p.new_mark };
    });

    try {
      await enterMarks(Number(id), updates);
      const refreshed = await getEnrollments(Number(id));
      setEnrollments(refreshed);
      setShowPreviewModal(false);
    } catch (err: any) {
      alert("Failed to save marks: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [enrollmentData, offeringData] = await Promise.all([
          getEnrollments(Number(id)),
          getCourseOfferingById(Number(id)),
        ]);
        setEnrollments(enrollmentData);
        setCourseOffering(offeringData);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch enrollments");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id]);

  const handleMarkChange = async (enrollmentId: number, value: string) => {
    const mark = Number(value);

    setEnrollments((prev) =>
      prev.map((e) =>
        e.id === enrollmentId
          ? { ...e, final_mark: String(mark) }
          : e
      )
    );

    try {
      await enterMarks(Number(id), [{ enrollment_id: enrollmentId, final_mark: mark }]);
    } catch {
      console.error("Failed to save mark");
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    setShowCommitWarning(false);
    try {
      const updated = await commitMarks(Number(id));
      setEnrollments(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to commit marks");
    } finally {
      setCommitting(false);
    }
  };

  const allCompleted = enrollments.every((e) => e.status === "completed");

  return (
    <TeacherLayout>

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/teacher/dashboard")}
        className="mb-3 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
      >
        ← Back to Dashboard
      </button>

      {/* TITLE */}
      <h1 className="text-2xl font-bold mb-6">
        {courseOffering
          ? `${courseOffering.course.name} (${courseOffering.course.code}) — Grade ${courseOffering.section.grade}${courseOffering.section.name}`
          : "Enrollments"}
      </h1>

      <CommitWarningModal
        show={ShowCommitWarning}
        committing={committing}
        error={error}
        onCancel={() => setShowCommitWarning(false)}
        onConfirm={handleCommit}
      />

      {/* ACTIONS */}
      <div className="flex gap-2 mb-6">

        <button
          onClick={() => setShowCommitWarning(true)}
          disabled={committing || allCompleted}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-slate-400 transition"
        >
          {committing ? "Committing..." : "Commit Marks"}
        </button>

        <button
          onClick={() => document.getElementById("marks-upload")?.click()}
          disabled={uploading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-slate-400 transition"
        >
          {uploading ? "Uploading..." : "Upload Excel"}
        </button>

        <input
          id="marks-upload"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="hidden"
        />

        <a
          href="/template_marks.xlsx"
          download
          className="text-sm text-indigo-600 hover:underline self-center ml-2"
        >
          Download Template
        </a>

      </div>

      {allCompleted && (
        <p className="mb-4 text-sm text-slate-600">
          All marks have been committed.
        </p>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* TABLE */}
      <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-slate-200 rounded-lg text-sm">

        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2 border-b">ID</th>
            <th className="px-4 py-2 border-b">Student</th>
            <th className="px-4 py-2 border-b">Email</th>
            <th className="px-4 py-2 border-b">Status</th>
            <th className="px-4 py-2 border-b">Final Mark</th>
            <th className="px-4 py-2 border-b">Note</th>
          </tr>
        </thead>

        <tbody>
          {enrollments.map((e) => {
            const isCompleted = e.status === "completed";

            return (
              <tr
                key={e.id}
                className={isCompleted ? "bg-gray-50 opacity-70" : ""}
              >
                <td className="px-4 py-2 border-b">{e.student.id}</td>

                <td className="px-4 py-2 border-b font-medium">
                  {e.student.first_name} {e.student.last_name}
                </td>

                <td className="px-4 py-2 border-b text-gray-600">
                  {e.student.email}
                </td>

                <td className="px-4 py-2 border-b">
                  {e.status}
                </td>

                <td className="px-4 py-2 border-b">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={e.final_mark ?? ""}
                    disabled={isCompleted}
                    onChange={(ev) =>
                      handleMarkChange(e.id, ev.target.value)
                    }
                    className="border rounded px-2 py-1 w-20 disabled:bg-gray-200"
                  />
                </td>

                <td className="px-4 py-2 border-b text-sm text-gray-500">
                  {isCompleted ? "Marks are locked" : ""}
                </td>
              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">

            <h2 className="text-xl font-semibold mb-4">Preview Marks</h2>

            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b">Student</th>
                  <th className="px-4 py-2 border-b">Current Mark</th>
                  <th className="px-4 py-2 border-b">New Mark</th>
                </tr>
              </thead>

              <tbody>
                {previewData.map(p => {
                  const student = enrollments.find(e => e.student.id === p.student_id)?.student;

                  return (
                    <tr key={p.student_id}>
                      <td className="px-4 py-2 border-b">
                        {student?.first_name} {student?.last_name}
                      </td>
                      <td className="px-4 py-2 border-b">{p.current_mark ?? "—"}</td>
                      <td className="px-4 py-2 border-b font-medium">{p.new_mark}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end gap-2 mt-4">

              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmUpload}
                className="px-4 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Apply Marks
              </button>

            </div>

          </div>
        </div>
      )}

    </TeacherLayout>
  );
};

export default TeacherCourseOfferingDetails;