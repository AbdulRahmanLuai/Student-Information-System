import { useEffect, useState } from "react";
import { Course, CourseOffering } from "../../types";
import { getDepartmentCourses } from "../../api/departments";
import { getCourseOfferings, updateCourseOfferingTeacher } from "../../api/courseOfferings";
import { getTeachers } from "../../api/teachers";
import CourseOfferingCard from "../../components/CourseOfferingCard";

interface DepartmentCoursesProps {
  departmentId: number;
  academicYears: number[];
  currentAcademicYear: number;
  currentSemesterNumber: number;
}

const DepartmentCourses = ({ 
  departmentId, 
  academicYears, 
  currentAcademicYear, 
  currentSemesterNumber 
}: DepartmentCoursesProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedYear, setSelectedYear] = useState<number>(currentAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<number>(currentSemesterNumber);
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
  const [offeringsMap, setOfferingsMap] = useState<Map<number, CourseOffering[]>>(new Map());
  const [loadingOfferings, setLoadingOfferings] = useState(false);

  // Helper to refresh offerings after edit
  const refreshOfferings = async () => {
    if (selectedYear > currentAcademicYear || selectedSemester === 0) return;
    setLoadingOfferings(true);
    try {
      const offerings = await getCourseOfferings({
        department_id: departmentId,
        academic_year_start: selectedYear,
        semester_number: selectedSemester,
      });
      const map = new Map<number, CourseOffering[]>();
      offerings.forEach(off => {
        const courseId = off.course.id;
        if (!map.has(courseId)) map.set(courseId, []);
        map.get(courseId)!.push(off);
      });
      setOfferingsMap(map);
    } catch (err) {
      console.error("Failed to refresh offerings", err);
    } finally {
      setLoadingOfferings(false);
    }
  };

  // Handler for updating teacher
  const handleUpdateTeacher = async (offeringId: number, teacherId: number) => {
    const updated = await updateCourseOfferingTeacher(offeringId, teacherId);
    await refreshOfferings(); // refresh after update
    return updated;
  };

  const fetchTeachersForDepartment = async (departmentId: number) => {
    return await getTeachers(departmentId);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getDepartmentCourses(departmentId);
        setCourses(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [departmentId]);

  // Update available semesters based on selected year
  useEffect(() => {
    if (selectedYear === currentAcademicYear) {
      const semesters = [];
      for (let i = 1; i <= currentSemesterNumber; i++) semesters.push(i);
      setAvailableSemesters(semesters);
      if (selectedSemester > currentSemesterNumber) {
        setSelectedSemester(currentSemesterNumber);
      }
    } else if (selectedYear < currentAcademicYear) {
      setAvailableSemesters([1, 2, 3]);
      if (![1, 2, 3].includes(selectedSemester)) {
        setSelectedSemester(1);
      }
    } else {
      setAvailableSemesters([]);
      setSelectedSemester(0);
    }
  }, [selectedYear, currentAcademicYear, currentSemesterNumber]);

  // Fetch offerings when year and semester are valid
  useEffect(() => {
    if (!courses.length) return;
    if (selectedYear > currentAcademicYear) return;
    if (selectedSemester === 0) return;

    const fetchAllOfferings = async () => {
      setLoadingOfferings(true);
      try {
        const offerings = await getCourseOfferings({
          department_id: departmentId,
          academic_year_start: selectedYear,
          semester_number: selectedSemester,
        });
        const map = new Map<number, CourseOffering[]>();
        offerings.forEach(off => {
          const courseId = off.course.id;
          if (!map.has(courseId)) map.set(courseId, []);
          map.get(courseId)!.push(off);
        });
        setOfferingsMap(map);
      } catch (err: any) {
        console.error("Failed to fetch offerings", err);
      } finally {
        setLoadingOfferings(false);
      }
    };
    fetchAllOfferings();
  }, [departmentId, courses.length, selectedYear, selectedSemester, currentAcademicYear]);

  if (loadingCourses) return <p>Loading courses...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (courses.length === 0) return <p className="text-gray-500">No courses found for this department.</p>;

  const isFutureYear = selectedYear > currentAcademicYear;
  const isCurrentSemester = selectedYear === currentAcademicYear && selectedSemester === currentSemesterNumber;

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Academic Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded px-3 py-1"
          >
            {academicYears.map(year => (
              <option key={year} value={year}>{year} - {year+1}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Semester:</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            disabled={availableSemesters.length === 0}
            className="border rounded px-3 py-1 disabled:bg-gray-100"
          >
            {availableSemesters.map(num => (
              <option key={num} value={num}>Semester {num}</option>
            ))}
          </select>
        </div>
      </div>

      {isFutureYear && (
        <p className="text-gray-500 mb-4">No data available for future academic years.</p>
      )}

      {!isFutureYear && loadingOfferings && <p>Loading course offerings...</p>}

      {!isFutureYear && !loadingOfferings && (
        <div className="space-y-4">
          {courses.map(course => {
            const offerings = offeringsMap.get(course.id) || [];
            return (
              <div key={course.id} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 font-semibold">
                  {course.name} ({course.code}) - Grade {course.grade}
                </div>
                <div className="p-4">
                  {offerings.length === 0 ? (
                    <p className="text-gray-500 text-sm">No offerings for this semester.</p>
                  ) : (
                    <CourseOfferingCard
                      offerings={offerings}
                      showSection={true}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DepartmentCourses;