import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Student Information System — Admin View</h1>
        <button
          onClick={logout}
          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
        >
          Logout
        </button>
      </header>
      <main className="max-w-screen-xl mx-auto p-6">{children}</main>
    </div>
  );
};

export default AdminLayout;