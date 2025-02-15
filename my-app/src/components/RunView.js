import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Flex,
  Checkbox,
  Card,
  CardBody,
  Stack,
  Divider,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import PaceAnalysis from "./PaceAnalysis";

function RunView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLaps, setSelectedLaps] = useState([]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          setError("Please log in to view this activity");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `https://www.strava.com/api/v3/activities/${id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        setActivity(response.data);
      } catch (error) {
        setError(error.response?.data?.message || "Error loading activity");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  const formatMeterToKilometer = (meters) => {
    return (meters / 1000).toFixed(2) + " km";
  };

  const convertToPace = (numberToBeConverted) => {
    const minutes = Math.floor(numberToBeConverted);
    const seconds = Math.round((numberToBeConverted - minutes) * 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleLapSelection = (lapIndex) => {
    setSelectedLaps((prevSelected) => {
      if (prevSelected.includes(lapIndex)) {
        return prevSelected.filter((index) => index !== lapIndex);
      } else {
        return [...prevSelected, lapIndex];
      }
    });
  };

  const calculateSelectedLapsSummary = () => {
    if (!selectedLaps.length || !activity) return null;

    const selectedLapsData = selectedLaps.map((index) => activity.laps[index]);
    const totalDistance = selectedLapsData.reduce(
      (sum, lap) => sum + lap.distance,
      0
    );
    const totalTime = selectedLapsData.reduce(
      (sum, lap) => sum + lap.moving_time,
      0
    );
    const averagePace = totalTime / 60 / (totalDistance / 1000);

    return {
      totalDistance,
      totalTime,
      averagePace,
    };
  };

  if (loading) {
    return (
      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500" mb={4}>
          {error}
        </Text>
        <Button onClick={() => navigate("/")} leftIcon={<ArrowBackIcon />}>
          Back to Home
        </Button>
      </Box>
    );
  }

  const summary = calculateSelectedLapsSummary();

  return (
    <Box maxWidth="1200px" margin="0 auto" p={6}>
      <Button
        onClick={() => navigate("/")}
        leftIcon={<ArrowBackIcon />}
        mb={6}
        size="lg"
        variant="ghost"
      >
        Back to Activities
      </Button>

      {activity && (
        <>
          <Heading as="h1" size="xl" mb={4}>
            {activity.name}
          </Heading>

          <Text color="gray.600" mb={6}>
            {new Date(activity.start_date_local).toLocaleDateString()} at{" "}
            {new Date(activity.start_date_local).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          <Box mb={8}>
            <Flex gap={8} mb={6}>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Distance
                </Text>
                <Text fontSize="xl" fontWeight="bold">
                  {formatMeterToKilometer(activity.distance)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Time
                </Text>
                <Text fontSize="xl" fontWeight="bold">
                  {convertToPace((activity.moving_time / 60).toFixed(2))}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Average Pace
                </Text>
                <Text fontSize="xl" fontWeight="bold">
                  {convertToPace(
                    activity.moving_time / 60 / (activity.distance / 1000)
                  )}{" "}
                  /km
                </Text>
              </Box>
            </Flex>
          </Box>

          {activity.description && (
            <Box mb={8}>
              <Heading as="h2" size="md" mb={2}>
                Description
              </Heading>
              <Text whiteSpace="pre-line">{activity.description}</Text>
            </Box>
          )}

          <Box mb={8}>
            <Heading as="h2" size="md" mb={4}>
              Pace Analysis
            </Heading>
            <PaceAnalysis laps={activity.laps} />
          </Box>

          <Box mb={8}>
            <Heading as="h2" size="md" mb={4}>
              Laps
            </Heading>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Select</Th>
                  <Th>Lap</Th>
                  <Th>Distance</Th>
                  <Th>Time</Th>
                  <Th>Pace</Th>
                  <Th>Avg. Heart Rate</Th>
                </Tr>
              </Thead>
              <Tbody>
                {activity.laps.map((lap, index) => (
                  <Tr
                    key={lap.id}
                    bg={
                      selectedLaps.includes(index) ? "teal.50" : "transparent"
                    }
                    _hover={{
                      bg: selectedLaps.includes(index) ? "teal.100" : "gray.50",
                    }}
                  >
                    <Td>
                      <Checkbox
                        isChecked={selectedLaps.includes(index)}
                        onChange={() => handleLapSelection(index)}
                        colorScheme="teal"
                      />
                    </Td>
                    <Td>{index + 1}</Td>
                    <Td>{formatMeterToKilometer(lap.distance)}</Td>
                    <Td>{convertToPace((lap.moving_time / 60).toFixed(2))}</Td>
                    <Td>
                      {convertToPace(
                        lap.moving_time / 60 / (lap.distance / 1000)
                      )}{" "}
                      /km
                    </Td>
                    <Td>{Math.round(lap.average_heartrate || 0)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {summary && (
            <Card variant="outline" mb={8}>
              <CardBody>
                <Heading size="md" mb={4}>
                  Selected Laps Summary
                </Heading>
                <Stack divider={<Divider />} spacing={4}>
                  <Flex justify="space-between">
                    <Text color="gray.600">Total Distance:</Text>
                    <Text fontWeight="bold">
                      {formatMeterToKilometer(summary.totalDistance)}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Total Time:</Text>
                    <Text fontWeight="bold">
                      {convertToPace((summary.totalTime / 60).toFixed(2))}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Average Pace:</Text>
                    <Text fontWeight="bold">
                      {convertToPace(summary.averagePace)} /km
                    </Text>
                  </Flex>
                </Stack>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}

export default RunView;
