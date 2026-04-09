import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CourseOfferingCard from "../../components/CourseOfferingCard";
import { getAdminCourseOfferings, updateCourseOfferingTeacher } from "../../api/courseOfferings";
import { getTeachers } from "../../api/teachers";
import { CourseOffering } from "../../types";

const SectionCourseOfferings = () => {
  const { sectionId } = useParams();
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchOfferings = async () => {
    try {
      const data = await getAdminCourseOfferings({ section_id: Number(sectionId) });
      setCourseOfferings(data);
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
    setRefreshKey((prev) => prev + 1);
    return updated;
  };

  const fetchTeachersForDepartment = async (departmentId: number) => {
    return await getTeachers(departmentId);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (courseOfferings.length === 0) return <p className="text-gray-500">No course offerings found for this section.</p>;

  return (
    <CourseOfferingCard
      offerings={courseOfferings}
      onUpdateTeacher={handleUpdateTeacher}
      fetchTeachers={fetchTeachersForDepartment}
      canEdit={true}
    />
  );
};

export default SectionCourseOfferings;