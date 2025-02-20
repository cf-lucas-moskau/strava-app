import React from "react";
import {
  Box,
  Flex,
  Stack,
  Text,
  Heading,
  useBreakpointValue,
  VStack,
  HStack,
  Divider,
  Avatar,
  Link,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import RoutePreview from "./RoutePreview";
import {
  formatMeterToKilometer,
  formatPace,
  formatDuration,
} from "../utils/formatters";
import ActivitySocial from "./ActivitySocial";

function Activity({
  activity,
  loadSingleActivity,
  runnerProfile,
  currentUser,
  theme = null,
  cosmetics,
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const routePreviewSize = useBreakpointValue({
    base: "150px",
    sm: "180px",
    md: "200px",
  });
  const headingSize = useBreakpointValue({ base: "sm", md: "md" });
  const stackSpacing = useBreakpointValue({ base: 2, md: 4 });
  const contentPadding = useBreakpointValue({ base: 3, md: 4 });

  // Default theme styles
  const defaultStyles = {
    backgroundColor: "white",
    borderColor: "gray.200",
    boxShadow: "sm",
    headingColor: "gray.800",
    textColor: "gray.600",
    statsBackgroundColor: "gray.50",
  };

  // Use theme styles if provided, otherwise use defaults
  const themeStyles = theme
    ? {
        backgroundColor: theme.backgroundColor || defaultStyles.backgroundColor,
        borderColor: theme.borderColor || defaultStyles.borderColor,
        boxShadow: theme.boxShadow || defaultStyles.boxShadow,
        headingColor: theme.headingColor || defaultStyles.headingColor,
        textColor: theme.textColor || defaultStyles.textColor,
        statsBackgroundColor:
          theme.statsBackgroundColor || defaultStyles.statsBackgroundColor,
        gradientOverlay: theme.gradientOverlay,
      }
    : defaultStyles;

  const ActivityStats = () => (
    <Stack
      direction={isMobile ? "column" : "row"}
      spacing={stackSpacing}
      width="100%"
      justify={isMobile ? "flex-start" : "space-between"}
      divider={isMobile ? <Divider /> : null}
      py={2}
      bg={themeStyles.statsBackgroundColor}
      borderRadius="md"
    >
      <HStack spacing={2}>
        <Text fontWeight="medium" color={themeStyles.textColor} minWidth="70px">
          Distance:
        </Text>
        <Text color={themeStyles.headingColor}>
          {formatMeterToKilometer(activity.distance)}
        </Text>
      </HStack>
      <HStack spacing={2}>
        <Text fontWeight="medium" color={themeStyles.textColor} minWidth="70px">
          Pace:
        </Text>
        <Text color={themeStyles.headingColor}>
          {formatPace(activity.average_speed)} /km
        </Text>
      </HStack>
      <HStack spacing={2}>
        <Text fontWeight="medium" color={themeStyles.textColor} minWidth="70px">
          Time:
        </Text>
        <Text color={themeStyles.headingColor}>
          {formatDuration(activity.elapsed_time)}
        </Text>
      </HStack>
    </Stack>
  );

  const RunnerInfo = () => (
    <Flex align="center" gap={3} mb={3}>
      <Box position="relative">
        {runnerProfile?.picture && (
          <Avatar
            size="md"
            src={runnerProfile?.picture}
            name={runnerProfile?.name || "Unknown Runner"}
          />
        )}
        {runnerProfile?.equipped?.profileFrame &&
          cosmetics?.[runnerProfile.equipped.profileFrame] && (
            <Box
              position="absolute"
              top="-4px"
              left="-4px"
              right="-4px"
              bottom="-4px"
              backgroundImage={`url(${
                cosmetics?.[runnerProfile.equipped.profileFrame]?.preview
              })`}
              backgroundSize="contain"
              backgroundPosition="center"
              backgroundRepeat="no-repeat"
              pointerEvents="none"
            />
          )}
      </Box>
      {runnerProfile ? (
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium" color={themeStyles.headingColor}>
            {runnerProfile.name}
          </Text>
          <Text fontSize="sm" color={themeStyles.textColor}>
            {runnerProfile.city || runnerProfile.state || runnerProfile.country}
          </Text>
        </VStack>
      ) : (
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium" color="orange.500">
            Runner needs to head to{" "}
            <Link as={RouterLink} to="/profile" color="blue.500">
              /profile
            </Link>{" "}
            first
          </Text>
          <Text fontSize="sm" color={themeStyles.textColor}>
            Profile not set up
          </Text>
        </VStack>
      )}
    </Flex>
  );

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      borderColor={themeStyles.borderColor}
      boxShadow={themeStyles.boxShadow}
      overflow="hidden"
      padding={contentPadding}
      marginBottom={6}
      position="relative"
      _hover={{ boxShadow: "lg" }}
      transition="all 0.2s"
    >
      {/* Background image and overlay */}
      {themeStyles.gradientOverlay && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          background={themeStyles.gradientOverlay}
          opacity={0.1}
          pointerEvents="none"
        />
      )}

      {/* Content */}
      <Box position="relative" zIndex={2}>
        <RunnerInfo />

        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={stackSpacing}
          width="100%"
        >
          {/* Route preview */}
          <Box width={isMobile ? "100%" : routePreviewSize} flexShrink={0}>
            <RoutePreview
              summaryPolyline={activity.map.summary_polyline}
              height={routePreviewSize}
              type={activity.type}
              theme={themeStyles}
            />
          </Box>

          {/* Activity details */}
          <Stack flex="1" spacing={3}>
            <Flex
              justify="space-between"
              align={isMobile ? "flex-start" : "center"}
              direction={isMobile ? "column" : "row"}
              gap={2}
            >
              {/* Date and Location */}
              <VStack
                align={isMobile ? "flex-start" : "flex-start"}
                spacing={1}
              >
                <Text fontSize="sm" color={themeStyles.textColor}>
                  {new Date(activity.start_date_local).toLocaleString()}
                </Text>
                {(activity.location_city ||
                  activity.location_state ||
                  activity.location_country) && (
                  <Text fontSize="sm" color={themeStyles.textColor}>
                    {activity.location_city ||
                      activity.location_state ||
                      activity.location_country}
                  </Text>
                )}
              </VStack>

              {/* Title and Description */}
              <Stack
                spacing={2}
                flex="1"
                align={isMobile ? "flex-start" : "flex-end"}
                width={isMobile ? "100%" : "auto"}
              >
                <Stack spacing={1} width="100%">
                  <Heading
                    as="h3"
                    size={headingSize}
                    cursor="pointer"
                    onClick={() => loadSingleActivity(activity.id)}
                    _hover={{ color: "teal.500" }}
                    color={themeStyles.headingColor}
                  >
                    {activity.name}
                  </Heading>
                  {activity.description && (
                    <Text fontSize="sm" color={themeStyles.textColor}>
                      {activity.description}
                    </Text>
                  )}
                </Stack>
              </Stack>
            </Flex>

            <Box borderTopWidth="1px" borderColor={themeStyles.borderColor}>
              <ActivityStats />
            </Box>
          </Stack>
        </Stack>

        {/* <ActivitySocial
          activity={activity}
          currentUser={currentUser}
          runnerProfile={runnerProfile}
        /> */}
      </Box>
    </Box>
  );
}

export default Activity;
