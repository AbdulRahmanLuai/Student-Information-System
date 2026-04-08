import { Section } from "../../../types";
import { getNextLetter } from "../constants";

interface AddSectionModalProps {
  show: boolean;
  distinctGrades: number[];
  sections: Section[];
  selectedGrade: number | null;
  onSelectGrade: (grade: number | null) => void;
  adding: boolean;
  error: string;
  onCancel: () => void;
  onAdd: () => void;
}

const AddSectionModal = ({
  show,
  distinctGrades,
  sections,
  selectedGrade,
  onSelectGrade,
  adding,
  error,
  onCancel,
  onAdd,
}: AddSectionModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Add Section</h2>

        <label className="block text-sm text-gray-600 mb-1">Select Grade</label>
        <select
          value={selectedGrade ?? ""}
          onChange={(e) => onSelectGrade(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 mb-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select a grade —</option>
          {distinctGrades.map((grade) => {
            const nextLetter = getNextLetter(sections, grade);
            return (
              <option key={grade} value={grade} disabled={!nextLetter}>
                Grade {grade} {nextLetter ? `→ next: ${nextLetter}` : "(full)"}
              </option>
            );
          })}
        </select>

        {selectedGrade && (
          <p className="text-sm text-gray-500 mb-4">
            New section will be:{" "}
            <span className="font-medium text-gray-800">
              Grade {selectedGrade}
              {getNextLetter(sections, selectedGrade)}
            </span>
          </p>
        )}

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={
              !selectedGrade ||
              adding ||
              !getNextLetter(sections, selectedGrade ?? 0)
            }
            className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-400"
          >
            {adding ? "Adding..." : "Add Section"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSectionModal;