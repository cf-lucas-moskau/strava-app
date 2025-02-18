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
} from "@chakra-ui/react";
import RoutePreview from "./RoutePreview";
import {
  formatMeterToKilometer,
  formatPace,
  formatDuration,
} from "../utils/formatters";

function Activity({ activity, loadSingleActivity, theme }) {
  // Responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const routePreviewSize = useBreakpointValue({
    base: "150px",
    sm: "180px",
    md: "200px",
  });
  const headingSize = useBreakpointValue({ base: "sm", md: "md" });
  const stackSpacing = useBreakpointValue({ base: 2, md: 4 });
  const contentPadding = useBreakpointValue({ base: 3, md: 4 });

  // Apply theme styles if available
  const themeStyles = theme
    ? {
        borderColor: theme.borderColor || "gray.200",
        bg: theme.backgroundColor || "white",
        boxShadow: theme.boxShadow || "md",
        headingColor: theme.headingColor || "inherit",
        textColor: theme.textColor || "gray.600",
        statsBg: theme.statsBackgroundColor || "transparent",
        gradientOverlay: theme.gradientOverlay,
      }
    : {};

  const ActivityStats = () => (
    <Stack
      direction={isMobile ? "column" : "row"}
      spacing={stackSpacing}
      width="100%"
      justify={isMobile ? "flex-start" : "space-between"}
      divider={isMobile ? <Divider /> : null}
      py={2}
      bg={themeStyles.statsBg}
      borderRadius="md"
    >
      <HStack spacing={2}>
        <Text fontWeight="medium" color={themeStyles.textColor} minWidth="70px">
          Distance:
        </Text>
        <Text color={themeStyles.textColor}>
          {formatMeterToKilometer(activity.distance)}
        </Text>
      </HStack>
      <HStack spacing={2}>
        <Text fontWeight="medium" color={themeStyles.textColor} minWidth="70px">
          Pace:
        </Text>
        <Text color={themeStyles.textColor}>
          {formatPace(activity.average_speed)} /km
        </Text>
      </HStack>
      <HStack spacing={2}>
        <Text fontWeight="medium" color={themeStyles.textColor} minWidth="70px">
          Time:
        </Text>
        <Text color={themeStyles.textColor}>
          {formatDuration(activity.elapsed_time)}
        </Text>
      </HStack>
    </Stack>
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
      bg={themeStyles.bg}
      _hover={{ boxShadow: "lg" }}
      transition="all 0.2s"
      position="relative"
    >
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
            theme={theme}
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
            <VStack align={isMobile ? "flex-start" : "flex-start"} spacing={1}>
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
    </Box>
  );
}

export default Activity;
