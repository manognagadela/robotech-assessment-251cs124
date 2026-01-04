import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import api from "../../api/axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Password rules
  const rules = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isStrongEnough = Object.values(rules).every(Boolean);

  const submit = async () => {
    setError("");

    if (!password || !confirmPassword) {
      return setError("All fields are required.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (!isStrongEnough) {
      return setError("Password does not meet requirements.");
    }

    try {
      setLoading(true);
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/admin/login"), 2000);
    } catch (err) {
      if (err.response?.status === 400) {
        setError("Reset link is invalid or expired.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    password &&
    confirmPassword &&
    password === confirmPassword &&
    isStrongEnough;

  const RuleItem = ({ valid, label }) => (
    <li
      className={`flex items-center text-sm ${
        valid ? "text-green-400" : "text-gray-400"
      }`}
    >
      <span className="mr-2">{valid ? "✓" : "•"}</span>
      {label}
    </li>
  );

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
      <div className="bg-transparent-800 p-6 sm:p-8 rounded w-full max-w-md">
        <h2 className="text-white text-xl sm:text-2xl mb-4 text-center">
          Reset Password
        </h2>

        {/* Password */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full p-3 pr-12 rounded text-base"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 text-lg"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Password checklist */}
        {password && (
          <ul className="mb-4 space-y-1">
            <RuleItem valid={rules.length} label="At least 8 characters" />
            <RuleItem valid={rules.uppercase} label="One uppercase letter" />
            <RuleItem valid={rules.lowercase} label="One lowercase letter" />
            <RuleItem valid={rules.number} label="One number" />
            <RuleItem valid={rules.special} label="One special character" />
          </ul>
        )}

        {/* Confirm Password */}
        <div className="relative mb-5">
          <input
            type={showConfirm ? "text" : "password"}
            className="w-full p-3 pr-12 rounded text-base"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-3 text-gray-400 text-lg"
          >
            {showConfirm ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!isFormValid || loading}
          className={`w-full py-3 rounded text-white text-base font-medium transition ${
            loading || !isFormValid
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 active:bg-blue-700"
          }`}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
        {success && <p className="text-green-400 mt-4 text-sm">{success}</p>}
      </div>

      {/* ===== ANIMATIONS ===== */}
      <style>
        {`
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
