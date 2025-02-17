import React, { useState, useEffect } from "react";
import { Grid, Spinner, Flex } from "@chakra-ui/react";
import TrainingCard from "./TrainingCard";
import { getThisWeeksTrainings } from "../utils/training";
import { formatMeterToKilometer, convertToPace } from "../utils/formatters";

const WeeklyTrainingGrid = ({
  athlete,
  activities,
  weekOffset,
  unclaimedTokens,
  onClaimToken,
}) => {
  const [weeklyTrainings, setWeeklyTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainings = async () => {
      setLoading(true);
      try {
        const trainings = await getThisWeeksTrainings(
          athlete,
          activities,
          weekOffset
        );
        setWeeklyTrainings(trainings);
      } catch (error) {
        console.error("Error fetching trainings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, [athlete, activities, weekOffset]);

  if (loading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  return (
    <Grid
      templateColumns={{
        base: "1fr",
        md: "repeat(2, 1fr)",
        lg: "repeat(3, 1fr)",
      }}
      gap={6}
    >
      {weeklyTrainings.map((event) => {
        const canClaim =
          event.matchedActivity && unclaimedTokens[event.matchedActivity.id];

        return (
          <TrainingCard
            key={`${event.matchedActivity?.id || event.day}-${event.title}`}
            event={event}
            formatMeterToKilometer={formatMeterToKilometer}
            convertToPace={convertToPace}
            onClaimToken={() => onClaimToken(event, event.matchedActivity)}
            canClaim={canClaim}
          />
        );
      })}
    </Grid>
  );
};

export default WeeklyTrainingGrid;
