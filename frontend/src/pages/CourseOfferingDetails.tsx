import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import Layout from "../components/Layout";

interface EnrollmentUI {
  id: number;
  studentName: string;
  email: string;
  status: string;
  finalMark: number | null;
}

const CourseOfferingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // added
  const [enrollments, setEnrollments] = useState<EnrollmentUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await client.get(
          `/course-offerings/${id}/enrollments`
        );

        const normalized = res.data.map((e: any) => ({
          id: e.id,
          studentName: `${e.student.first_name} ${e.student.last_name}`,
          email: e.student.email,
          status: e.status,
          finalMark: e.final_mark,
        }));

        setEnrollments(normalized);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch enrollments");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [id]);

  const handleMarkChange = async (enrollmentId: number, value: string) => {
    const mark = Number(value);

    setEnrollments((prev) =>
      prev.map((e) =>
        e.id === enrollmentId ? { ...e, finalMark: mark } : e
      )
    );

    try {
      await client.put(`/course-offerings/${enrollmentId}`, {
        mark,
      });
    } catch (err) {
      console.error("Failed to save mark");
    }
  };

  const handleCommit = async () => {
    setCommitting(true);

    try {
      const res = await client.post(
        `/course-offerings/${id}/enrollments/commit`
      );

      const updated = res.data.map((e: any) => ({
        id: e.id,
        studentName: `${e.student.first_name} ${e.student.last_name}`,
        email: e.student.email,
        status: e.status,
        finalMark: e.final_mark,
      }));

      setEnrollments(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to commit marks");
    } finally {
      setCommitting(false);
    }
  };

  const allCompleted = enrollments.every(
    (e) => e.status === "completed"
  );

  return (
    <Layout>
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">Enrollments</h1>
  
      <button
        onClick={handleCommit}
        disabled={committing || allCompleted}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {committing ? "Committing..." : "Commit Marks"}
      </button>
  
      {allCompleted && (
        <p className="mb-4 text-gray-600">
          All marks have been committed.
        </p>
      )}
  
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
  
      <div className="space-y-3">
        {enrollments.map((e) => {
          const isCompleted = e.status === "completed";
  
          return (
            <div
              key={e.id}
              className={`bg-white p-4 rounded-lg shadow ${
                isCompleted ? "opacity-70" : ""
              }`}
            >
              <p className="font-semibold">{e.studentName}</p>
              <p className="text-sm text-gray-600">{e.email}</p>
              <p>Status: {e.status}</p>
  
              <input
                type="number"
                min={0}
                max={100}
                value={e.finalMark ?? ""}
                disabled={isCompleted}
                onChange={(ev) =>
                  handleMarkChange(e.id, ev.target.value)
                }
                className="mt-2 border rounded px-2 py-1 w-24 disabled:bg-gray-200"
              />
  
              {isCompleted && (
                <p className="text-sm text-gray-500 mt-1">
                  Marks are locked
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default CourseOfferingDetails;