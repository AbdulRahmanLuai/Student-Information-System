import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSemesters,
  endSemester,
  advanceSemester,
} from "../../../api/semesters";
import {
  startAcademicYear,
  enrollAll,
  getEnrollmentStatus,
} from "../../../api/academicYear";
import {
  getSectionsByYear,
  createSection,
  deleteSection,
} from "../../../api/sections";
import { Semester, Section } from "../../../types";
import { getNextLetter } from "../constants";

export const useAdminDashboard = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shouldEnroll, setShouldEnroll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [endSemesterError, setEndSemesterError] = useState<string[]>([]);
  const [enrollResult, setEnrollResult] = useState<{
    student_count: number;
    enrollment_count: number;
    course_offering_count: number;
  } | null>(null);

  const navigate = useNavigate();

  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [addSectionError, setAddSectionError] = useState("");

  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);
  const [deleteSectionError, setDeleteSectionError] = useState("");

  const [activePortalTab, setActivePortalTab] = useState<
    "students" | "teachers" | "sections" | "departments"
  >("sections");

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
          const sectionData = await getSectionsByYear(current.academic_year_start);
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

  const isLastSectionOfGrade = (section: Section) => {
    const sectionsInSameGrade = sections.filter((s) => s.grade === section.grade);
    return sectionsInSameGrade.length <= 1;
  };

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
        const sectionData = await getSectionsByYear(currentSemester.academic_year_start);
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
        const sectionData = await getSectionsByYear(current.academic_year_start);
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
    if (!confirm("Start academic year migration? This will set up the next academic year."))
      return;
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

  return {
    semesters,
    sections,
    shouldEnroll,
    loading,
    error,
    actionLoading,
    endSemesterError,
    enrollResult,
    currentSemester,
    allCompletedInLatestYear,
    latestYearSemesters,
    distinctGrades,
    showAddSection,
    setShowAddSection,
    selectedGrade,
    setSelectedGrade,
    addingSection,
    addSectionError,
    setAddSectionError,
    sectionToDelete,
    setSectionToDelete,
    deletingSection,
    deleteSectionError,
    setDeleteSectionError,
    activePortalTab,
    setActivePortalTab,
    isLastSectionOfGrade,
    handleAddSection,
    handleDeleteSection,
    handleEndSemester,
    handleAdvanceSemester,
    handleMigrate,
    handleEnrollAll,
    navigate,
  };
};