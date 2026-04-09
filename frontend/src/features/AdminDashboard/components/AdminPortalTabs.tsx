import { Section, Student, Teacher } from "../../../types";
import SectionsList from "./SectionsList";
import StudentSearchBar from "./StudentSearchBar";
import TeacherSearchBar from "./TeacherSearchBar";
import { useState } from "react";
import StudentCard from "../../../components/StudentCard";
import TeacherCard from "../../../components/TeacherCard";
import DepartmentsList from "./DepartmentsList";
import { changeStudentSection } from "../../../api/students";
import { getSections } from "../../../api/sections";

interface AdminPortalTabsProps {
  activeTab: "students" | "teachers" | "sections" | "departments";
  onTabChange: (tab: "students" | "teachers" | "sections" | "departments") => void;
  sections: Section[];
  onAddSection: () => void;
  currentSemesterExists: boolean;
  onDeleteSection: (section: Section) => void;
  isLastSectionOfGrade: (section: Section) => boolean;
}

const AdminPortalTabs = ({
  activeTab,
  onTabChange,
  sections,
  onAddSection,
  currentSemesterExists,
  onDeleteSection,
  isLastSectionOfGrade,
}: AdminPortalTabsProps) => {
  const tabs = ["students", "teachers", "sections", "departments"] as const;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [sameGradeSections, setSameGradeSections] = useState<Section[]>([]);

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    if (student.section) {
      try {
        const allSections = await getSections(student.section.academic_year_start);
        const sameGrade = allSections.filter((s) => s.grade === student.section?.grade);
        setSameGradeSections(sameGrade);
      } catch (err) {
        console.error("Failed to load sections", err);
      }
    }
  };

  const handleMoveSection = async (studentId: number, newSectionId: number) => {
    try {
      await changeStudentSection(studentId, newSectionId);
      alert("Student moved successfully");
      setSelectedStudent(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to move student");
    }
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Admin Portal</h2>

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 font-medium rounded-t ${
              activeTab === tab
                ? "bg-gray-100 border-b-2 border-blue-600"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "sections" && currentSemesterExists && (
          <SectionsList
            sections={sections}
            onAddSection={onAddSection}
            onDeleteSection={onDeleteSection}
            isLastSectionOfGrade={isLastSectionOfGrade}
          />
        )}
        {activeTab === "students" && (
          <div>
            <StudentSearchBar onSelect={handleStudentSelect} />
            {selectedStudent && (
              <div className="overflow-x-auto mt-4">
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
                    <StudentCard
                      student={selectedStudent}
                      sections={sameGradeSections}
                      onMoveSection={handleMoveSection}
                    />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "teachers" && (
          <div>
            <TeacherSearchBar onSelect={handleTeacherSelect} />
            {selectedTeacher && (
              <div className="overflow-x-auto mt-4">
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
                    <TeacherCard teacher={selectedTeacher} />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "departments" && <DepartmentsList />}
      </div>
    </div>
  );
};

export default AdminPortalTabs;