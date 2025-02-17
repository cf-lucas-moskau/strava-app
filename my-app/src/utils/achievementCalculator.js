import {
  achievementsList,
  calculateWeeklyTotal,
  isSameDay,
  isConsecutiveDay,
} from "./achievements";

export const calculateCurrentStreak = (activities) => {
  if (!activities) return 0;
  let streak = 0;
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.start_date_local) - new Date(a.start_date_local)
  );

  let currentDate = new Date();
  for (let activity of sortedActivities) {
    const activityDate = new Date(activity.start_date_local);
    if (isSameDay(currentDate, activityDate)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (isConsecutiveDay(currentDate, activityDate)) {
      streak++;
      currentDate = activityDate;
    } else {
      break;
    }
  }
  return streak;
};

export const calculateAchievementProgress = (activities) => {
  const progress = {};

  // Calculate progress for each achievement
  Object.values(achievementsList)
    .flat()
    .forEach((achievement) => {
      if (achievement.type === "single_run") {
        const bestRun = Math.max(...activities.map((a) => a.distance));
        progress[achievement.id] = (bestRun / achievement.requirement) * 100;
      } else if (achievement.type === "weekly_total") {
        const weeklyTotal = calculateWeeklyTotal(activities);
        progress[achievement.id] =
          (weeklyTotal / achievement.requirement) * 100;
      } else if (achievement.type === "streak") {
        const currentStreak = calculateCurrentStreak(activities);
        progress[achievement.id] =
          (currentStreak / achievement.requirement) * 100;
      } else if (achievement.type === "average_pace") {
        // Find the best (lowest) pace among all activities
        const bestPace = Math.min(
          ...activities
            .filter((a) => a.average_speed) // Filter out activities without speed data
            .map((a) => 1000 / a.average_speed) // Convert to seconds per kilometer
        );
        // If we have a valid pace and it's better (lower) than the requirement, set progress to 100%
        progress[achievement.id] =
          bestPace <= achievement.requirement
            ? 100
            : (achievement.requirement / bestPace) * 100;
      }
    });

  return progress;
};
