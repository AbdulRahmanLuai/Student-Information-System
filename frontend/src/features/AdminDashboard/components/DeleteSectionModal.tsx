import { Section } from "../../../types";

interface DeleteSectionModalProps {
  section: Section | null;
  deleting: boolean;
  error: string;
  onCancel: () => void;
  onDelete: () => void;
}

const DeleteSectionModal = ({
  section,
  deleting,
  error,
  onCancel,
  onDelete,
}: DeleteSectionModalProps) => {
  if (!section) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2">Delete Section</h2>
        <p className="text-gray-600 mb-1">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-800">
            Grade {section.grade} — {section.name}
          </span>
          ?
        </p>
        <p className="text-sm text-gray-500 mb-4">
          This will also delete all course offerings for this section. Sections after it will be
          renamed automatically.
        </p>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSectionModal;