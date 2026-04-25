import { Section } from "../../../types";
import { useState } from "react";

interface StudentRegistrationModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  sections: Section[];
  registering: boolean;
  error: string;
}

const StudentRegistrationModal = ({
  show,
  onClose,
  onSubmit,
  sections,
  registering,
  error,
}: StudentRegistrationModalProps) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    enrollment_date: "",
    section_id: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Register New Student</h2>
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
              <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
              <input
                type="date"
                value={form.enrollment_date}
                onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section *</label>
              <select
                required
                value={form.section_id}
                onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="">Select a section</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Grade {sec.grade} - {sec.name} ({sec.academic_year_start})
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
            <button type="submit" disabled={registering} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">
              {registering ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRegistrationModal;