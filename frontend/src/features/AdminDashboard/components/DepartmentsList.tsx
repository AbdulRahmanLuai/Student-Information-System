import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Department } from "../../../types";
import { getDepartments } from "../../../api/departments";

const DepartmentsList = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load departments");
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  if (loading) return <p className="text-gray-500">Loading departments...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2 border-b">Code</th>
            <th className="px-4 py-2 border-b">Name</th>
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b font-mono text-sm">{dept.code}</td>
              <td className="px-4 py-2 border-b font-medium">{dept.name}</td>
              <td className="px-4 py-2 border-b">
                <Link
                  to={`/admin/departments/${dept.id}`}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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

export default DepartmentsList;