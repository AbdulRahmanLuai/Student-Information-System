import AdminLayout from "../../components/AdminLayout";
import { useAdminDashboard } from "../../features/AdminDashboard/hooks/useAdminDashboard";
import CurrentSemesterCard from "../../features/AdminDashboard/components/CurrentSemesterCard";
import EnrollmentPanel from "../../features/AdminDashboard/components/EnrollmentPanel";
import SemesterActions from "../../features/AdminDashboard/components/SemesterActions";
import AdminPortalTabs from "../../features/AdminDashboard/components/AdminPortalTabs";
import SemestersList from "../../features/AdminDashboard/components/SemestersList";
import AddSectionModal from "../../features/AdminDashboard/components/AddSectionModal";
import DeleteSectionModal from "../../features/AdminDashboard/components/DeleteSectionModal";

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
    navigate,
  } = useAdminDashboard();

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

      <AdminPortalTabs
        activeTab={activePortalTab}
        onTabChange={setActivePortalTab}
        sections={sections}
        onNavigateStudents={(id) => navigate(`/admin/sections/${id}/students`)}
        onNavigateCourseOfferings={(id) =>
          navigate(`/admin/sections/${id}/course-offerings`)
        }
        onDeleteClick={setSectionToDelete}
        isLastSectionOfGrade={isLastSectionOfGrade}
        onAddSection={() => {
          setShowAddSection(true);
          setSelectedGrade(null);
          setAddSectionError("");
        }}
        currentSemesterExists={!!currentSemester}
        onStudentSelect={(student) => console.log("Selected student:", student)}
      />

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