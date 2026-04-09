import SearchBar from "./SearchBar";
import { searchStudents } from "../../../api/students";
import { Student } from "../../../types";

interface StudentSearchBarProps {
  onSelect: (student: Student) => void;
}

const StudentSearchBar = ({ onSelect }: StudentSearchBarProps) => (
  <SearchBar<Student>
    fetchFn={searchStudents}
    onSelect={onSelect}
    getKey={(s) => s.id}
    placeholder="Search by name or ID..."
    renderSuggestion={(s) => (
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
        <span className="text-xs text-gray-400">ID: {s.id}</span>
      </div>
    )}
  />
);

export default StudentSearchBar;