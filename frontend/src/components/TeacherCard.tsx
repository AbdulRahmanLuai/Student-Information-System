import { Teacher } from "../types";
import { Link } from "react-router-dom";

interface TeacherCardProps {
  teacher: Teacher;
}

const TeacherCard = ({ teacher }: TeacherCardProps) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 border-b text-sm text-gray-600">{teacher.id}</td>
      <td className="px-4 py-2 border-b font-medium">
        {teacher.user.first_name} {teacher.user.last_name}
      </td>
      <td className="px-4 py-2 border-b text-sm text-gray-600">
        {teacher.hire_date || "—"}
      </td>
      <td className="px-4 py-2 border-b">
        <Link
          to={`/admin/teachers/${teacher.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          View Profile
        </Link>
      </td>
    </tr>
  );
};

export default TeacherCard;