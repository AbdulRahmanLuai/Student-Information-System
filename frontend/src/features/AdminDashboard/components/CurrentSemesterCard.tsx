import { Semester } from "../../../types";

interface CurrentSemesterCardProps {
  currentSemester: Semester | undefined;
  actionLoading: boolean;
  endSemesterError: string[];
  onEndSemester: () => void;
}

const CurrentSemesterCard = ({
  currentSemester,
  actionLoading,
  endSemesterError,
  onEndSemester,
}: CurrentSemesterCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Current Semester</h2>
      {currentSemester ? (
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 font-medium">
                {currentSemester.academic_year_start}/{currentSemester.academic_year_end} — Semester{" "}
                {currentSemester.number}
              </p>
              <p className="text-sm text-gray-500 capitalize">{currentSemester.status}</p>
            </div>
            <button
              onClick={onEndSemester}
              disabled={actionLoading}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-400"
            >
              End Semester
            </button>
          </div>

          {endSemesterError.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-700 font-medium text-sm mb-2">
                {endSemesterError[0]}
              </p>
              <ul className="space-y-1">
                {endSemesterError.slice(1).map((line, i) => (
                  <li key={i} className="text-red-600 text-sm">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No active semester.</p>
      )}
    </div>
  );
};

export default CurrentSemesterCard;