import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getTeacherById } from "../../api/teachers";
import { getCourseOfferings } from "../../api/courseOfferings";
import { Teacher, CourseOffering } from "../../types";

const TeacherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [groupedOfferings, setGroupedOfferings] = useState<Map<number, CourseOffering[]>>(new Map());

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!id) return;
      try {
        const data = await getTeacherById(Number(id));
        setTeacher(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load teacher");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    const fetchOfferings = async () => {
      if (!id) return;
      setLoadingOfferings(true);
      try {
        const data = await getCourseOfferings({ teacher_id: Number(id) });
        setOfferings(data);
        
        const years = [...new Set(data.map(o => o.semester.academic_year_start))];
        years.sort((a, b) => b - a);
        setAvailableYears(years);
        if (years.length > 0 && !selectedYear) {
          setSelectedYear(years[0]);
        }
      } catch (err) {
        console.error("Failed to load course offerings", err);
      } finally {
        setLoadingOfferings(false);
      }
    };
    fetchOfferings();
  }, [id]);

  useEffect(() => {
    if (selectedYear && offerings.length) {
      const filtered = offerings.filter(o => o.semester.academic_year_start === selectedYear);
      const groups = new Map<number, CourseOffering[]>();
      filtered.forEach(o => {
        const semNum = o.semester.number;
        if (!groups.has(semNum)) groups.set(semNum, []);
        groups.get(semNum)!.push(o);
      });
      setGroupedOfferings(groups);
    }
  }, [selectedYear, offerings]);

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="text-red-500">{error}</div></AdminLayout>;
  if (!teacher) return <AdminLayout><div>Teacher not found</div></AdminLayout>;

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
          {teacher.user.first_name} {teacher.user.last_name}
        </h1>
        <div className="space-y-2 mb-6">
          <p><strong>Email:</strong> {teacher.user.email}</p>
          <p><strong>Hire Date:</strong> {teacher.hire_date || "—"}</p>
          <p><strong>Department:</strong> {teacher.department_id ? `ID: ${teacher.department_id}` : "—"}</p>
        </div>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold mb-4">Course Offerings by Academic Year</h2>

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

        {loadingOfferings && <p>Loading course offerings...</p>}

        {!loadingOfferings && selectedYear && (
          <div>
            {groupedOfferings.size === 0 ? (
              <p className="text-gray-500">No course offerings for this academic year.</p>
            ) : (
              Array.from(groupedOfferings.entries())
                .sort(([a], [b]) => a - b)
                .map(([semesterNum, offeringsList]) => (
                  <div key={semesterNum} className="mb-6 border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 font-semibold">Semester {semesterNum}</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 border-b text-left">Course</th>
                            <th className="px-4 py-2 border-b text-left">Code</th>
                            <th className="px-4 py-2 border-b text-left">Section</th>
                            <th className="px-4 py-2 border-b text-left">Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offeringsList.map(off => (
                            <tr key={off.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border-b">{off.course.name}</td>
                              <td className="px-4 py-2 border-b">{off.course.code}</td>
                              <td className="px-4 py-2 border-b">{off.section.name} (Grade {off.section.grade})</td>
                              <td className="px-4 py-2 border-b">{off.course.department.name}</td>
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

export default TeacherProfile;