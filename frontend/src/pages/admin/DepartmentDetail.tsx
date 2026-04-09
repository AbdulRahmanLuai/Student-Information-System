import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getDepartmentById } from "../../api/departments";
import { Department } from "../../types";
import DepartmentTeachers from "./DepartmentTeachers";
import DepartmentCourseOfferings from "./DepartmentCourseOfferings";

const DepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"teachers" | "offerings">("teachers");

  useEffect(() => {
    const fetchDepartment = async () => {
      if (!id) return;
      try {
        const data = await getDepartmentById(Number(id));
        setDepartment(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load department");
      } finally {
        setLoading(false);
      }
    };
    fetchDepartment();
  }, [id]);

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="text-red-500">{error}</div></AdminLayout>;
  if (!department) return <AdminLayout><div>Department not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-2">{department.name}</h1>
      <p className="text-gray-600 mb-6">Code: {department.code}</p>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("teachers")}
            className={`px-4 py-2 font-medium ${
              activeTab === "teachers"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Teachers
          </button>
          <button
            onClick={() => setActiveTab("offerings")}
            className={`px-4 py-2 font-medium ${
              activeTab === "offerings"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Course Offerings
          </button>
        </div>
      </div>

      {activeTab === "teachers" && <DepartmentTeachers departmentId={department.id} />}
      {activeTab === "offerings" && <DepartmentCourseOfferings departmentId={department.id} />}
    </AdminLayout>
  );
};

export default DepartmentDetail;