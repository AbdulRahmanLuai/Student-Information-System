import { Teacher, CourseOffering } from "../types";
import { useState } from "react";
import CourseOfferingCard from "./CourseOfferingCard";


interface TeacherCardProps {
  teacher: Teacher;
  onViewCourseOfferings: (teacherId: number) => Promise<CourseOffering[]>;
}

const TeacherCard = ({ teacher, onViewCourseOfferings }: TeacherCardProps) => {
  const [offerings, setOfferings] = useState<CourseOffering[] | null>(null);
  const [showOfferings, setShowOfferings] = useState(false);

  const handleViewOfferings = async () => {
    if (!offerings) {
      const data = await onViewCourseOfferings(teacher.id);
      setOfferings(data);
    }
    setShowOfferings(true);
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2 border-b text-sm text-gray-600">{teacher.id}</td>
        <td className="px-4 py-2 border-b font-medium">
          {teacher.user.first_name} {teacher.user.last_name}
        </td>
        <td className="px-4 py-2 border-b text-sm text-gray-600">
          {teacher.hire_date || "—"}
        </td>
        <td className="px-4 py-2 border-b">
          <button
            onClick={handleViewOfferings}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Course Offerings
          </button>
        </td>
      </tr>

      {showOfferings && offerings && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-4">
              Course Offerings for {teacher.user.first_name} {teacher.user.last_name}
            </h2>
            <CourseOfferingCard
              offerings={offerings}
              readOnly={true}
              showSection={true}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowOfferings(false)}
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

export default TeacherCard;