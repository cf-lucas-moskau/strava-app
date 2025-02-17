import { trainingPlans } from "../trainingPLans";

export const getThisWeeksTrainings = (athlete, activities, weekOffset = 0) => {
  if (!athlete || !athlete.id) {
    console.log("No athlete or athlete id");
    return [];
  }

  // Get today's date
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Filter the activities within the current week
  const thisWeeksTrainings = trainingPlans[athlete.id].filter((activity) => {
    const activityDate = new Date(activity.day);
    return activityDate >= monday && activityDate <= sunday;
  });

  // get the activities of the athlete for this week
  const athletesActivities =
    activities?.filter((activity) => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate >= monday && activityDate <= sunday;
    }) || [];

  let remainingActivities = [...athletesActivities];

  thisWeeksTrainings.forEach((training) => {
    const completed = remainingActivities.find((activity) => {
      const distanceDifference = Math.abs(
        training.distance - activity.distance
      );
      if (training.time) {
        const timeDifference = Math.abs(
          training.time - activity.moving_time / 60
        );
        return (
          distanceDifference < training.distance * 0.15 &&
          timeDifference < training.time * 0.15
        );
      }
      return distanceDifference < training.distance * 0.15;
    });

    training.completed = !!completed;
    training.fullFilledTraining = completed;
    training.matchedActivity = completed;

    if (completed) {
      remainingActivities = remainingActivities.filter(
        (activity) => activity.id !== completed.id
      );
    }
  });

  return thisWeeksTrainings;
};

export const getThisWeeksActivities = (activities, weekOffset = 0) => {
  if (!activities) return [];

  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Get all activities for this week
  const weekActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.start_date_local);
    return activityDate >= monday && activityDate <= sunday;
  });

  // Return only unmatched activities
  return weekActivities;
};

export const getAllThisWeeksActivities = (activities, weekOffset = 0) => {
  return getThisWeeksActivities(activities, weekOffset);
};

export const getUnmatchedActivities = () => {
  return window.unmatchedActivities || [];
};
