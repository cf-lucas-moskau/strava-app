export const achievementsList = {
  distance: [
    {
      id: "distance_5k",
      name: "First 5K",
      description: "Complete your first 5K run",
      icon: "🏃",
      requirement: 5000,
      type: "single_run",
    },
    {
      id: "distance_10k",
      name: "Double Digits",
      description: "Complete your first 10K run",
      icon: "🏃‍♂️",
      requirement: 10000,
      type: "single_run",
    },
    {
      id: "weekly_50k",
      name: "Weekly Warrior",
      description: "Run 50K in a single week",
      icon: "⚔️",
      requirement: 50000,
      type: "weekly_total",
    },
  ],
  streak: [
    {
      id: "streak_3",
      name: "Hat Trick",
      description: "Run three days in a row",
      icon: "🎩",
      requirement: 3,
      type: "streak",
    },
    {
      id: "streak_7",
      name: "Week Warrior",
      description: "Run seven days in a row",
      icon: "🔥",
      requirement: 7,
      type: "streak",
    },
  ],
  speed: [
    {
      id: "speed_630",
      name: "Speed Enthusiast",
      description: "Complete a run with an average pace under 6:30 min/km",
      icon: "⚡",
      requirement: 390, // 6:30 = 390 seconds
      type: "average_pace",
    },
  ],
  consistency: [
    {
      id: "consistent_month",
      name: "Monthly Master",
      description: "Complete all planned training sessions in a month",
      icon: "📅",
      type: "monthly_completion",
    },
  ],
};

export const checkAchievements = (activities, previousAchievements = []) => {
  const newAchievements = [];

  // Check single run achievements
  activities.forEach((activity) => {
    achievementsList.distance
      .filter((achievement) => achievement.type === "single_run")
      .forEach((achievement) => {
        if (
          activity.distance >= achievement.requirement &&
          !previousAchievements.includes(achievement.id)
        ) {
          newAchievements.push(achievement);
        }
      });
  });

  // Check weekly totals
  const weeklyTotal = calculateWeeklyTotal(activities);
  achievementsList.distance
    .filter((achievement) => achievement.type === "weekly_total")
    .forEach((achievement) => {
      if (
        weeklyTotal >= achievement.requirement &&
        !previousAchievements.includes(achievement.id)
      ) {
        newAchievements.push(achievement);
      }
    });

  // Check streaks
  const currentStreak = calculateStreak(activities);
  achievementsList.streak.forEach((achievement) => {
    if (
      currentStreak >= achievement.requirement &&
      !previousAchievements.includes(achievement.id)
    ) {
      newAchievements.push(achievement);
    }
  });

  // Check speed achievements
  activities.forEach((activity) => {
    if (!activity.average_speed) {
      return;
    }

    const averagePace = 1000 / activity.average_speed; // Convert m/s to seconds per km

    achievementsList.speed.forEach((achievement) => {
      if (
        averagePace <= achievement.requirement &&
        !previousAchievements.includes(achievement.id)
      ) {
        newAchievements.push(achievement);
      }
    });
  });

  return newAchievements;
};

export const calculateWeeklyTotal = (activities) => {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);

  return activities
    .filter((activity) => new Date(activity.start_date_local) >= startOfWeek)
    .reduce((total, activity) => total + activity.distance, 0);
};

const calculateStreak = (activities) => {
  let streak = 0;
  const sortedActivities = activities.sort(
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

const findBestKilometer = (activity) => {
  // If we have splits_metric, use that for detailed pace analysis
  if (activity.splits_metric && activity.splits_metric.length > 0) {
    const bestPace = Math.min(
      ...activity.splits_metric.map((split) => {
        const pacePerKm = split.split_time / (split.distance / 1000);
        return pacePerKm;
      })
    );
    return bestPace;
  }

  // If no splits data, use the average speed
  if (activity.average_speed) {
    // Convert meters/second to seconds/kilometer
    const pacePerKm = 1000 / activity.average_speed;
    return pacePerKm;
  }

  return Infinity;
};

export const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isConsecutiveDay = (date1, date2) => {
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const diffInDays = Math.round((date1 - date2) / oneDayInMs);
  return Math.abs(diffInDays) === 1; // Accept both +1 and -1 as consecutive days
};
