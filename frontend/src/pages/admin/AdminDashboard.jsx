import { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ===== LOGOUT CONFIRMATION ===== */
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const logout = async () => {
    await api.post("/auth/logout");
    navigate("/admin/login");
  };

  return (
    <div className="p-6 sm:p-8 text-white">
      {/* ===== HEADER ===== */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-400">
          Manage RoboTech website content and operations
        </p>
      </div>

      {/* ===== DASHBOARD GRID ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* ===== LANDING PAGE CMS ===== */}
        <DashboardCard
          title="homepage"
          desc="Go to public pages"
          action="See public pages"
          onClick={() => navigate("/")}
          color="cyan"
        />
        <DashboardCard
          title="Projects"
          desc="Add, edit, and manage landing page projects"
          action="Manage Projects"
          onClick={() => navigate("/admin/projects")}
          color="cyan"
        />

        <DashboardCard
          title="Gallery"
          desc="Upload and manage landing page gallery images"
          action="Manage Gallery"
          onClick={() => navigate("/admin/gallery")}
          color="blue"
        />

        {/* ===== ANNOUNCEMENTS ===== */}
        <DashboardCard
          title="Announcements"
          desc="Create, publish, and manage public announcements"
          action="Manage Announcements"
          onClick={() => navigate("/admin/announcements")}
          color="emerald"
        />

        {/* ===== EVENTS ===== */}
        <DashboardCard
          title="Events"
          desc="Create and manage events, banners, and registration links"
          action="Manage Events"
          onClick={() => navigate("/admin/events")}
          color="purple"
        />

        {/* ===== TEAM ===== */}
        <DashboardCard
          title="Team Management"
          desc="Manage team members year-wise"
          action="Manage Team"
          onClick={() => navigate("/admin/team")}
          color="teal"
        />

        {/* ===== CONTACT ===== */}
        <DashboardCard
          title="Contact Messages"
          desc="View messages from Contact Us page"
          action="Open Inbox"
          onClick={() => navigate("/admin/contactMessages")}
          color="indigo"
        />

        {/* ===== SPONSORSHIP ===== */}
        <DashboardCard
          title="Sponsorship Inquiries"
          desc="View and respond to sponsorship requests"
          action="Open Inbox"
          onClick={() => navigate("/admin/sponsorship")}
          color="rose"
        />

        {/* ===== SECURITY ===== */}
        <DashboardCard
          title="Security"
          desc="Change admin password"
          action="Change Password"
          onClick={() => navigate("/admin/change-password")}
          color="yellow"
        />

        {/* ===== AUDIT LOGS ===== */}
        <DashboardCard
          title="Audit Logs"
          desc="View admin activity history"
          action="View Logs"
          onClick={() => navigate("/admin/audit-logs")}
          color="gray"
        />

        {/* ===== LOGOUT ===== */}
        <DashboardCard
          title="Logout"
          desc="Sign out from admin panel"
          action="Logout"
          onClick={() => setShowLogoutConfirm(true)}
          color="red"
        />
      </div>

      {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#0b0b0b] border border-white/10 rounded-xl p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-2">
              Confirm Logout
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to log out of the admin panel?
            </p>

            <div className="flex gap-3">
              <button
                onClick={logout}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
              >
                Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= DASHBOARD CARD ================= */

function DashboardCard({ title, desc, action, onClick, color }) {
  const colorMap = {
    cyan: "border-cyan-400 text-cyan-400",
    blue: "border-blue-500 text-blue-400",
    teal: "border-teal-400 text-teal-400",
    indigo: "border-indigo-400 text-indigo-400",
    yellow: "border-yellow-400 text-yellow-400",
    gray: "border-gray-500 text-gray-300",
    red: "border-red-500 text-red-400",
    purple: "border-purple-400 text-purple-400",
    rose: "border-rose-400 text-rose-400",
    emerald: "border-emerald-400 text-emerald-400",
  };

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-xl border
        ${colorMap[color]}
        bg-white/5 backdrop-blur-lg
        p-6 transition-all
        hover:scale-[1.03] hover:bg-white/10
        flex flex-col
      `}
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-6">{desc}</p>

      <button
        className="mt-auto px-4 py-2 rounded bg-black/40 border border-white/20 text-sm"
      >
        {action}
      </button>
    </div>
  );
}
