import { Student, Section } from "../../../types";
import StudentSearchBar from "./StudentSearchBar";
import StudentCard from "../../../components/StudentCard";



interface StudentsTabProps {
  sections: Section[];
  onStudentSelect: (student: Student) => void;
  selectedStudent: Student | null;
  onMoveSection: (studentId: number, newSectionId: number) => void;
  sameGradeSections: Section[];
  onRegisterClick: () => void;
}

const StudentsTab = ({
  onStudentSelect,
  selectedStudent,
  onMoveSection,
  sameGradeSections,
  onRegisterClick,
}: StudentsTabProps) => {
  return (
    <div>
      <StudentSearchBar onSelect={onStudentSelect} />
      {selectedStudent && (
        <div className="overflow-x-auto mt-4">
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
              <StudentCard
                student={selectedStudent}
                sections={sameGradeSections}
                onMoveSection={onMoveSection}
              />
            </tbody>
          </table>
        </div>
      )}
      <br />
      <div className="flex justify-end mb-4">
        <button
          onClick={onRegisterClick}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition"
        >
          Register New Student
        </button>
      </div>
    </div>
  );
};

export default StudentsTab;