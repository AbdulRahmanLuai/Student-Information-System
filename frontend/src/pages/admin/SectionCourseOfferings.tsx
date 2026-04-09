import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import CourseOfferingsTable from "../../components/CourseOfferingCard";
import { getAdminCourseOfferings, updateCourseOfferingTeacher } from "../../api/courseOfferings";
import { getTeachers } from "../../api/teachers";
import { CourseOffering } from "../../types";

const SectionCourseOfferings = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchOfferings = async () => {
    try {
      const data = await getAdminCourseOfferings({ section_id: Number(sectionId) });
      setCourseOfferings(data);
      if (data.length > 0) {
        const s = data[0].section;
        setSectionName(`Grade ${s.grade} - ${s.name}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch course offerings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, [sectionId, refreshKey]);

  const handleUpdateTeacher = async (offeringId: number, teacherId: number) => {
    const updated = await updateCourseOfferingTeacher(offeringId, teacherId);
    // Refresh the list after update
    setRefreshKey((prev) => prev + 1);
    return updated;
  };

  const fetchTeachersForDepartment = async (departmentId: number) => {
    return await getTeachers(departmentId);
  };

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Course Offerings {sectionName && `— ${sectionName}`}
      </h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && courseOfferings.length === 0 && (
        <p className="text-gray-500">No course offerings found for this section.</p>
      )}

      {!loading && courseOfferings.length > 0 && (
        <CourseOfferingsTable
          offerings={courseOfferings}
          onUpdateTeacher={handleUpdateTeacher}
          fetchTeachers={fetchTeachersForDepartment}
          canEdit={true}
        />
      )}
    </AdminLayout>
  );
};

export default SectionCourseOfferings;