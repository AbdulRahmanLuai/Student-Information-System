import { Semester } from "../../../types";

interface SemestersListProps {
  semesters: Semester[];
  loading: boolean;
}

const SemestersList = ({ semesters, loading }: SemestersListProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">All Semesters</h2>
      {semesters.length === 0 && !loading && (
        <p className="text-gray-500">No semesters found.</p>
      )}
      <div className="divide-y">
        {semesters.map((s) => (
          <div key={s.id} className="py-3 flex justify-between items-center">
            <p className="font-medium">
              {s.academic_year_start}/{s.academic_year_end} — Semester {s.number}
            </p>
            <span
              className={`text-sm px-2 py-1 rounded-full font-medium ${
                s.status === "current"
                  ? "bg-green-100 text-green-700"
                  : s.status === "upcoming"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SemestersList;