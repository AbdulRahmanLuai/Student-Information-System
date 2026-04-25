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

  const [selectedYear, setSelectedYear] = useState<number>(currentAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<number>(currentSemesterNumber);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);

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

  const getAvailableSemesters = (year: number): number[] => {
    if (year < currentAcademicYear) return [1, 2, 3];
    if (year === currentAcademicYear) {
      const semesters = [];
      for (let i = 1; i <= currentSemesterNumber; i++) semesters.push(i);
      return semesters;
    }
    return [];
  };

  const availableSemesters = getAvailableSemesters(selectedYear);

  useEffect(() => {
    if (!availableSemesters.includes(selectedSemester)) {
      setSelectedSemester(availableSemesters[0] || 1);
    }
  }, [availableSemesters, selectedSemester]);

  useEffect(() => {
    if (selectedTeacherId) {
      const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
      if (teacher && teacher.department_id) {
        setSelectedDepartmentId(String(teacher.department_id));
      }
    }
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    if (selectedTeacherId && selectedDepartmentId) {
      const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
      if (teacher && teacher.department_id !== Number(selectedDepartmentId)) {
        setSelectedTeacherId("");
      }
    }
  }, [selectedDepartmentId, selectedTeacherId, teachers]);

  const displayedTeachers = selectedDepartmentId
    ? teachers.filter(t => t.department_id === Number(selectedDepartmentId))
    : teachers;

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

      {/* FILTERS (REF STYLE) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 border-b border-slate-200">

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="h-10 border border-slate-200 rounded-lg px-3 text-sm"
        >
          {academicYears.map((y) => (
            <option key={y} value={y}>{y} - {y + 1}</option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(Number(e.target.value))}
          className="h-10 border border-slate-200 rounded-lg px-3 text-sm"
          disabled={availableSemesters.length === 0}
        >
          {availableSemesters.map((num) => (
            <option key={num} value={num}>Semester {num}</option>
          ))}
        </select>

        <select
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
          className="h-10 border border-slate-200 rounded-lg px-3 text-sm"
        >
          <option value="">All</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              Grade {sec.grade} {sec.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDepartmentId}
          onChange={(e) => setSelectedDepartmentId(e.target.value)}
          className="h-10 border border-slate-200 rounded-lg px-3 text-sm"
        >
          <option value="">All</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name} ({dept.code})
            </option>
          ))}
        </select>

        <select
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId(e.target.value)}
          className="h-10 border border-slate-200 rounded-lg px-3 text-sm"
        >
          <option value="">All</option>
          {displayedTeachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.user.last_name} {t.user.first_name}
            </option>
          ))}
        </select>

      </div>

      {/* CONTENT */}
      {loading ? (
        <p>Loading course offerings...</p>
      ) : offerings.length === 0 ? (
        <p className="text-gray-500">
          No course offerings found for the selected filters.
        </p>
      ) : (
        <CourseOfferingCard offerings={offerings} showSection={true} />
      )}

    </div>
  );
};

export default CourseOfferingsTab;