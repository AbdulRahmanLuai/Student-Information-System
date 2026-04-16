interface CommitWarningModalProps {
  show: boolean;
  committing: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const CommitWarningModal = ({
  show,
  committing,
  error,
  onCancel,
  onConfirm,
}: CommitWarningModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2">Commit Marks</h2>
        <p className="text-gray-600 mb-1">Are you sure you want to commit marks?</p>
        <p className="text-sm text-gray-500 mb-4">
          Marks cannot be changed after committing.
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
            onClick={onConfirm}
            disabled={committing}
            className="px-4 py-2 text-sm rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400"
          >
            {committing ? "Committing..." : "Commit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommitWarningModal;