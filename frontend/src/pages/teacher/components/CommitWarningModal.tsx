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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-slate-200">

        {/* TITLE */}
        <h2 className="text-lg font-semibold text-slate-900">
          Commit Marks
        </h2>

        {/* DESCRIPTION */}
        <p className="text-sm text-slate-600 mt-2">
          Are you sure you want to commit marks?
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Marks cannot be changed after committing.
        </p>

        {/* ERROR */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md mt-3">
            {error}
          </p>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={committing}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-slate-400 transition"
          >
            {committing ? "Committing..." : "Commit"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CommitWarningModal;