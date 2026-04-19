import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAdminDashboard } from "../../features/AdminDashboard/hooks/useAdminDashboard";
import CurrentSemesterCard from "../../features/AdminDashboard/components/CurrentSemesterCard";
import EnrollmentPanel from "../../features/AdminDashboard/components/EnrollmentPanel";
import SemesterActions from "../../features/AdminDashboard/components/SemesterActions";
import AdminPortalTabs from "../../features/AdminDashboard/components/AdminPortalTabs";
import SemestersList from "../../features/AdminDashboard/components/SemestersList";
import AddSectionModal from "../../features/AdminDashboard/components/AddSectionModal";
import DeleteSectionModal from "../../features/AdminDashboard/components/DeleteSectionModal";
import { getAcademicYears } from "../../api/sections";
import { getDepartments } from "../../api/departments";
import { Department } from "../../types";

const AdminDashboard = () => {
  const {
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
  } = useAdminDashboard();

  const [academicYears, setAcademicYears] = useState<number[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    getAcademicYears().then(setAcademicYears).catch(console.error);
    getDepartments().then(setDepartments).catch(console.error);
  }, []);

  const currentAcademicYear = currentSemester ? currentSemester.academic_year_start : null;
  const currentSemesterNumber = currentSemester ? currentSemester.number : null;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <CurrentSemesterCard
        currentSemester={currentSemester}
        actionLoading={actionLoading}
        endSemesterError={endSemesterError}
        onEndSemester={handleEndSemester}
      />

      <EnrollmentPanel
        shouldEnroll={shouldEnroll}
        enrollResult={enrollResult}
        actionLoading={actionLoading}
        onEnrollAll={handleEnrollAll}
      />

      <SemesterActions
        currentSemester={currentSemester}
        latestYearSemesters={latestYearSemesters}
        allCompletedInLatestYear={allCompletedInLatestYear}
        actionLoading={actionLoading}
        onAdvanceSemester={handleAdvanceSemester}
        onMigrate={handleMigrate}
      />

      {currentAcademicYear !== null && (

        <AdminPortalTabs
          activeTab={activePortalTab}
          onTabChange={setActivePortalTab}
          sections={sections}
          onAddSection={() => {
            setShowAddSection(true);
          setSelectedGrade(null);
          setAddSectionError("");
        }}
        currentSemesterExists={!!currentSemester}
        onDeleteSection={setSectionToDelete}
        isLastSectionOfGrade={isLastSectionOfGrade}
        academicYears={academicYears}
        departments={departments}
        currentAcademicYear={currentAcademicYear}
        currentSemesterNumber={currentSemesterNumber}
      />  )}

      <SemestersList semesters={semesters} loading={loading} />

      <AddSectionModal
        show={showAddSection}
        distinctGrades={distinctGrades}
        sections={sections}
        selectedGrade={selectedGrade}
        onSelectGrade={setSelectedGrade}
        adding={addingSection}
        error={addSectionError}
        onCancel={() => {
          setShowAddSection(false);
          setSelectedGrade(null);
          setAddSectionError("");
        }}
        onAdd={handleAddSection}
      />

      <DeleteSectionModal
        section={sectionToDelete}
        deleting={deletingSection}
        error={deleteSectionError}
        onCancel={() => {
          setSectionToDelete(null);
          setDeleteSectionError("");
        }}
        onDelete={handleDeleteSection}
      />
    </AdminLayout>
  );
};

export default AdminDashboard;