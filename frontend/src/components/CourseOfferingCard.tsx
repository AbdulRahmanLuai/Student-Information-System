import { Link } from "react-router-dom";
import { CourseOffering } from "../types";

interface CourseOfferingCardProps {
  offerings: CourseOffering[];
  showSection?: boolean;
}

const CourseOfferingCard = ({
  offerings,
  showSection = false,
}: CourseOfferingCardProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            {showSection && <th className="px-4 py-2 border-b">Section</th>}
            <th className="px-4 py-2 border-b">Course</th>
            <th className="px-4 py-2 border-b">Code</th>
            <th className="px-4 py-2 border-b">Teacher</th>
            <th className="px-4 py-2 border-b">Department</th>
            <th className="px-4 py-2 border-b">Details</th>
          </tr>
        </thead>
        <tbody>
          {offerings.map((co) => (
            <tr key={co.id} className="hover:bg-gray-50">
              {showSection && (
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {co.section.grade}{co.section.name}
                </td>
              )}
              <td className="px-4 py-2 border-b font-medium">{co.course.name}</td>
              <td className="px-4 py-2 border-b text-sm text-gray-600">{co.course.code}</td>
              <td className="px-4 py-2 border-b text-sm text-gray-600">
                {co.teacher ? `${co.teacher.user.first_name} ${co.teacher.user.last_name}` : "Not assigned"}
              </td>
              <td className="px-4 py-2 border-b text-sm text-gray-600">
                {co.course.department.name}
              </td>
              <td className="px-4 py-2 border-b">
                <Link
                  to={`/admin/course-offerings/${co.id}`}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 inline-block text-center"
                >
                  Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseOfferingCard;