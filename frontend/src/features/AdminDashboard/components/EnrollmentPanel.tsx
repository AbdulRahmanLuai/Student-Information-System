interface EnrollmentPanelProps {
  shouldEnroll: boolean;
  enrollResult: {
    student_count: number;
    enrollment_count: number;
    course_offering_count: number;
  } | null;
  actionLoading: boolean;
  onEnrollAll: () => void;
}

const EnrollmentPanel = ({
  shouldEnroll,
  enrollResult,
  actionLoading,
  onEnrollAll,
}: EnrollmentPanelProps) => {
  if (!shouldEnroll && !enrollResult) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Student Enrollment</h2>

      {shouldEnroll && (
        <>
          <p className="text-sm text-gray-500 mb-3">
            The new academic year has been committed. Enroll all students into their course
            offerings.
          </p>
          <button
            onClick={onEnrollAll}
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
  );
};

export default EnrollmentPanel;