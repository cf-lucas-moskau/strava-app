import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Spinner, Button } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import {
  formatMeterToKilometer,
  formatDuration,
  metersPerSecondsToPace,
} from "../utils/formatters";
import {
  getThisWeeksActivities,
  getThisWeeksTrainings,
} from "../utils/training";

const UnmatchedRuns = ({ athlete, activities, weekOffset, getWeekLabel }) => {
  const [weeklyTrainings, setWeeklyTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

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
      <Box mt={8} pt={6} borderTop="1px" borderColor="gray.200">
        <Flex justify="center" py={8}>
          <Spinner size="xl" color="teal.500" />
        </Flex>
      </Box>
    );
  }

  const unmatchedActivities = getThisWeeksActivities(
    activities,
    weekOffset
  ).filter((activity) => {
    // Check if this activity is matched to any training
    const isMatched = weeklyTrainings.some(
      (training) => training.matchedActivity?.id === activity.id
    );
    return !isMatched;
  });

  if (unmatchedActivities.length === 0) {
    return null;
  }

  return (
    <Box mt={8} pt={6} borderTop="1px" borderColor="gray.200">
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontSize="md" fontWeight="medium" color="gray.700">
            Unmatched Runs {getWeekLabel(weekOffset)}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {unmatchedActivities.length} activities totaling{" "}
            {formatMeterToKilometer(
              unmatchedActivities.reduce((acc, curr) => acc + curr.distance, 0)
            )}
          </Text>
        </Box>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          size="sm"
        >
          {isExpanded ? "Hide" : "Show"} Unmatched Runs
        </Button>
      </Flex>

      {isExpanded && (
        <Box>
          {unmatchedActivities.map((activity) => (
            <Flex
              key={activity.id}
              p={3}
              borderWidth="1px"
              borderRadius="md"
              mb={2}
              justify="space-between"
              align="center"
              _hover={{ bg: "gray.50" }}
            >
              <Box>
                <Text fontWeight="medium">{activity.name}</Text>
                <Text fontSize="sm" color="gray.600">
                  {new Date(activity.start_date_local).toLocaleDateString()} at{" "}
                  {new Date(activity.start_date_local).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Box>
              <Flex gap={4} align="center">
                <Text color="gray.700">
                  {formatMeterToKilometer(activity.distance)}
                </Text>
                <Text color="gray.700">
                  {formatDuration(activity.moving_time)}
                </Text>
                <Text color="gray.700">
                  {metersPerSecondsToPace(activity.average_speed)} /km
                </Text>
              </Flex>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default UnmatchedRuns;
