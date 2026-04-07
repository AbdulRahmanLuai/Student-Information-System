import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import client from "../../api/client";
import { Student } from "../../types";
import { getSectionById } from "../../api/sections";
import { changeStudentSection } from "../../api/students";
import { getSections } from "../../api/sections";
import { Section } from "../../types";

const SectionStudents = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [pendingMove, setPendingMove] = useState<{ studentId: number; studentName: string; newSectionId: number; newSectionName: string } | null>(null);
  const handleSectionChange = (studentId: number, studentName: string, newSectionId: number, newSectionName: string) => {
  setPendingMove({ studentId, studentName, newSectionId, newSectionName });
};

const confirmSectionChange = async () => {
  if (!pendingMove) return;
  try {
    await changeStudentSection(pendingMove.studentId, pendingMove.newSectionId);
    const response = await client.get("/admin/students", {
      params: { section_id: Number(sectionId) },
    });
    setStudents(response.data);
  } catch (err: any) {
    alert(err.response?.data?.detail || "Failed to change section");
  } finally {
    setPendingMove(null);
  }
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = Number(sectionId);

        // fetch in parallel (cleaner + faster)
        const [studentsRes, section] = await Promise.all([
          client.get("/admin/students", {
            params: { section_id: id },
          }),
          getSectionById(id),
        ]);

        setStudents(studentsRes.data);
        setSectionName(`Grade ${section.grade} - ${section.name}`);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
      if (sectionId) {
      const section = await getSectionById(Number(sectionId));
      setSectionName(`Grade ${section.grade} - ${section.name}`);

      const allSections = await getSections(section.academic_year_start);
      const sameGrade = allSections.filter(s => s.grade === section.grade);
      setSections(sameGrade);
}
    };

    if (sectionId) fetchData();
  }, [sectionId]);

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Students {sectionName && `— ${sectionName}`}
      </h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && students.length === 0 && (
        <p className="text-gray-500">
          No students found for this section.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Email</th>
              <th className="px-4 py-2 border-b">Enrollment Date</th>
              <th className="px-4 py-2 border-b">Status</th>
              <th className="px-4 py-2 border-b">Move</th>

            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b font-medium">
                  {s.first_name} {s.last_name}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {s.email}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {s.enrollment_date ?? "—"}
                </td>
                <td className="px-4 py-2 border-b">
                  <span
                    className={`text-sm px-2 py-1 rounded-full font-medium ${
                      s.status === "active"
                        ? "bg-green-100 text-green-700"
                        : s.status === "graduated"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-2 border-b">
                  <select
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedSection = sections.find(sec => sec.id === selectedId);
                      if (!selectedSection) return;
                      handleSectionChange(
                        s.id,
                        `${s.first_name} ${s.last_name}`,
                        selectedId,
                        selectedSection.name
                      );
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="border px-2 py-1 rounded"
                  >
                    <option value="">Move to...</option>
                    {sections
                      .filter(sec => sec.id !== s.section_id)
                      .map(sec => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        {pendingMove && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2">Move Student</h2>
        <p className="text-gray-600 mb-1">
          Are you sure you want to move{" "}
          <span className="font-medium text-gray-800">{pendingMove.studentName}</span>{" "}
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
            onClick={confirmSectionChange}
            className="px-4 py-2 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600"
          >
            Confirm Move
          </button>
        </div>
      </div>
    </div>
  )}
    </AdminLayout>
  );
};

export default SectionStudents;