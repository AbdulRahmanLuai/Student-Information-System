import { Section, Student, Teacher, Department } from "../../../types";
import SectionsList from "./SectionsList";
import StudentSearchBar from "./StudentSearchBar";
import TeacherSearchBar from "./TeacherSearchBar";
import { useState, useEffect } from "react";
import StudentCard from "../../../components/StudentCard";
import TeacherCard from "../../../components/TeacherCard";
import DepartmentsList from "./DepartmentsList";
import { changeStudentSection, createStudent } from "../../../api/students";
import { getSectionsByYear } from "../../../api/sections";
import { createTeacher } from "../../../api/teachers";
import { getDepartments } from "../../../api/departments";

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
  const tabs = ["students", "teachers", "sections", "departments"] as const;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [sameGradeSections, setSameGradeSections] = useState<Section[]>([]);
  
  // Student registration state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    enrollment_date: "",
    section_id: "",
  });
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Teacher registration state
  const [showRegisterTeacherModal, setShowRegisterTeacherModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    hire_date: "",
    department_id: "",
  });
  const [registeringTeacher, setRegisteringTeacher] = useState(false);
  const [teacherRegisterError, setTeacherRegisterError] = useState("");

  // Sections year filter
  const [sectionYear, setSectionYear] = useState<number>(() => {
    if (academicYears.length) return Math.max(...academicYears);
    return new Date().getFullYear();
  });
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // Fetch sections when year changes
  useEffect(() => {
    setLoadingSections(true);
    getSectionsByYear(sectionYear)
      .then(setFilteredSections)
      .catch(console.error)
      .finally(() => setLoadingSections(false));
  }, [sectionYear]);

  // Update sectionYear when academicYears become available and no year is set
  useEffect(() => {
    if (academicYears.length && !sectionYear) {
      setSectionYear(Math.max(...academicYears));
    }
  }, [academicYears]);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterError("");
    try {
      await createStudent({
        first_name: registerForm.first_name,
        last_name: registerForm.last_name,
        email: registerForm.email,
        enrollment_date: registerForm.enrollment_date || null,
        section_id: Number(registerForm.section_id),
      });
      alert("Student registered successfully");
      setShowRegisterModal(false);
      setRegisterForm({ first_name: "", last_name: "", email: "", enrollment_date: "", section_id: "" });
      setSelectedStudent(null);
    } catch (err: any) {
      setRegisterError(err.response?.data?.detail || "Failed to register student");
    } finally {
      setRegistering(false);
    }
  };

  const handleTeacherRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteringTeacher(true);
    setTeacherRegisterError("");
    try {
      const result = await createTeacher({
        first_name: teacherForm.first_name,
        last_name: teacherForm.last_name,
        email: teacherForm.email,
        hire_date: teacherForm.hire_date || null,
        department_id: Number(teacherForm.department_id),
      });
      setGeneratedPassword(result.plain_password);
      setShowPassword(false);
      setTeacherForm({ first_name: "", last_name: "", email: "", hire_date: "", department_id: "" });
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Academic Year:</label>
                <select
                  value={sectionYear}
                  onChange={(e) => setSectionYear(Number(e.target.value))}
                  className="border rounded px-3 py-1"
                >
                  {academicYears.map((y) => (
                    <option key={y} value={y}>
                      {y} - {y + 1}
                    </option>
                  ))}
                </select>
              </div>
             {currentAcademicYear !== null && sectionYear === currentAcademicYear && (
                <button
                  onClick={onAddSection}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Section
                </button>
              )}
            </div>
            {loadingSections ? (
              <p>Loading sections...</p>
            ) : (
              <SectionsList
                sections={filteredSections}
                onDeleteSection={onDeleteSection}
                isLastSectionOfGrade={isLastSectionOfGrade}
                currentAcademicYear={currentAcademicYear}
              />
            )}
          </div>
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
            <br />
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Register New Student
              </button>
            </div>
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
            <br />
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowRegisterTeacherModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add New Teacher
              </button>
            </div>
          </div>
        )}

        {activeTab === "departments" && <DepartmentsList departments={departments} />}
      </div>

      {/* Student Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Register New Student</h2>
            <form onSubmit={handleRegisterSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input type="text" required value={registerForm.first_name} onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input type="text" required value={registerForm.last_name} onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input type="email" required value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
                  <input type="date" value={registerForm.enrollment_date} onChange={(e) => setRegisterForm({ ...registerForm, enrollment_date: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section *</label>
                  <select required value={registerForm.section_id} onChange={(e) => setRegisterForm({ ...registerForm, section_id: e.target.value })} className="mt-1 w-full border rounded px-3 py-2">
                    <option value="">Select a section</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>Grade {sec.grade} - {sec.name} ({sec.academic_year_start})</option>
                    ))}
                  </select>
                </div>
              </div>
              {registerError && <p className="text-red-500 text-sm mt-2">{registerError}</p>}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowRegisterModal(false)} className="px-4 py-2 text-sm rounded border hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={registering} className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400">{registering ? "Registering..." : "Register"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Registration Modal */}
      {showRegisterTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {generatedPassword ? "Teacher Registered Successfully" : "Add New Teacher"}
            </h2>
            
            {!generatedPassword ? (
              <form onSubmit={handleTeacherRegisterSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input type="text" required value={teacherForm.first_name} onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input type="text" required value={teacherForm.last_name} onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input type="email" required value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                    <input type="date" value={teacherForm.hire_date} onChange={(e) => setTeacherForm({ ...teacherForm, hire_date: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department *</label>
                    <select required value={teacherForm.department_id} onChange={(e) => setTeacherForm({ ...teacherForm, department_id: e.target.value })} className="mt-1 w-full border rounded px-3 py-2">
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
                {teacherRegisterError && <p className="text-red-500 text-sm mt-2">{teacherRegisterError}</p>}
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => { setShowRegisterTeacherModal(false); setGeneratedPassword(null); setTeacherRegisterError(""); }} className="px-4 py-2 text-sm rounded border hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={registeringTeacher} className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400">{registeringTeacher ? "Adding..." : "Add Teacher"}</button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-gray-700 mb-4">The teacher has been created. Please provide the following password:</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-gray-100 p-2 rounded border font-mono">
                    {showPassword ? generatedPassword : "••••••••••"}
                  </div>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 py-2 text-sm rounded border hover:bg-gray-50">{showPassword ? "Hide" : "Show"}</button>
                  <button type="button" onClick={copyPasswordToClipboard} className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Copy</button>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => { setShowRegisterTeacherModal(false); setGeneratedPassword(null); setTeacherRegisterError(""); }} className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortalTabs;