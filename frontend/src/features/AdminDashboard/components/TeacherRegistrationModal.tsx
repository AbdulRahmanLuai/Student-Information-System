import { Department } from "../../../types";
import { useState } from "react";

interface TeacherRegistrationModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  departments: Department[];
  registering: boolean;
  error: string;
  generatedPassword: string | null;
  onCopyPassword: () => void;
  onDone: () => void;
}

const TeacherRegistrationModal = ({
  show,
  onClose,
  onSubmit,
  departments,
  registering,
  error,
  generatedPassword,
  onCopyPassword,
  onDone,
}: TeacherRegistrationModalProps) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    hire_date: "",
    department_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {generatedPassword ? "Teacher Registered Successfully" : "Add New Teacher"}
        </h2>

        {!generatedPassword ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                <input
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department *</label>
                <select
                  required
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={registering} className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400">
                {registering ? "Adding..." : "Add Teacher"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-gray-700 mb-4">The teacher has been created. Please provide the following password:</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-gray-100 p-2 rounded border font-mono">
                {showPassword ? generatedPassword : "••••••••••"}
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 py-2 text-sm rounded border hover:bg-gray-50"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={onCopyPassword}
                className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onDone}
                className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherRegistrationModal;