import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getStudentById, getStudentEnrollments } from "../../api/students";
import { Student, Enrollment } from "../../types";

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  
  // Academic year selection
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Grouped data
  const [groupedEnrollments, setGroupedEnrollments] = useState<Map<number, Enrollment[]>>(new Map());

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;
      try {
        const data = await getStudentById( Number(id));
        setStudent(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load student");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!id) return;
      setLoadingEnrollments(true);
      try {
        const data = await getStudentEnrollments(Number(id));
        setAllEnrollments(data);
        
        // Extract unique academic years
        const years = [...new Set(data.map(e => e.course_offering.semester.academic_year_start))];
        years.sort((a,b) => b - a);
        setAvailableYears(years);
        if (years.length > 0 && !selectedYear) {
          setSelectedYear(years[0]);
        }
      } catch (err) {
        console.error("Failed to load enrollments", err);
      } finally {
        setLoadingEnrollments(false);
      }
    };
    fetchEnrollments();
  }, [id]);

  useEffect(() => {
    if (selectedYear && allEnrollments.length) {
      const filtered = allEnrollments.filter(
        e => e.course_offering.semester.academic_year_start === selectedYear
      );
      // Group by semester number
      const groups = new Map<number, Enrollment[]>();
      filtered.forEach(e => {
        const semNum = e.course_offering.semester.number;
        if (!groups.has(semNum)) groups.set(semNum, []);
        groups.get(semNum)!.push(e);
      });
      setGroupedEnrollments(groups);
    }
  }, [selectedYear, allEnrollments]);

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="text-red-500">{error}</div></AdminLayout>;
  if (!student) return <AdminLayout><div>Student not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ← Back to Dashboard
      </button>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">
          {student.first_name} {student.last_name}
        </h1>
        <div className="space-y-2 mb-6">
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Status:</strong> {student.status}</p>
          <p><strong>Enrollment Date:</strong> {student.enrollment_date || "—"}</p>
          <p><strong>Section:</strong> {student.section ? `${student.section.name} (Grade ${student.section.grade})` : "—"}</p>
        </div>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold mb-4">Academic History</h2>
        
        {availableYears.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Academic Year</label>
            <select
              value={selectedYear ?? ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year} - {year + 1}</option>
              ))}
            </select>
          </div>
        )}

        {loadingEnrollments && <p>Loading enrollments...</p>}

        {!loadingEnrollments && selectedYear && (
          <div>
            {groupedEnrollments.size === 0 ? (
              <p className="text-gray-500">No enrollments for this academic year.</p>
            ) : (
              Array.from(groupedEnrollments.entries())
                .sort(([a], [b]) => a - b)
                .map(([semesterNum, enrollmentsList]) => (
                  <div key={semesterNum} className="mb-6 border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 font-semibold">
                      Semester {semesterNum}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 border-b text-left">Course</th>
                            <th className="px-4 py-2 border-b text-left">Code</th>
                            <th className="px-4 py-2 border-b text-left">Final Mark</th>
                            <th className="px-4 py-2 border-b text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollmentsList.map(enr => (
                            <tr key={enr.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border-b">{enr.course_offering.course.name}</td>
                              <td className="px-4 py-2 border-b">{enr.course_offering.course.code}</td>
                              <td className="px-4 py-2 border-b">{enr.final_mark ?? "—"}</td>
                              <td className="px-4 py-2 border-b">{enr.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StudentProfile;