import { Section } from "../../../types";

interface SectionsListProps {
  sections: Section[];
  onNavigateStudents: (id: number) => void;
  onNavigateCourseOfferings: (id: number) => void;
  onDeleteClick: (section: Section) => void;
  isLastSectionOfGrade: (section: Section) => boolean;
  onAddSection: () => void;
}

const SectionsList = ({
  sections,
  onNavigateStudents,
  onNavigateCourseOfferings,
  onDeleteClick,
  isLastSectionOfGrade,
  onAddSection,
}: SectionsListProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Sections</h2>
        <button
          onClick={onAddSection}
          className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-900"
        >
          + Add Section
        </button>
      </div>

      {sections.length === 0 ? (
        <p className="text-gray-500">No sections found.</p>
      ) : (
        <div className="divide-y">
          {sections.map((s) => {
            const isDisabled = isLastSectionOfGrade(s);
            return (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <p className="font-medium">
                  Grade {s.grade} — {s.name}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigateStudents(s.id)}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Students
                  </button>
                  <button
                    onClick={() => onNavigateCourseOfferings(s.id)}
                    className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                  >
                    Course Offerings
                  </button>
                  <button
                    onClick={() => onDeleteClick(s)}
                    disabled={isDisabled}
                    title={
                      isDisabled
                        ? "Cannot delete the last section of a grade"
                        : "Delete section"
                    }
                    className={`text-sm px-3 py-1 rounded transition-colors ${
                      isDisabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SectionsList;