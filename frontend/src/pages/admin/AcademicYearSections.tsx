import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getSetupSections, commitAcademicYear, resetAcademicYear } from "../../api/academicYear";
import { SetupSectionPreview } from "../../types";

const AcademicYearSections = () => {
  const [sections, setSections] = useState<SetupSectionPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSetupSections();
        setSections(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch sections");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const allConfigured = sections.length > 0 && sections.every((s) => s.is_configured);

  const handleCommit = async () => {
    if (!confirm("Commit the academic year? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await commitAcademicYear();
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to commit academic year");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset the academic year setup? All configuration will be lost.")) return;
    setActionLoading(true);
    try {
      await resetAcademicYear();
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset academic year");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Academic Year Setup</h1>
        <button
          onClick={handleReset}
          disabled={actionLoading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
        >
          Reset Setup
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading && <p>Loading sections...</p>}

      <div className="bg-white rounded-lg shadow divide-y mb-6">
        {sections.map((s) => (
          <div
            key={s.id}
            onClick={() => navigate(`/admin/academic-year/sections/${s.id}`)}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition"
          >
            <div>
              <p className="font-medium">{s.section}</p>
              <p className="text-sm text-gray-500">{s.student_count} students</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm px-2 py-1 rounded-full font-medium ${
                  s.is_configured
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {s.is_configured ? "Configured" : "Pending"}
              </span>
              <span className="text-gray-400">→</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleCommit}
        disabled={!allConfigured || actionLoading}
        className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium transition"
      >
        {actionLoading ? "Committing..." : "Commit Academic Year"}
      </button>

      {!allConfigured && !loading && (
        <p className="text-center text-sm text-gray-500 mt-2">
          All sections must be configured before committing.
        </p>
      )}
    </AdminLayout>
  );
};

export default AcademicYearSections;