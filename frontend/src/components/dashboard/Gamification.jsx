import { useState } from "react";
import { FiAward, FiStar, FiTrendingUp, FiTarget, FiCheckCircle, FiGift, FiZap, FiHeart } from "react-icons/fi";

export default function Gamification({ stats }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Calculate achievements based on real stats
  const calculateAchievements = () => {
    const achievements = [];

    // Basic achievements
    if (stats.totalItems >= 1) {
      achievements.push({
        id: "first_item",
        title: "First Steps",
        description: "Added your first food item",
        icon: FiStar,
        color: "text-yellow-500",
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        unlocked: true,
        progress: 100
      });
    }

    if (stats.totalItems >= 5) {
      achievements.push({
        id: "inventory_master",
        title: "Inventory Master",
        description: "Added 5 items to your inventory",
        icon: FiTarget,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        unlocked: true,
        progress: 100
      });
    }

    if (stats.totalItems >= 10) {
      achievements.push({
        id: "stockpile_expert",
        title: "Stockpile Expert",
        description: "Added 10 items to your inventory",
        icon: FiAward,
        color: "text-purple-500",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        unlocked: true,
        progress: 100
      });
    }

    // Waste reduction achievements
    if (stats.wasteCount === 0 && stats.totalItems > 0) {
      achievements.push({
        id: "zero_waste",
        title: "Zero Waste Hero",
        description: "No expired items in your inventory",
        icon: FiHeart,
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-900/20",
        unlocked: true,
        progress: 100
      });
    }

    if (stats.wastePercentage <= 10 && stats.totalItems > 0) {
      achievements.push({
        id: "waste_reducer",
        title: "Waste Reducer",
        description: "Keep waste below 10%",
        icon: FiTrendingUp,
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-900/20",
        unlocked: true,
        progress: 100
      });
    }

    // Money saving achievements
    if (stats.moneySaved >= 10) {
      achievements.push({
        id: "money_saver",
        title: "Money Saver",
        description: "Saved $10 or more",
        icon: FiGift,
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-900/20",
        unlocked: true,
        progress: 100
      });
    }

    if (stats.moneySaved >= 50) {
      achievements.push({
        id: "big_saver",
        title: "Big Saver",
        description: "Saved $50 or more",
        icon: FiZap,
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        unlocked: true,
        progress: 100
      });
    }

    // Streak achievements
    if (stats.currentStreak >= 3) {
      achievements.push({
        id: "streak_starter",
        title: "Streak Starter",
        description: "Maintained a 3-day streak",
        icon: FiCheckCircle,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        unlocked: true,
        progress: 100
      });
    }

    if (stats.currentStreak >= 7) {
      achievements.push({
        id: "week_warrior",
        title: "Week Warrior",
        description: "Maintained a 7-day streak",
        icon: FiAward,
        color: "text-purple-500",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        unlocked: true,
        progress: 100
      });
    }

    // Progress achievements (not yet unlocked)
    if (stats.totalItems < 5) {
      achievements.push({
        id: "inventory_master_progress",
        title: "Inventory Master",
        description: "Add 5 items to your inventory",
        icon: FiTarget,
        color: "text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-900/20",
        unlocked: false,
        progress: (stats.totalItems / 5) * 100
      });
    }

    if (stats.totalItems < 10) {
      achievements.push({
        id: "stockpile_expert_progress",
        title: "Stockpile Expert",
        description: "Add 10 items to your inventory",
        icon: FiAward,
        color: "text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-900/20",
        unlocked: false,
        progress: (stats.totalItems / 10) * 100
      });
    }

    if (stats.moneySaved < 10) {
      achievements.push({
        id: "money_saver_progress",
        title: "Money Saver",
        description: "Save $10 or more",
        icon: FiGift,
        color: "text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-900/20",
        unlocked: false,
        progress: (stats.moneySaved / 10) * 100
      });
    }

    if (stats.currentStreak < 7) {
      achievements.push({
        id: "week_warrior_progress",
        title: "Week Warrior",
        description: "Maintain a 7-day streak",
        icon: FiAward,
        color: "text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-900/20",
        unlocked: false,
        progress: (stats.currentStreak / 7) * 100
      });
    }

    return achievements;
  };

  const achievements = calculateAchievements();
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  const filteredAchievements = selectedCategory === "all" 
    ? achievements 
    : selectedCategory === "unlocked" 
    ? unlockedAchievements 
    : lockedAchievements;

  if (stats.totalItems === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All</option>
              <option value="unlocked">Unlocked</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>

        <div className="text-center py-12">
          <FiAward className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Achievements Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Start adding food items to unlock achievements and track your progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All</option>
            <option value="unlocked">Unlocked</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-500">{unlockedAchievements.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Achievements Unlocked</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-500">{stats.currentStreak}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Day Streak</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-500">${stats.moneySaved.toFixed(2)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Money Saved</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-orange-500">{stats.totalItems}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Items Tracked</div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div
              key={achievement.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
                achievement.unlocked 
                  ? "hover:shadow-md" 
                  : "opacity-60"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${achievement.bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${achievement.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${
                    achievement.unlocked 
                      ? "text-gray-900 dark:text-white" 
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    achievement.unlocked 
                      ? "text-gray-600 dark:text-gray-300" 
                      : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(achievement.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          achievement.unlocked 
                            ? "bg-green-500" 
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-8">
          <FiAward className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No achievements found for this filter
          </p>
        </div>
      )}
    </div>
  );
} 