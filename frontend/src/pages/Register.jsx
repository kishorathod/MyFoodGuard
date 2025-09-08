import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiLock, FiUsers, FiList, FiEye, FiEyeOff } from "react-icons/fi";
import { FaLeaf } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    members: 1,
    preferences: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await axios.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        household: {
          members: parseInt(form.members),
          preferences: form.preferences.split(",").map((p) => p.trim()),
        },
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email
      }));
      toast.success("Account created successfully! 🎉");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Register Card with animation */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-2xl"
      >
        <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-800/20 backdrop-blur-md bg-white/70 dark:bg-gray-900/70">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg animate-float">
                <FaLeaf className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Join FoodWaste Tracker
            </h1>
            <p className="text-muted-foreground">
              Create your account and start managing your kitchen efficiently
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full mb-6 flex items-center justify-center space-x-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-xl h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.03] focus:ring-2 focus:ring-emerald-400"
          >
            <FcGoogle className="h-5 w-5" />
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">or</span>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <input
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="input pl-10 w-full focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="input pl-10 w-full focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="input pl-10 pr-10 w-full focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Household Members
                </label>
                <div className="relative">
                  <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <input
                    name="members"
                    type="number"
                    placeholder="Number of members"
                    min="1"
                    value={form.members}
                    onChange={handleChange}
                    required
                    className="input pl-10 w-full focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Dietary Preferences
              </label>
              <div className="relative">
                <FiList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  name="preferences"
                  type="text"
                  placeholder="e.g. vegetarian, vegan, gluten-free (comma separated)"
                  value={form.preferences}
                  onChange={handleChange}
                  className="input pl-10 w-full focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 dark:focus:ring-emerald-500 dark:focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary rounded-xl h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.03] focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
