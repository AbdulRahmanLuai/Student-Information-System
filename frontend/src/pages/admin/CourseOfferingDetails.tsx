import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getCourseOfferingById } from "../../api/courseOfferings";
import { CourseOffering } from "../../types";

const CourseOfferingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOffering = async () => {
      if (!id) return;
      try {
        const data = await getCourseOfferingById(Number(id));
        setOffering(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load course offering");
      } finally {
        setLoading(false);
      }
    };
    fetchOffering();
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
        {offering && (
          <>
            <h1 className="text-2xl font-bold mb-4">
              {offering.course.name} ({offering.course.code})
            </h1>
            <div className="space-y-2">
              <p><strong>Section:</strong> {offering.section.name} (Grade {offering.section.grade})</p>
              <p>
                <strong>Teacher:</strong>{" "}
                {offering.teacher
                  ? `${offering.teacher.user.first_name} ${offering.teacher.user.last_name}`
                  : "Not assigned"}
              </p>
              <p><strong>Department:</strong> {offering.course.department.name}</p>
              <p><strong>Semester:</strong> Year {offering.semester.academic_year_start}-{offering.semester.academic_year_end}, Sem {offering.semester.number}</p>
            </div>
            {/* Add enrollments table, edit teacher, etc. */}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default CourseOfferingDetails;