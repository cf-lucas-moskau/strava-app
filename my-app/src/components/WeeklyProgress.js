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
  Stack,
  IconButton,
  useBreakpointValue,
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

  // Responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const progressSize = useBreakpointValue({ base: "80px", md: "100px" });
  const headingSize = useBreakpointValue({ base: "md", md: "lg" });
  const stackDirection = useBreakpointValue({ base: "column", md: "row" });
  const contentSpacing = useBreakpointValue({ base: 4, md: 8 });

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
      <Flex justify="center" align="center" py={6}>
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  const NavigationButtons = () => (
    <Flex gap={2} justify={isMobile ? "center" : "flex-start"}>
      {isMobile ? (
        <>
          <IconButton
            icon={<ChevronLeftIcon />}
            onClick={() => setWeekOffset((prev) => prev - 1)}
            variant="ghost"
            aria-label="Previous Week"
            size="sm"
          />
          {weekOffset !== 0 && (
            <IconButton
              icon="•"
              onClick={() => setWeekOffset(0)}
              variant="ghost"
              aria-label="Current Week"
              size="sm"
            />
          )}
          <IconButton
            icon={<ChevronRightIcon />}
            onClick={() => setWeekOffset((prev) => prev + 1)}
            variant="ghost"
            aria-label="Next Week"
            size="sm"
          />
        </>
      ) : (
        <>
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
        </>
      )}
    </Flex>
  );

  const currentDistance = getAllThisWeeksActivities(
    activities,
    weekOffset
  ).reduce((acc, curr) => acc + curr.distance, 0);
  const targetDistance = weeklyTrainings.reduce(
    (acc, curr) => acc + curr.distance,
    0
  );
  const progressPercentage = (currentDistance / targetDistance) * 100 || 0;

  return (
    <Stack
      direction={stackDirection}
      spacing={contentSpacing}
      mb={6}
      borderBottom="1px"
      borderColor="gray.200"
      pb={4}
      width="100%"
      align={isMobile ? "center" : "flex-start"}
    >
      <Box flex="1" width={isMobile ? "100%" : "auto"}>
        <Heading
          as="h2"
          size={headingSize}
          mb={2}
          textAlign={isMobile ? "center" : "left"}
        >
          {getWeekLabel(weekOffset)}
        </Heading>
        <NavigationButtons />
      </Box>

      <Stack
        direction={isMobile ? "row" : "row"}
        align="center"
        spacing={contentSpacing}
        width={isMobile ? "100%" : "auto"}
        justify={isMobile ? "space-between" : "flex-end"}
      >
        <Box textAlign={isMobile ? "left" : "right"}>
          <Text
            fontSize={isMobile ? "md" : "lg"}
            fontWeight="bold"
            color="gray.700"
          >
            Weekly Progress
          </Text>
          <Text fontSize="sm" color="gray.600">
            {formatMeterToKilometer(currentDistance)} of{" "}
            {formatMeterToKilometer(targetDistance)}
          </Text>
        </Box>
        <Box position="relative" width={progressSize} height={progressSize}>
          <CircularProgress
            value={progressPercentage}
            color="teal.400"
            size={progressSize}
            thickness="8px"
          >
            <CircularProgressLabel>
              {Math.round(progressPercentage)}%
            </CircularProgressLabel>
          </CircularProgress>
        </Box>
      </Stack>
    </Stack>
  );
};

export default WeeklyProgress;
