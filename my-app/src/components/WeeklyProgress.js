import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Heading,
  CircularProgress,
  CircularProgressLabel,
  Spinner,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { formatMeterToKilometer } from "../utils/formatters";
import {
  getThisWeeksTrainings,
  getAllThisWeeksActivities,
} from "../utils/training";

const WeeklyProgress = ({
  weekOffset,
  setWeekOffset,
  athlete,
  activities,
  getWeekLabel,
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
      <Flex justify="center" align="center" py={8}>
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  return (
    <Flex
      justify="space-between"
      align="center"
      mb={6}
      borderBottom="1px"
      borderColor="gray.200"
      pb={4}
    >
      <Box>
        <Heading as="h2" size="lg" mb={2}>
          {getWeekLabel(weekOffset)}
        </Heading>
        <Flex gap={4}>
          <Button
            size="sm"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            leftIcon={<ChevronLeftIcon />}
            variant="ghost"
          >
            Previous Week
          </Button>
          {weekOffset !== 0 && (
            <Button size="sm" onClick={() => setWeekOffset(0)} variant="ghost">
              Back to Current Week
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            rightIcon={<ChevronRightIcon />}
            variant="ghost"
          >
            Next Week
          </Button>
        </Flex>
      </Box>
      <Flex align="center" gap={8}>
        <Box textAlign="right">
          <Text fontSize="lg" fontWeight="bold" color="gray.700">
            Weekly Progress
          </Text>
          <Text fontSize="sm" color="gray.600">
            {formatMeterToKilometer(
              getAllThisWeeksActivities(activities, weekOffset).reduce(
                (acc, curr) => acc + curr.distance,
                0
              )
            )}{" "}
            of{" "}
            {formatMeterToKilometer(
              weeklyTrainings.reduce((acc, curr) => acc + curr.distance, 0)
            )}
          </Text>
        </Box>
        <Box position="relative" width="100px" height="100px">
          <CircularProgress
            value={
              (getAllThisWeeksActivities(activities, weekOffset).reduce(
                (acc, curr) => acc + curr.distance,
                0
              ) /
                weeklyTrainings.reduce((acc, curr) => acc + curr.distance, 0)) *
                100 || 0
            }
            color="teal.400"
            size="100px"
            thickness="8px"
          >
            <CircularProgressLabel>
              {Math.round(
                (getAllThisWeeksActivities(activities, weekOffset).reduce(
                  (acc, curr) => acc + curr.distance,
                  0
                ) /
                  weeklyTrainings.reduce(
                    (acc, curr) => acc + curr.distance,
                    0
                  )) *
                  100 || 0
              )}
              %
            </CircularProgressLabel>
          </CircularProgress>
        </Box>
      </Flex>
    </Flex>
  );
};

export default WeeklyProgress;
