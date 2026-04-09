import { Section, Student, Teacher} from "../../../types";
import SectionsList from "./SectionsList";
import StudentSearchBar from "./StudentSearchBar";
import TeacherSearchBar from "./TeacherSearchBar";
import { useState } from "react";
import StudentCard from "../../../components/StudentCard";
import { getSections } from "../../../api/sections"; // adjust path as needed
import { changeStudentSection } from "../../../api/students"; // adjust path
import TeacherCard from "../../../components/TeacherCard";
import { getCourseOfferingsForTeacher } from "../../../api/courseOfferings";

interface AdminPortalTabsProps {
  activeTab: "students" | "teachers" | "sections" | "departments";
  onTabChange: (tab: "students" | "teachers" | "sections" | "departments") => void;
  sections: Section[];
  onNavigateStudents: (id: number) => void;
  onNavigateCourseOfferings: (id: number) => void;
  onDeleteClick: (section: Section) => void;
  isLastSectionOfGrade: (section: Section) => boolean;
  onAddSection: () => void;
  currentSemesterExists: boolean;
  onStudentSelect: (student: Student) => void;
}

const AdminPortalTabs = ({
  activeTab,
  onTabChange,
  sections,
  onNavigateStudents,
  onNavigateCourseOfferings,
  onDeleteClick,
  isLastSectionOfGrade,
  onAddSection,
  currentSemesterExists,
  onStudentSelect,
}: AdminPortalTabsProps) => {
    const tabs = ["students", "teachers", "sections", "departments"] as const;
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [sameGradeSections, setSameGradeSections] = useState<Section[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);


    const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    };
    const handleViewCourseOfferings = async (teacherId: number) => {
    return await getCourseOfferingsForTeacher(teacherId);
    };

    const handleStudentSelect = async (student: Student) => {
        setSelectedStudent(student);
        onStudentSelect(student);

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
        // Optionally refetch the student data to update section info
        // For now, just show success and maybe clear selection
        alert("Student moved successfully");
        setSelectedStudent(null); // clear card after move
        } catch (err: any) {
        alert(err.response?.data?.detail || "Failed to move student");
        }
    };

    const handleViewProfile = (studentId: number) => {
        // TODO: navigate to profile page
        console.log("View profile", studentId);
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
                onNavigateStudents={onNavigateStudents}
                onNavigateCourseOfferings={onNavigateCourseOfferings}
                onDeleteClick={onDeleteClick}
                isLastSectionOfGrade={isLastSectionOfGrade}
                onAddSection={onAddSection}
            />
            )}
            {activeTab === "students" && (
                <div>
                    <StudentSearchBar onSelect={handleStudentSelect} />
                    {selectedStudent && (
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full bg-white border rounded-lg shadow text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                            <th className="px-4 py-2 border-b">Name</th>
                            <th className="px-4 py-2 border-b">Email</th>
                            <th className="px-4 py-2 border-b">Enrollment Date</th>
                            <th className="px-4 py-2 border-b">Status</th>
                            <th className="px-4 py-2 border-b">Section</th>
                            <th className="px-4 py-2 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <StudentCard
                            student={selectedStudent}
                            sections={sameGradeSections}
                            onMoveSection={handleMoveSection}
                            onViewProfile={handleViewProfile}
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
                            <TeacherCard
                            teacher={selectedTeacher}
                            onViewCourseOfferings={handleViewCourseOfferings}
                            />
                        </tbody>
                        </table>
                    </div>
                    )}
                </div>
                )}
            {activeTab === "departments" && (
            <p className="text-gray-500">
                Departments management will be implemented here (list, add, edit, delete).
            </p>
            )}
        </div>
        </div>
    );
    };

    export default AdminPortalTabs;