import React from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Progress,
  Button,
  Grid,
  useColorModeValue,
  Badge,
  Flex,
} from "@chakra-ui/react";

const ChallengeCard = ({ challenge, onJoin, onLeave }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={6}
      bg={bgColor}
      borderColor={borderColor}
      position="relative"
      transition="transform 0.2s"
      _hover={{ transform: "translateY(-2px)" }}
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="md">{challenge.title}</Heading>
          <Badge
            colorScheme={
              challenge.difficulty === "easy"
                ? "green"
                : challenge.difficulty === "medium"
                ? "yellow"
                : "red"
            }
          >
            {challenge.difficulty}
          </Badge>
        </Flex>

        <Text>{challenge.description}</Text>

        <Box>
          <Flex justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600">
              Progress
            </Text>
            <Text fontSize="sm" fontWeight="bold">
              {challenge.currentValue}/{challenge.targetValue} {challenge.unit}
            </Text>
          </Flex>
          <Progress
            value={(challenge.currentValue / challenge.targetValue) * 100}
            colorScheme={challenge.isCompleted ? "green" : "blue"}
            borderRadius="full"
          />
        </Box>

        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="gray.500">
            {challenge.participantsCount} participants
          </Text>
          <Text fontSize="sm" color="gray.500">
            {challenge.daysLeft} days left
          </Text>
        </Flex>

        {challenge.isJoined ? (
          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => onLeave(challenge.id)}
          >
            Leave Challenge
          </Button>
        ) : (
          <Button colorScheme="blue" onClick={() => onJoin(challenge.id)}>
            Join Challenge
          </Button>
        )}
      </VStack>
    </Box>
  );
};

const Challenges = ({ challenges, onJoinChallenge, onLeaveChallenge }) => {
  const activeChallenges = challenges.filter((c) => c.isJoined);
  const availableChallenges = challenges.filter((c) => !c.isJoined);

  return (
    <Box p={6}>
      {activeChallenges.length > 0 && (
        <>
          <Heading size="lg" mb={6}>
            Your Active Challenges
          </Heading>
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            }}
            gap={6}
            mb={8}
          >
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onLeave={onLeaveChallenge}
              />
            ))}
          </Grid>
        </>
      )}

      <Heading size="lg" mb={6}>
        Available Challenges
      </Heading>
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
        gap={6}
      >
        {availableChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onJoin={onJoinChallenge}
          />
        ))}
      </Grid>
    </Box>
  );
};

export default Challenges;
