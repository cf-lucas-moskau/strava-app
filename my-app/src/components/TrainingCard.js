import React from "react";
import {
  Box,
  Text,
  Heading,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Badge,
  Icon,
  Button,
  keyframes,
} from "@chakra-ui/react";
import { CheckIcon, TimeIcon, CloseIcon, StarIcon } from "@chakra-ui/icons";

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px #FFD700; }
  50% { box-shadow: 0 0 20px #FFD700; }
  100% { box-shadow: 0 0 5px #FFD700; }
`;

const TrainingCard = ({
  event,
  formatMeterToKilometer,
  convertToPace,
  onClaimToken,
  canClaim,
}) => {
  const isCompleted = event.completed;

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={6}
      bg="white"
      boxShadow="sm"
      position="relative"
      transition="all 0.2s"
      _hover={{ boxShadow: "md" }}
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box flex="1">
          <Heading as="h3" size="md" mb={2}>
            {event.title}
          </Heading>
          <Text color="gray.600" fontSize="sm" mb={3}>
            {event.description}
          </Text>
        </Box>
        <Box ml={4}>
          <CircularProgress
            value={isCompleted ? 100 : 0}
            color={isCompleted ? "green.400" : "red.400"}
            size="60px"
            thickness="8px"
          >
            <CircularProgressLabel>
              {isCompleted ? (
                <Icon as={CheckIcon} color="green.400" boxSize={4} />
              ) : (
                <Icon as={CloseIcon} color="red.400" boxSize={3} />
              )}
            </CircularProgressLabel>
          </CircularProgress>
        </Box>
      </Flex>

      <Flex wrap="wrap" gap={2} mb={4}>
        <Badge colorScheme="purple" px={2} py={1}>
          {formatMeterToKilometer(event.distance)}
        </Badge>
        {event.time && (
          <Badge colorScheme="blue" px={2} py={1}>
            <Flex align="center" gap={1}>
              <TimeIcon boxSize={3} />
              <Text>{convertToPace(event.time / (event.distance / 1000))}</Text>
            </Flex>
          </Badge>
        )}
      </Flex>

      {event.fullFilledTraining && (
        <Box mt={4} pt={4} borderTop="1px" borderColor="gray.100">
          <Text fontSize="sm" color="gray.600" mb={canClaim ? 4 : 0}>
            Completed{" "}
            {formatMeterToKilometer(event.fullFilledTraining.distance)} on{" "}
            {new Date(
              event.fullFilledTraining.start_date_local
            ).toLocaleDateString()}
          </Text>
          {canClaim ? (
            <Flex justify="center">
              <Button
                onClick={onClaimToken}
                colorScheme="yellow"
                size="sm"
                px={4}
                leftIcon={<StarIcon boxSize={3} />}
                animation={`${glowAnimation} 2s infinite`}
              >
                Claim Token
              </Button>
            </Flex>
          ) : (
            <Flex justify="center">
              <Badge colorScheme="green" p={2} borderRadius="md">
                <Flex align="center" gap={2}>
                  <CheckIcon />
                  Token Claimed
                </Flex>
              </Badge>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TrainingCard;
