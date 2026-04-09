import { useEffect, useState } from "react";
import { Teacher } from "../../types";
import { getTeachersByDepartment } from "../../api/departments";
import TeacherCard from "../../components/TeacherCard";

interface DepartmentTeachersProps {
  departmentId: number;
}

const DepartmentTeachers = ({ departmentId }: DepartmentTeachersProps) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getTeachersByDepartment(departmentId);
        setTeachers(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load teachers");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [departmentId]);

  if (loading) return <p>Loading teachers...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2 border-b">ID</th>
            <th className="px-4 py-2 border-b">Name</th>
            <th className="px-4 py-2 border-b">Hire Date</th>
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentTeachers;