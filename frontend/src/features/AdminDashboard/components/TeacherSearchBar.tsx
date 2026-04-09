import SearchBar from "./SearchBar";
import { searchTeachers } from "../../../api/teachers";
import { Teacher } from "../../../types";

interface TeacherSearchBarProps {
  onSelect: (teacher: Teacher) => void;
}

// const TeacherSearchBar = ({ onSelect }: TeacherSearchBarProps) => (
//   <SearchBar<Teacher>
//     fetchFn={searchTeachers}
//     onSelect={onSelect}
//     getKey={(t) => t.id}
//     placeholder="Search teacher by name or teacher id..."
//     renderSuggestion={(t) => (
//       <div className="flex justify-between items-center">
//         <span className="font-medium text-gray-800">
//           {t.user.first_name} {t.user.last_name}
//         </span>
//         <span className="text-xs text-gray-400">{t.user.email}</span>
//       </div>
//     )}
//   />
// );


const TeacherSearchBar = ({ onSelect }: TeacherSearchBarProps) => (
  <SearchBar<Teacher>
    fetchFn={searchTeachers}
    onSelect={onSelect}
    getKey={(t) => t.id}
    placeholder="Search by name or ID..."
    renderSuggestion={(t) => (
        <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">
            {t.user.first_name} {t.user.last_name}
            </span>
            <div className="text-right">
            <div className="text-xs text-gray-500">ID: {t.id}</div>
            <div className="text-xs text-gray-400">{t.user.email}</div>
            </div>
        </div>
        )}
  />
);


export default TeacherSearchBar;