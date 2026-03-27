import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

const Layout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Student System</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
};

export default Layout;