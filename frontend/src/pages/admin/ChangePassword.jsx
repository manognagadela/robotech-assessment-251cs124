import api from "../../api/axios";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const COOLDOWN_SECONDS = 30;

export default function ChangePassword() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const successRef = useRef(null);

  const sendEmail = async () => {
    setMsg("");
    setError("");

    try {
      setLoading(true);
      await api.post("/auth/request-change-password");
      setMsg("Password change link sent to your email.");
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      setError("Unable to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  // Move focus to success message
  useEffect(() => {
    if (msg && successRef.current) {
      successRef.current.focus();
    }
  }, [msg]);

  const isDisabled = loading || cooldown > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#020617] to-black flex flex-col items-center px-4">
      {/* ===== TOP LOGO ===== */}
      <Link
        to="/admin/dashboard"
        aria-label="Go to RoboTech homepage"
        className="mt-10 mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
      >
        <img
          src="/robotech_nitk_logo.jpeg"
          alt="RoboTech"
          className="
            w-auto
            h-46
            rounded-full
            
            p-4
            shadow-lg
            opacity-0 translate-y-2
            animate-logo-in
            motion-reduce:opacity-100 motion-reduce:translate-y-0
          "
        />
      </Link>

      {/* ===== CARD ===== */}
      <div className="w-full max-w-md bg-transparent-800 p-6 sm:p-8 rounded text-white">
        {/* Back */}
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="text-sm text-cyan-400 mb-4"
        >
          ← Back to Dashboard
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold mb-2">
          Change Password
        </h2>

        <p className="text-sm text-gray-400 mb-6">
          A secure password reset link will be sent to your registered email address.
        </p>

        {/* Send / Resend button */}
        <button
          onClick={sendEmail}
          disabled={isDisabled}
          aria-busy={loading}
          className={`w-full py-3 rounded text-base font-medium transition ${
            isDisabled
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 active:bg-blue-700"
          }`}
        >
          {loading
            ? "Sending…"
            : cooldown > 0
            ? `Resend available in ${cooldown}s`
            : msg
            ? "Resend Email"
            : "Send Change Password Email"}
        </button>

        {/* Cooldown hint */}
        {cooldown > 0 && (
          <p
            className="mt-3 text-sm text-gray-400"
            role="status"
            aria-live="polite"
          >
            You can resend the email in {cooldown} seconds.
          </p>
        )}

        {/* Success */}
        {msg && (
          <div
            ref={successRef}
            tabIndex="-1"
            role="status"
            aria-live="polite"
            className="mt-4 flex items-center gap-2 text-green-400 animate-fade-in"
          >
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-gray-900 font-bold"
            >
              ✓
            </span>
            <span className="text-sm">{msg}</span>
          </div>
        )}

        {msg && (
          <div className="mt-2 text-xs text-gray-400" role="note">
            Didn’t receive the email? Check your{" "}
            <span className="font-medium text-gray-300">Spam</span> or{" "}
            <span className="font-medium text-gray-300">Promotions</span>{" "}
            folder, or wait a minute before resending.
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 text-red-400 text-sm"
          >
            {error}
          </div>
        )}
      </div>

      {/* ===== ANIMATIONS ===== */}
      <style>
        {`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.25s ease-out;
          }

          @keyframes logo-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-logo-in {
            animation: logo-in 0.35s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
