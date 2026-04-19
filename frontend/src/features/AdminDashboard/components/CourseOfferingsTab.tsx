import { useEffect, useState } from "react";
import { Section, Department, Teacher, CourseOffering } from "../../../types";
import { getCourseOfferings } from "../../../api/courseOfferings";
import { getTeachers } from "../../../api/teachers";
import CourseOfferingCard from "../../../components/CourseOfferingCard";

interface CourseOfferingsTabProps {
  academicYears: number[];
  sections: Section[];
  departments: Department[];
  currentAcademicYear: number;
  currentSemesterNumber: number;
}

const CourseOfferingsTab = ({ 
  academicYears, 
  sections, 
  departments, 
  currentAcademicYear, 
  currentSemesterNumber 
}: CourseOfferingsTabProps) => {
  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(currentAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<number>(currentSemesterNumber);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Fetch all teachers initially and sort alphabetically
  useEffect(() => {
    getTeachers()
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const nameA = `${a.user.last_name} ${a.user.first_name}`.toLowerCase();
          const nameB = `${b.user.last_name} ${b.user.first_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setTeachers(sorted);
      })
      .catch(console.error);
  }, []);

  // Compute available semesters based on selected year
  const getAvailableSemesters = (year: number): number[] => {
    if (year < currentAcademicYear) return [1, 2, 3];
    if (year === currentAcademicYear) {
      const semesters = [];
      for (let i = 1; i <= currentSemesterNumber; i++) semesters.push(i);
      return semesters;
    }
    return []; // future year (should not happen if academicYears list is correct)
  };

  const availableSemesters = getAvailableSemesters(selectedYear);

  // Reset semester if current selection becomes invalid
  useEffect(() => {
    if (!availableSemesters.includes(selectedSemester)) {
      setSelectedSemester(availableSemesters[0] || 1);
    }
  }, [availableSemesters, selectedSemester]);

  // When teacher is selected, auto-set department
  useEffect(() => {
    if (selectedTeacherId) {
      const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
      if (teacher && teacher.department_id) {
        setSelectedDepartmentId(String(teacher.department_id));
      }
    }
  }, [selectedTeacherId, teachers]);

  // When department changes manually, clear teacher selection if teacher doesn't belong to new department
  useEffect(() => {
    if (selectedTeacherId && selectedDepartmentId) {
      const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
      if (teacher && teacher.department_id !== Number(selectedDepartmentId)) {
        setSelectedTeacherId("");
      }
    }
  }, [selectedDepartmentId, selectedTeacherId, teachers]);

  // Filter teachers based on selected department (if any)
  const displayedTeachers = selectedDepartmentId
    ? teachers.filter(t => t.department_id === Number(selectedDepartmentId))
    : teachers;

  // Fetch course offerings when filters change
  useEffect(() => {
    const fetchOfferings = async () => {
      setLoading(true);
      const params: any = {
        academic_year_start: selectedYear,
        semester_number: selectedSemester,
      };
      if (selectedSectionId) params.section_id = Number(selectedSectionId);
      if (selectedDepartmentId) params.department_id = Number(selectedDepartmentId);
      if (selectedTeacherId) params.teacher_id = Number(selectedTeacherId);
      
      try {
        const data = await getCourseOfferings(params);
        setOfferings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOfferings();
  }, [selectedYear, selectedSemester, selectedSectionId, selectedDepartmentId, selectedTeacherId]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          >
            {academicYears.map((y) => (
              <option key={y} value={y}>{y} - {y+1}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
            disabled={availableSemesters.length === 0}
          >
            {availableSemesters.map((num) => (
              <option key={num} value={num}>Semester {num}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                Grade {sec.grade} {sec.name} ({sec.academic_year_start})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All</option>
            {displayedTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.last_name} {t.user.first_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading course offerings...</p>
      ) : offerings.length === 0 ? (
        <p className="text-gray-500">No course offerings found for the selected filters.</p>
      ) : (
        <CourseOfferingCard offerings={offerings} showSection={true} />
      )}
    </div>
  );
};

export default CourseOfferingsTab;