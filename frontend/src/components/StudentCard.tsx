import { Student, Section } from "../types";
import { useState } from "react";
import { Link } from "react-router-dom";

interface StudentCardProps {
  student: Student;
  sections: Section[];
  onMoveSection: (studentId: number, newSectionId: number) => void;
}

const statusStyle: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  graduated: "bg-blue-100 text-blue-700",
};

const StudentCard = ({ student: s, sections, onMoveSection }: StudentCardProps) => {
  const [pendingMove, setPendingMove] = useState<{ newSectionId: number; newSectionName: string } | null>(null);

  const handleMoveClick = (newSectionId: number, newSectionName: string) => {
    setPendingMove({ newSectionId, newSectionName });
  };

  const confirmMove = () => {
    if (pendingMove) {
      onMoveSection(s.id, pendingMove.newSectionId);
      setPendingMove(null);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2 border-b font-medium">
          {s.first_name} {s.last_name}
        </td>
        <td className="px-4 py-2 border-b text-sm text-gray-600">{s.email}</td>
        <td className="px-4 py-2 border-b text-sm text-gray-600">
          {s.enrollment_date ?? "—"}
        </td>
        <td className="px-4 py-2 border-b">
          <span
            className={`text-sm px-2 py-1 rounded-full font-medium ${
              statusStyle[s.status] ?? "bg-gray-100 text-gray-500"
            }`}
          >
            {s.status}
          </span>
        </td>
        <td className="px-4 py-2 border-b text-sm text-gray-600">
          {s.section ? `${s.section.grade}${s.section.name}` : "—"}
        </td>
        <td className="px-4 py-2 border-b">
          <div className="flex gap-2 items-center">
            <select
              onChange={(e) => {
                const newSectionId = Number(e.target.value);
                const selectedSection = sections.find(sec => sec.id === newSectionId);
                if (newSectionId && selectedSection) {
                  handleMoveClick(newSectionId, selectedSection.name);
                }
                e.target.value = "";
              }}
              defaultValue=""
              className="border px-2 py-1 rounded text-sm"
            >
              <option value="">Move to...</option>
              {sections
                .filter(sec => sec.id !== s.section?.id)
                .map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
            </select>
            <Link
              to={`/admin/students/${s.id}`}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Profile
            </Link>
          </div>
        </td>
      </tr>

      {pendingMove && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Move Student</h2>
            <p className="text-gray-600 mb-1">
              Are you sure you want to move{" "}
              <span className="font-medium text-gray-800">
                {s.first_name} {s.last_name}
              </span>{" "}
              to section{" "}
              <span className="font-medium text-gray-800">{pendingMove.newSectionName}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This will remove their current enrollments and re-enroll them in the new section's course offerings.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingMove(null)}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmMove}
                className="px-4 py-2 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentCard;