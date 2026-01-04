import { useState, useRef, useEffect } from "react";
import api from "../../api/axios";
import { Link } from "react-router-dom";

const COOLDOWN_SECONDS = 30;
const STORAGE_KEY = "forgot_password_cooldown_until";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const successRef = useRef(null);

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    const storedUntil = localStorage.getItem(STORAGE_KEY);
    if (storedUntil) {
      const remaining = Math.ceil(
        (Number(storedUntil) - Date.now()) / 1000
      );
      if (remaining > 0) {
        setCooldown(remaining);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(STORAGE_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus success message for screen readers
  useEffect(() => {
    if (msg && successRef.current) {
      successRef.current.focus();
    }
  }, [msg]);

  const submit = async () => {
    setMsg("");
    setError("");

    if (!email) {
      return setError("Please enter your email address.");
    }

    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });

      setMsg("If the email exists, a reset link has been sent.");

      const until = Date.now() + COOLDOWN_SECONDS * 1000;
      localStorage.setItem(STORAGE_KEY, String(until));
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      setError("Unable to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldown > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#020617] to-black flex flex-col items-center px-4">
      {/* ===== TOP LOGO ===== */}
      <Link
        to="/admin/login"
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
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">
          Forgot Password
        </h2>

        <input
          type="email"
          autoComplete="email"
          className="w-full p-3 rounded mb-4 text-base"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />

        <button
          onClick={submit}
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
            ? "Resend Reset Link"
            : "Send Reset Link"}
        </button>

        {/* Cooldown helper */}
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
            className="mt-4 text-green-400 text-sm animate-fade-in"
          >
            {msg}
          </div>
        )}

        {/* Spam helper */}
        {msg && (
          <p className="mt-2 text-xs text-gray-400" role="note">
            Didn’t receive the email? Check your{" "}
            <span className="text-gray-300 font-medium">Spam</span> or{" "}
            <span className="text-gray-300 font-medium">Promotions</span>{" "}
            folder.
          </p>
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
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
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
