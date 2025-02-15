import React from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Text,
  Flex,
  Badge,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";

const LeaderboardRow = ({
  rank,
  athlete,
  weeklyDistance,
  weeklyStreak,
  achievements,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const isCurrentUser = athlete.isCurrentUser;

  return (
    <Tr
      bg={isCurrentUser ? "blue.50" : bgColor}
      _hover={{ bg: isCurrentUser ? "blue.100" : "gray.50" }}
    >
      <Td>
        <Badge
          colorScheme={rank <= 3 ? "yellow" : "gray"}
          fontSize="lg"
          p={2}
          borderRadius="full"
        >
          {rank}
        </Badge>
      </Td>
      <Td>
        <Flex align="center" gap={3}>
          <Image
            src={athlete.profile}
            alt={athlete.firstname}
            boxSize="40px"
            borderRadius="full"
          />
          <Box>
            <Text fontWeight="bold">
              {athlete.firstname} {athlete.lastname}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {athlete.city}
            </Text>
          </Box>
        </Flex>
      </Td>
      <Td isNumeric>{(weeklyDistance / 1000).toFixed(1)} km</Td>
      <Td isNumeric>
        <Flex align="center" justify="flex-end" gap={1}>
          {weeklyStreak} days
          {weeklyStreak >= 3 && <Text>🔥</Text>}
        </Flex>
      </Td>
      <Td>
        <Flex gap={1}>
          {achievements.map((achievement, index) => (
            <Text key={index} title={achievement.name}>
              {achievement.icon}
            </Text>
          ))}
        </Flex>
      </Td>
    </Tr>
  );
};

const Leaderboard = ({ athletes }) => {
  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Weekly Leaderboard
      </Heading>
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Athlete</Th>
              <Th isNumeric>Weekly Distance</Th>
              <Th isNumeric>Streak</Th>
              <Th>Achievements</Th>
            </Tr>
          </Thead>
          <Tbody>
            {athletes
              .sort((a, b) => b.weeklyDistance - a.weeklyDistance)
              .map((athlete, index) => (
                <LeaderboardRow
                  key={athlete.id}
                  rank={index + 1}
                  athlete={athlete}
                  weeklyDistance={athlete.weeklyDistance}
                  weeklyStreak={athlete.weeklyStreak}
                  achievements={athlete.recentAchievements || []}
                />
              ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default Leaderboard;
