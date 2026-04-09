import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import StudentCard from "../../components/StudentCard"; 
import client from "../../api/client";
import { Student, Section } from "../../types";
import { getSectionById, getSections } from "../../api/sections";
import { changeStudentSection } from "../../api/students";

const SectionStudents = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);

  const handleMoveSection = async (studentId: number, newSectionId: number) => {
    try {
      await changeStudentSection(studentId, newSectionId);
      // Refresh the student list for this section
      const response = await client.get("/admin/students", {
        params: { section_id: Number(sectionId) },
      });
      setStudents(response.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to change section");
    }
  };

  const handleViewProfile = (studentId: number) => {
    // TODO: navigate to student profile page
    console.log("View profile", studentId);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!sectionId) return;

      try {
        setLoading(true);
        const id = Number(sectionId);
        const section = await getSectionById(id);

        setSectionName(`Grade ${section.grade} - ${section.name}`);

        const [studentsRes, allSections] = await Promise.all([
          client.get("/admin/students", { params: { section_id: id } }),
          getSections(section.academic_year_start),
        ]);

        setStudents(studentsRes.data);
        const sameGrade = allSections.filter((s) => s.grade === section.grade);
        setSections(sameGrade);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sectionId]);

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Students {sectionName && `— ${sectionName}`}
      </h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && students.length === 0 && (
        <p className="text-gray-500">No students found for this section.</p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Email</th>
              <th className="px-4 py-2 border-b">Enrollment Date</th>
              <th className="px-4 py-2 border-b">Status</th>
              <th className="px-4 py-2 border-b">Section</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                sections={sections.filter((sec) => sec.id !== student.section?.id)}
                onMoveSection={handleMoveSection}
                onViewProfile={handleViewProfile}
              />
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default SectionStudents;