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

const AchievementCard = ({ achievement, progress }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const isCompleted = progress >= 100;

  return (
    <Tooltip label={achievement.description}>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        p={4}
        bg={bgColor}
        borderColor={borderColor}
        position="relative"
        transition="transform 0.2s"
        _hover={{ transform: "translateY(-2px)" }}
      >
        {isCompleted && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            colorScheme="green"
            variant="solid"
          >
            Completed
          </Badge>
        )}

        <VStack spacing={2} align="start">
          <Text fontSize="2xl" mb={0}>
            {achievement.icon}
          </Text>
          <Heading size="sm">{achievement.name}</Heading>
          <Text fontSize="sm" color="gray.600">
            {achievement.description}
          </Text>
          <Progress
            value={progress}
            width="100%"
            colorScheme={isCompleted ? "green" : "blue"}
            borderRadius="full"
          />
          <Text fontSize="xs" color="gray.500">
            {Math.min(progress, 100)}% Complete
          </Text>
        </VStack>
      </Box>
    </Tooltip>
  );
};

const AchievementsDisplay = ({ achievements, userProgress }) => {
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
            />
          ))}
      </Grid>
    </Box>
  );
};

export default AchievementsDisplay;
