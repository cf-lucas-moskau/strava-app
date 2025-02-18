import React from "react";
import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  Badge,
  Progress,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";

const AchievementCard = ({ achievement, progress, style }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const isCompleted = progress >= 100;

  // Apply custom style if provided
  const customStyle = style
    ? {
        bg: style.backgroundColor || bgColor,
        borderColor: style.borderColor || borderColor,
        boxShadow: style.boxShadow || "md",
        headingColor: style.headingColor,
        textColor: style.textColor,
        progressColor: style.progressColor || (isCompleted ? "green" : "blue"),
        badgeStyle: style.badgeStyle || "solid",
        gradientOverlay: style.gradientOverlay,
      }
    : {};

  return (
    <Tooltip label={achievement.description}>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        p={4}
        bg={customStyle.bg}
        borderColor={customStyle.borderColor}
        boxShadow={customStyle.boxShadow}
        position="relative"
        transition="transform 0.2s"
        _hover={{ transform: "translateY(-2px)" }}
      >
        {customStyle.gradientOverlay && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            background={customStyle.gradientOverlay}
            opacity={0.1}
            pointerEvents="none"
          />
        )}

        {isCompleted && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            colorScheme="green"
            variant={customStyle.badgeStyle}
          >
            Completed
          </Badge>
        )}

        <VStack spacing={2} align="start">
          <Text fontSize="2xl" mb={0}>
            {achievement.icon}
          </Text>
          <Heading size="sm" color={customStyle.headingColor}>
            {achievement.name}
          </Heading>
          <Text fontSize="sm" color={customStyle.textColor || "gray.600"}>
            {achievement.description}
          </Text>
          <Progress
            value={progress}
            width="100%"
            colorScheme={customStyle.progressColor}
            borderRadius="full"
          />
          <Text fontSize="xs" color={customStyle.textColor || "gray.500"}>
            {Math.min(progress, 100)}% Complete
          </Text>
        </VStack>
      </Box>
    </Tooltip>
  );
};

const AchievementsDisplay = ({
  achievements,
  userProgress,
  equippedStyle,
  cosmetics,
}) => {
  // Get the equipped achievement style if one is equipped
  const achievementStyle =
    equippedStyle && cosmetics[equippedStyle] ? cosmetics[equippedStyle] : null;

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Achievements
      </Heading>
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
        gap={6}
      >
        {Object.values(achievements)
          .flat()
          .map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              progress={userProgress[achievement.id] || 0}
              style={achievementStyle}
            />
          ))}
      </Grid>
    </Box>
  );
};

export default AchievementsDisplay;
