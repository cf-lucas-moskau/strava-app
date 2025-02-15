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
} from "@chakra-ui/react";
import { CheckIcon, TimeIcon, CloseIcon } from "@chakra-ui/icons";

const TrainingCard = ({ event, formatMeterToKilometer, convertToPace }) => {
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
          <Text fontSize="sm" color="gray.600">
            Completed{" "}
            {formatMeterToKilometer(event.fullFilledTraining.distance)} on{" "}
            {new Date(
              event.fullFilledTraining.start_date_local
            ).toLocaleDateString()}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default TrainingCard;
