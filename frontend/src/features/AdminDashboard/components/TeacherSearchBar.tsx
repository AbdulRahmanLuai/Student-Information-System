import SearchBar from "./SearchBar";
import { searchTeachers } from "../../../api/teachers";
import { Teacher } from "../../../types";

interface TeacherSearchBarProps {
  onSelect: (teacher: Teacher) => void;
}

const TeacherSearchBar = ({ onSelect }: TeacherSearchBarProps) => (
  <SearchBar<Teacher>
    fetchFn={searchTeachers}
    onSelect={onSelect}
    getKey={(t) => t.id}
    placeholder="Search teachers by name or email..."
    renderSuggestion={(t) => (
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-800">
          {t.user.first_name} {t.user.last_name}
        </span>
        <span className="text-xs text-gray-400">{t.user.email}</span>
      </div>
    )}
  />
);

export default TeacherSearchBar;