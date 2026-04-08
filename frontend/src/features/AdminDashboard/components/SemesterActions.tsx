import { Semester } from "../../../types";

interface SemesterActionsProps {
  currentSemester: Semester | undefined;
  latestYearSemesters: Semester[];
  allCompletedInLatestYear: boolean;
  actionLoading: boolean;
  onAdvanceSemester: () => void;
  onMigrate: () => void;
}

const SemesterActions = ({
  currentSemester,
  latestYearSemesters,
  allCompletedInLatestYear,
  actionLoading,
  onAdvanceSemester,
  onMigrate,
}: SemesterActionsProps) => {
  if (currentSemester) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Semester Actions</h2>
      <div className="flex flex-wrap gap-3">
        {latestYearSemesters.some((s) => s.status === "completed") &&
          !allCompletedInLatestYear && (
            <button
              onClick={onAdvanceSemester}
              disabled={actionLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Advance to Next Semester
            </button>
          )}
        {allCompletedInLatestYear && (
          <button
            onClick={onMigrate}
            disabled={actionLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            Migrate to New Academic Year
          </button>
        )}
      </div>
    </div>
  );
};

export default SemesterActions;