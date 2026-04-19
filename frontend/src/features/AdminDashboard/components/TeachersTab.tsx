import { Teacher } from "../../../types";
import TeacherSearchBar from "./TeacherSearchBar";
import TeacherCard from "../../../components/TeacherCard";

interface TeachersTabProps {
  onTeacherSelect: (teacher: Teacher) => void;
  selectedTeacher: Teacher | null;
  onRegisterClick: () => void;
}

const TeachersTab = ({ onTeacherSelect, selectedTeacher, onRegisterClick }: TeachersTabProps) => {
  return (
    <div>
      <TeacherSearchBar onSelect={onTeacherSelect} />
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
          onClick={onRegisterClick}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add New Teacher
        </button>
      </div>
    </div>
  );
};

export default TeachersTab;