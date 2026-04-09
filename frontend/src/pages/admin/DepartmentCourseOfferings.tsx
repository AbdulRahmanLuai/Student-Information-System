import { useEffect, useState } from "react";
import { CourseOffering } from "../../types";
import { getCourseOfferingsByDepartment } from "../../api/departments";
import CourseOfferingCard from "../../components/CourseOfferingCard";

interface DepartmentCourseOfferingsProps {
  departmentId: number;
}

const DepartmentCourseOfferings = ({ departmentId }: DepartmentCourseOfferingsProps) => {
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getCourseOfferingsByDepartment(departmentId);
        setOfferings(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load course offerings");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [departmentId]);

  if (loading) return <p>Loading course offerings...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (offerings.length === 0) return <p className="text-gray-500">No course offerings found.</p>;

  return <CourseOfferingCard offerings={offerings} readOnly={true} showSection={true} />;
};

export default DepartmentCourseOfferings;   