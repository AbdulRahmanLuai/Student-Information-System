import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getSectionById } from "../../api/sections";
import { Section } from "../../types";
import SectionStudents from "./SectionStudents";
import SectionCourseOfferings from "./SectionCourseOfferings";
import { getCurrentSemester } from "../../api/semesters";

const SectionDetail = () => {
  const { sectionId } = useParams(); // fixed param name
  const navigate = useNavigate();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"students" | "offerings">("students");
  const [currentAcademicYear, setCurrentAcademicYear] = useState<number>(0);

  useEffect(() => {
    getCurrentSemester().then(sem => setCurrentAcademicYear(sem.academic_year_start));
  }, []);

  useEffect(() => {
    const fetchSection = async () => {
      if (!sectionId) return;
      try {
        const data = await getSectionById(Number(sectionId));
        setSection(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load section");
      } finally {
        setLoading(false);
      }
    };
    fetchSection();
  }, [sectionId]);

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="text-red-500">{error}</div></AdminLayout>;
  if (!section) return <AdminLayout><div>Section not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition mb-2"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-2">
        Section: Grade {section.grade} - {section.name}
      </h1>
      <p className="text-gray-600 mb-6">Academic Year: {section.academic_year_start}</p>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 font-medium ${
              activeTab === "students"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Students
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

      {activeTab === "students" && <SectionStudents currentAcademicYear={currentAcademicYear} academicYearStart={section.academic_year_start}/>}
      {activeTab === "offerings" && <SectionCourseOfferings />}
    </AdminLayout>
  );
};

export default SectionDetail;