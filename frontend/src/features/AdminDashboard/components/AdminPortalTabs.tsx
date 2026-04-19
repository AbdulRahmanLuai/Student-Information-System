import { Section, Student, Teacher, Department } from "../../../types";
import AdminTabsHeader from "./AdminTabsHeader";
import SectionsTab from "./SectionsTab";
import StudentsTab from "./StudentsTab";
import TeachersTab from "./TeachersTab";
import DepartmentsTab from "./DepartmentsTab";
import StudentRegistrationModal from "./StudentRegistrationModal";
import TeacherRegistrationModal from "./TeacherRegistrationModal";
import { useState } from "react";
import { changeStudentSection, createStudent } from "../../../api/students";
import { getSectionsByYear } from "../../../api/sections";
import { createTeacher } from "../../../api/teachers";

interface AdminPortalTabsProps {
  activeTab: "students" | "teachers" | "sections" | "departments";
  onTabChange: (tab: "students" | "teachers" | "sections" | "departments") => void;
  sections: Section[];
  onAddSection: () => void;
  currentSemesterExists: boolean;
  onDeleteSection: (section: Section) => void;
  isLastSectionOfGrade: (section: Section) => boolean;
  academicYears: number[];
  departments: Department[];
  currentAcademicYear: number | null;
}

const AdminPortalTabs = ({
  activeTab,
  onTabChange,
  sections,
  onAddSection,
  currentSemesterExists,
  onDeleteSection,
  isLastSectionOfGrade,
  academicYears,
  departments,
  currentAcademicYear,
}: AdminPortalTabsProps) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [sameGradeSections, setSameGradeSections] = useState<Section[]>([]);

  // Student registration state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Teacher registration state
  const [showRegisterTeacherModal, setShowRegisterTeacherModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [registeringTeacher, setRegisteringTeacher] = useState(false);
  const [teacherRegisterError, setTeacherRegisterError] = useState("");

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    if (student.section) {
      try {
        const allSections = await getSectionsByYear(student.section.academic_year_start);
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

  const handleRegisterSubmit = async (formData: any) => {
    setRegistering(true);
    setRegisterError("");
    try {
      await createStudent({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        enrollment_date: formData.enrollment_date || null,
        section_id: Number(formData.section_id),
      });
      alert("Student registered successfully");
      setShowRegisterModal(false);
      setSelectedStudent(null);
    } catch (err: any) {
      setRegisterError(err.response?.data?.detail || "Failed to register student");
    } finally {
      setRegistering(false);
    }
  };

  const handleTeacherRegisterSubmit = async (formData: any) => {
    setRegisteringTeacher(true);
    setTeacherRegisterError("");
    try {
      const result = await createTeacher({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        hire_date: formData.hire_date || null,
        department_id: Number(formData.department_id),
      });
      setGeneratedPassword(result.plain_password);
    } catch (err: any) {
      setTeacherRegisterError(err.response?.data?.detail || "Failed to register teacher");
    } finally {
      setRegisteringTeacher(false);
    }
  };

  const copyPasswordToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      alert("Password copied to clipboard!");
    }
  };

  const resetTeacherModal = () => {
    setShowRegisterTeacherModal(false);
    setGeneratedPassword(null);
    setTeacherRegisterError("");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Admin Portal</h2>

      <AdminTabsHeader activeTab={activeTab} onTabChange={onTabChange} />

      {activeTab === "sections" && currentSemesterExists && (
        <SectionsTab
          academicYears={academicYears}
          currentAcademicYear={currentAcademicYear}
          onAddSection={onAddSection}
          onDeleteSection={onDeleteSection}
          isLastSectionOfGrade={isLastSectionOfGrade}
        />
      )}

      {activeTab === "students" && (
        <StudentsTab
          sections={sections}
          onStudentSelect={handleStudentSelect}
          selectedStudent={selectedStudent}
          onMoveSection={handleMoveSection}
          sameGradeSections={sameGradeSections}
          onRegisterClick={() => setShowRegisterModal(true)}
        />
      )}

      {activeTab === "teachers" && (
        <TeachersTab
          onTeacherSelect={handleTeacherSelect}
          selectedTeacher={selectedTeacher}
          onRegisterClick={() => setShowRegisterTeacherModal(true)}
        />
      )}

      {activeTab === "departments" && <DepartmentsTab departments={departments} />}

      <StudentRegistrationModal
        show={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSubmit={handleRegisterSubmit}
        sections={sections}
        registering={registering}
        error={registerError}
      />

      <TeacherRegistrationModal
        show={showRegisterTeacherModal}
        onClose={resetTeacherModal}
        onSubmit={handleTeacherRegisterSubmit}
        departments={departments}
        registering={registeringTeacher}
        error={teacherRegisterError}
        generatedPassword={generatedPassword}
        onCopyPassword={copyPasswordToClipboard}
        onDone={resetTeacherModal}
      />
    </div>
  );
};

export default AdminPortalTabs;