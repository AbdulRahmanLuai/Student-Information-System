import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getSemesters, endSemester, advanceSemester } from "../../api/semesters";
import { startAcademicYear, enrollAll, getEnrollmentStatus } from "../../api/academicYear";
import { getSections, createSection, deleteSection } from "../../api/sections";
import { Semester, Section, Student, Teacher } from "../../types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getNextLetter = (sections: Section[], grade: number): string | null => {
  const existing = sections
    .filter((s) => s.grade === grade)
    .map((s) => s.name.toUpperCase());
  for (const letter of LETTERS) {
    if (!existing.includes(letter)) return letter;
  }
  return null;
};

const AdminDashboard = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shouldEnroll, setShouldEnroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const [endSemesterError, setEndSemesterError] = useState<string[]>([]);
  const [enrollResult, setEnrollResult] = useState<{
  student_count: number;
  enrollment_count: number;
  course_offering_count: number;
} | null>(null);


  // Add section modal
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [addSectionError, setAddSectionError] = useState("");

  // Delete section modal
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);
  const [deleteSectionError, setDeleteSectionError] = useState("");

  // Logic to check if a section is the only one left for its grade
  const isLastSectionOfGrade = (section: Section) => {
    const sectionsInSameGrade = sections.filter(s => s.grade === section.grade);
    return sectionsInSameGrade.length <= 1;
  };

  // Portal tab switching
  // Active tab in portal
  const [activePortalTab, setActivePortalTab] = useState<"students" | "teachers" | "sections" | "departments">("sections");
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [portalLoading, setPortalLoading] = useState(false);
  useEffect(() => {
    const fetch = async () => {
      try {
        const [semesterData, enrollStatus] = await Promise.all([
          getSemesters(),
          getEnrollmentStatus(),
        ]);
        setSemesters(semesterData);
        setShouldEnroll(enrollStatus.should_enroll);

        const current = semesterData.find((s) => s.status === "current");
        if (current) {
          const sectionData = await getSections(current.academic_year_start);
          const sorted = sectionData.sort((a, b) =>
            a.grade !== b.grade ? a.grade - b.grade : a.name.localeCompare(b.name)
          );
          setSections(sorted);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const academicYears = semesters.reduce((acc, s) => {
    const key = s.academic_year_start;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<number, Semester[]>);

  const latestYearStart = semesters.length > 0
    ? Math.max(...Object.keys(academicYears).map(Number))
    : null;
  const latestYearSemesters = latestYearStart !== null
    ? academicYears[latestYearStart] ?? []
    : [];

  const currentSemester = latestYearSemesters.find((s) => s.status === "current");
  const allCompletedInLatestYear =
    latestYearSemesters.length === 3 &&
    latestYearSemesters.every((s) => s.status === "completed");

  const distinctGrades = [...new Set(sections.map((s) => s.grade))].sort(
    (a, b) => a - b
  );

  const handleAddSection = async () => {
    if (!selectedGrade || !currentSemester) return;
    const nextLetter = getNextLetter(sections, selectedGrade);
    if (!nextLetter) return;

    setAddingSection(true);
    setAddSectionError("");
    try {
      const newSection = await createSection({
        grade: selectedGrade,
        name: nextLetter,
        academic_year_start: currentSemester.academic_year_start,
      });
      setSections((prev) =>
        [...prev, newSection].sort((a, b) =>
          a.grade !== b.grade ? a.grade - b.grade : a.name.localeCompare(b.name)
        )
      );
      setShowAddSection(false);
      setSelectedGrade(null);
    } catch (err: any) {
      setAddSectionError(err.response?.data?.detail || "Failed to add section");
    } finally {
      setAddingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    setDeletingSection(true);
    setDeleteSectionError("");
    try {
      await deleteSection(sectionToDelete.id);
      if (currentSemester) {
        const sectionData = await getSections(currentSemester.academic_year_start);
        setSections(
          sectionData.sort((a, b) =>
            a.grade !== b.grade ? a.grade - b.grade : a.name.localeCompare(b.name)
          )
        );
      }
      setSectionToDelete(null);
    } catch (err: any) {
      setDeleteSectionError(err.response?.data?.detail || "Failed to delete section");
    } finally {
      setDeletingSection(false);
    }
  };

const handleEndSemester = async () => {
  if (!confirm("Are you sure you want to end the current semester?")) return;
  setActionLoading(true);
  setEndSemesterError([]);
  try {
    await endSemester();
    const data = await getSemesters();
    setSemesters(data);
    setSections([]);
  } catch (err: any) {
    const detail = err.response?.data?.detail || "Failed to end semester";
    const lines = detail.split("\n").map((l: string) => l.trim()).filter(Boolean);
    setEndSemesterError(lines);
  } finally {
    setActionLoading(false);
  }
};

const handleAdvanceSemester = async () => {
  if (!confirm("Are you sure you want to advance to the next semester?")) return;
  setActionLoading(true);
  try {
    await advanceSemester();
    const [data, enrollStatus] = await Promise.all([
      getSemesters(),
      getEnrollmentStatus(),
    ]);
    setSemesters(data);
    setShouldEnroll(enrollStatus.should_enroll);

    const current = data.find((s) => s.status === "current");
    if (current) {
      const sectionData = await getSections(current.academic_year_start);
      setSections(
        sectionData.sort((a, b) =>
          a.grade !== b.grade ? a.grade - b.grade : a.name.localeCompare(b.name)
        )
      );
    }
  } catch (err: any) {
    setError(err.response?.data?.detail || "Failed to advance semester");
  } finally {
    setActionLoading(false);
  }
};

  const handleMigrate = async () => {
    if (!confirm("Start academic year migration? This will set up the next academic year.")) return;
    setActionLoading(true);
    try {
      await startAcademicYear();
      navigate("/admin/academic-year/sections");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start migration");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnrollAll = async () => {
    if (!confirm("Enroll all students into their course offerings?")) return;
    setActionLoading(true);
    try {
      const result = await enrollAll();
      console.log("ENROLL RESULT:", result);
      setEnrollResult(result);
      setShouldEnroll(false);
      const data = await getSemesters();
      setSemesters(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to enroll students");
    } finally {
      setActionLoading(false);
    }
  };
  const renderPortalTab = () => {
  switch (activePortalTab) {
    case "students":
      return (
        <div>
          <p className="text-gray-500 mb-2">Student actions placeholder</p>
          {/* Later: search, view, handle leaving, profile */}
        </div>
      );
    case "teachers":
      return (
        <div>
          <p className="text-gray-500 mb-2">Teacher actions placeholder</p>
          {/* Later: search, view course offerings */}
        </div>
      );
    default:
      return null;
  }
};

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Current Semester */}
<div className="bg-white rounded-lg shadow p-6 mb-6">
  <h2 className="text-lg font-semibold mb-4">Current Semester</h2>
  {currentSemester ? (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-700 font-medium">
            {currentSemester.academic_year_start}/{currentSemester.academic_year_end} — Semester {currentSemester.number}
          </p>
          <p className="text-sm text-gray-500 capitalize">{currentSemester.status}</p>
        </div>
        <button
          onClick={handleEndSemester}
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

      {/* Enroll All — independent of semester actions */}
{(shouldEnroll || enrollResult) && (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h2 className="text-lg font-semibold mb-4">Student Enrollment</h2>

    {shouldEnroll && (
      <>
        <p className="text-sm text-gray-500 mb-3">
          The new academic year has been committed. Enroll all students into their course offerings.
        </p>
        <button
          onClick={handleEnrollAll}
          disabled={actionLoading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Enroll All Students
        </button>
      </>
    )}

    {enrollResult && (
      <div className="mt-4 bg-green-50 border border-green-200 rounded p-4">
        <p className="text-green-700 font-medium text-sm mb-1">
          Enrollments completed successfully
        </p>
        <ul className="text-sm text-green-600 space-y-1">
          <li>Students processed: {enrollResult.student_count}</li>
          <li>Enrollments created: {enrollResult.enrollment_count}</li>
          <li>Course offerings: {enrollResult.course_offering_count}</li>
        </ul>
      </div>
    )}
  </div>
)}

      

      {/* Semester Actions — only when no current semester */}
      {!currentSemester && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Semester Actions</h2>
          <div className="flex flex-wrap gap-3">
            {latestYearSemesters.some((s) => s.status === "completed") && !allCompletedInLatestYear && (
              <button
                onClick={handleAdvanceSemester}
                disabled={actionLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Advance to Next Semester
              </button>
            )}
            {allCompletedInLatestYear && (
              <button
                onClick={handleMigrate}
                disabled={actionLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Migrate to New Academic Year
              </button>
            )}
          </div>
        </div>
      )}

<div className="bg-white rounded-lg shadow p-6 mb-6">
  <h2 className="text-lg font-semibold mb-4">Admin Portal</h2>
  
        {/* Tab buttons */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          {["students", "teachers", "sections", "departments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActivePortalTab(tab as any)}
              className={`px-4 py-2 font-medium rounded-t ${
                activePortalTab === tab
                  ? "bg-gray-100 border-b-2 border-blue-600"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activePortalTab === "sections" && (
            <div>
              {/* Sections */}
              {currentSemester && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Sections</h2>
                    <button
                      onClick={() => {
                        setShowAddSection(true);
                        setSelectedGrade(null);
                        setAddSectionError("");
                      }}
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
                            <p className="font-medium">Grade {s.grade} — {s.name}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/admin/sections/${s.id}/students`)}
                                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              >
                                Students
                              </button>
                              <button
                                onClick={() => navigate(`/admin/sections/${s.id}/course-offerings`)}
                                className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                              >
                                Course Offerings
                              </button>
                              <button
                                onClick={() => {
                                  setSectionToDelete(s);
                                  setDeleteSectionError("");
                                }}
                                disabled={isDisabled}
                                title={isDisabled ? "Cannot delete the last section of a grade" : "Delete section"}
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
              )}
            </div>
          )}
          {activePortalTab === "students" && (
            <div>
              <p className="text-gray-500">Student actions will be implemented here (search, leave, profile view).</p>
            </div>
          )}

          {activePortalTab === "teachers" && (
            <div>
              <p className="text-gray-500">Teacher actions will be implemented here (search, course offerings view).</p>
            </div>
          )}

          {activePortalTab === "departments" && (
            <div>
              <p className="text-gray-500">Departments management will be implemented here (list, add, edit, delete).</p>
            </div>
          )}
        </div>
      </div>

      {/* Semesters List */}
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

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Add Section</h2>

            <label className="block text-sm text-gray-600 mb-1">Select Grade</label>
            <select
              value={selectedGrade ?? ""}
              onChange={(e) => setSelectedGrade(Number(e.target.value))}
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
                  Grade {selectedGrade}{getNextLetter(sections, selectedGrade)}
                </span>
              </p>
            )}

            {addSectionError && (
              <p className="text-red-500 text-sm mb-3">{addSectionError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddSection(false);
                  setSelectedGrade(null);
                  setAddSectionError("");
                }}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                disabled={!selectedGrade || addingSection || !getNextLetter(sections, selectedGrade ?? 0)}
                className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-400"
              >
                {addingSection ? "Adding..." : "Add Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Section Modal */}
      {sectionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Delete Section</h2>
            <p className="text-gray-600 mb-1">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-800">
                Grade {sectionToDelete.grade} — {sectionToDelete.name}
              </span>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This will also delete all course offerings for this section. Sections after it will be renamed automatically.
            </p>

            {deleteSectionError && (
              <p className="text-red-500 text-sm mb-3">{deleteSectionError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSectionToDelete(null);
                  setDeleteSectionError("");
                }}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSection}
                disabled={deletingSection}
                className="px-4 py-2 text-sm rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400"
              >
                {deletingSection ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;