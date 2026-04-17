import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentCard from "../../components/StudentCard";
import client from "../../api/client";
import { Student, Section } from "../../types";
import { getSectionById, getSectionsByYear } from "../../api/sections";
import { changeStudentSection } from "../../api/students";

interface SectionStudentsProps {
  academicYearStart: number;
  currentAcademicYear: number;
}


const SectionStudents = ({ academicYearStart, currentAcademicYear }: SectionStudentsProps) => {
  const { sectionId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const isCurrentYear = academicYearStart === currentAcademicYear;


  const handleMoveSection = async (studentId: number, newSectionId: number) => {
    try {
      await changeStudentSection(studentId, newSectionId);
      const response = await client.get("/admin/students", {
        params: { section_id: Number(sectionId), academic_year_start: academicYearStart }
      });
      setStudents(response.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to change section");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!sectionId) return;

      try {
        setLoading(true);
        const id = Number(sectionId);
        const section = await getSectionById(id);


        const [studentsRes, allSections] = await Promise.all([
          client.get("/admin/students", { params: { section_id: id, academic_year_start: academicYearStart } }),
          getSectionsByYear(section.academic_year_start),
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      {students.length === 0 && (
        <p className="text-gray-500">No students found for this section.</p>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
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
                showMoveOption={isCurrentYear}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SectionStudents;