import { FiUser } from "react-icons/fi";
import { useState } from "react";
import { authService } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function UserProfileModal({ onClose, onProfileUpdate }) {
  const { user: authUser, updateUserProfile } = useAuthContext();
  
  console.log('UserProfileModal: Current auth user:', authUser);
  
  let userObj = { name: "", email: "" };
  try {
    if (authUser) {
      userObj = authUser;
    } else {
      const userStr = localStorage.getItem("user");
      if (userStr) userObj = JSON.parse(userStr);
    }
  } catch {
    // ignore
  }
  
  console.log('UserProfileModal: Using user object:', userObj);
  const [form, setForm] = useState({
    name: userObj.name || "",
    email: userObj.email || "",
    newPassword: ""
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    
    // Validate form data
    if (!form.name.trim()) {
      setMsg("Name is required.");
      toast.error("Name is required.");
      setSaving(false);
      return;
    }
    
    if (!form.email.trim()) {
      setMsg("Email is required.");
      toast.error("Email is required.");
      setSaving(false);
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMsg("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      setSaving(false);
      return;
    }
    
    // Password update validation
    if (form.newPassword && form.newPassword.length < 6) {
      setMsg("New password must be at least 6 characters.");
      toast.error("New password must be at least 6 characters.");
      setSaving(false);
      return;
    }
    
    try {
      // Call backend to update user profile via AuthContext
      const result = await updateUserProfile(form);
      if (result.success) {
        setMsg("Profile updated successfully!");
        toast.success("Profile updated successfully!");
        // Call the callback if provided
        if (onProfileUpdate) {
          onProfileUpdate(result.data?.user || result.data);
        }
        setTimeout(onClose, 1000);
      } else {
        setMsg(result.error || "Failed to update profile.");
        toast.error(result.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMsg("Failed to update profile. Please try again.");
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex min-h-screen min-w-screen items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-gray-200 dark:border-gray-700 mx-auto animate-fade-in flex flex-col">
        <button
          className="absolute right-5 top-5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-3xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex flex-col items-center mb-6">
          <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500 text-white font-bold text-3xl shadow-lg mb-2">
            {form.name ? form.name[0].toUpperCase() : (form.email?.[0]?.toUpperCase() || 'U')}
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Profile & Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal info</p>
        </div>
        <form onSubmit={handleSave} className="space-y-6 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 text-white py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-md text-lg"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {msg && <div className="text-center text-emerald-600 mt-2 font-medium">{msg}</div>}
        </form>
      </div>
    </div>
  );
} 