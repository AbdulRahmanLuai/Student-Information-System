import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CourseOfferingCard from "../../components/CourseOfferingCard";
import { getCourseOfferings, updateCourseOfferingTeacher } from "../../api/courseOfferings";
import { getTeachers } from "../../api/teachers";
import { CourseOffering } from "../../types";

const SectionCourseOfferings = () => {
  const { sectionId } = useParams();
  const [groupedOfferings, setGroupedOfferings] = useState<Map<number, { offerings: CourseOffering[]; status: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOfferings = async () => {
      if (!sectionId) return;
      try {
        const data = await getCourseOfferings({ section_id: Number(sectionId) });
        const groups = new Map<number, { offerings: CourseOffering[]; status: string }>();
        data.forEach((offering) => {
          const semNum = offering.semester.number;
          const status = offering.semester.status;
          if (!groups.has(semNum)) groups.set(semNum, { offerings: [], status });
          groups.get(semNum)!.offerings.push(offering);
        });
        setGroupedOfferings(groups);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch course offerings");
      } finally {
        setLoading(false);
      }
    };
    fetchOfferings();
  }, [sectionId]);

  const handleUpdateTeacher = async (offeringId: number, teacherId: number) => {
    const updated = await updateCourseOfferingTeacher(offeringId, teacherId);
    // Refresh offerings after update
    const refreshed = await getCourseOfferings({ section_id: Number(sectionId) });
    const groups = new Map<number, { offerings: CourseOffering[]; status: string }>();
    refreshed.forEach((offering) => {
      const semNum = offering.semester.number;
      const status = offering.semester.status;
      if (!groups.has(semNum)) groups.set(semNum, { offerings: [], status });
      groups.get(semNum)!.offerings.push(offering);
    });
    setGroupedOfferings(groups);
    return updated;
  };

  const fetchTeachersForDepartment = async (departmentId: number) => {
    return await getTeachers(departmentId);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (groupedOfferings.size === 0) return <p className="text-gray-500">No course offerings found.</p>;

  const sortedSemesters = Array.from(groupedOfferings.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {sortedSemesters.map((semNum) => {
        const { offerings, status } = groupedOfferings.get(semNum)!;
        const isCurrent = status === "current";
        return (
          <div key={semNum} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-semibold flex justify-between items-center">
              <span>Semester {semNum}</span>
              {!isCurrent && (
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Read-only (past semester)</span>
              )}
            </div>
            <div className="p-4">
              <CourseOfferingCard
                offerings={offerings}
                showSection={false}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SectionCourseOfferings;