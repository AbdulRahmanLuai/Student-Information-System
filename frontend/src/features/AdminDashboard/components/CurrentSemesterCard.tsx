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
    <div className="bg-white border border-slate-200 rounded-md px-4 py-3 mb-4">

      {/* TOP ROW */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Current Semester
          </p>
          <p className="text-sm font-medium text-slate-900 mt-0.5">
            {currentSemester
              ? `${currentSemester.academic_year_start}/${currentSemester.academic_year_end} — Semester ${currentSemester.number}`
              : "No active semester"}
          </p>
        </div>

        {currentSemester && (
          <button
            onClick={onEndSemester}
            disabled={actionLoading}
            className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:bg-slate-400 transition"
          >
            End Semester
          </button>
        )}
      </div>

      {/* ERROR BELOW (full width, clean) */}
      {endSemesterError.length > 0 && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-xs font-medium mb-1">
            {endSemesterError[0]}
          </p>
          <ul className="text-xs text-red-600 space-y-0.5">
            {endSemesterError.slice(1).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};

export default CurrentSemesterCard;