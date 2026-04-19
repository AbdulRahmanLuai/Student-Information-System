import { Link } from "react-router-dom";
import { Section } from "../../../types";

interface SectionsListProps {
  sections: Section[];
  onDeleteSection: (section: Section) => void;
  isLastSectionOfGrade: (section: Section) => boolean;
  currentAcademicYear: number | null;
  editMode: boolean;
}

const SectionsList = ({ sections, onDeleteSection, isLastSectionOfGrade, currentAcademicYear, editMode }: SectionsListProps) => {
  if (sections.length === 0) {
    return <p className="text-gray-500">No sections found for this academic year.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2 border-b">Section</th>
            <th className="px-4 py-2 border-b">Academic Year</th>
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => {
            const isLast = isLastSectionOfGrade(section);
            return (
              <tr key={section.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">{section.grade}{section.name}</td>
                <td className="px-4 py-2 border-b">{section.academic_year_start} - {section.academic_year_start + 1}</td>
                <td className="px-4 py-2 border-b">
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/sections/${section.id}`}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Details
                    </Link>
                    {editMode && currentAcademicYear !== null && section.academic_year_start === currentAcademicYear && (
                      <button
                        onClick={() => !isLast && onDeleteSection(section)}
                        className={`text-sm rounded px-2 py-0.5 ${
                          isLast
                            ? "text-gray-400 border border-gray-200 cursor-not-allowed"
                            : "text-red-600 hover:text-red-800 border border-red-300"
                        }`}
                        title={isLast ? "Cannot delete the only section of this grade" : ""}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SectionsList;