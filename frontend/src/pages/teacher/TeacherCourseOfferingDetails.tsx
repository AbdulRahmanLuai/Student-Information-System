import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeacherLayout from "../../components/TeacherLayout";
import CommitWarningModal from "./components/CommitWarningModal"
import { getEnrollments, enterMark, commitMarks, getCourseOfferingById } from "../../api/teacher/courseOfferings";
import { Enrollment, CourseOffering } from "../../types";
const TeacherCourseOfferingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [committing, setCommitting] = useState(false);
  const [ShowCommitWarning, setShowCommitWarning] = useState(false);

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


  const [courseOffering, setCourseOffering] = useState<CourseOffering | null>(null);
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
      await enterMark(enrollmentId, mark);
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
      <button
        onClick={() => navigate("/teacher/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>

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

      <button
        onClick={() => setShowCommitWarning(true)}
        disabled={committing || allCompleted}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {committing ? "Committing..." : "Commit Marks"}
      </button>

      {allCompleted && (
        <p className="mb-4 text-gray-600">All marks have been committed.</p>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
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
                  <td className="px-4 py-2 border-b text-sm text-gray-600">
                    {e.student.email}
                  </td>
                  <td className="px-4 py-2 border-b">{e.status}</td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={e.final_mark ?? ""}
                      disabled={isCompleted}
                      onChange={(ev) => handleMarkChange(e.id, ev.target.value)}
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
    </TeacherLayout>
  );
};

export default TeacherCourseOfferingDetails;