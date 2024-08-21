// PaceCalculator.js
import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import Header from "./components/Header";

function PaceCalculator() {
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [data, setData] = useState([]);
  const secondsInputRef = useRef(null);

  const handleMinutesChange = (e) => {
    setMinutes(e.target.value);
    if (e.target.value.length === 2) {
      secondsInputRef.current.focus();
    }
  };

  const handleSecondsChange = (e) => {
    setSeconds(e.target.value);
  };

  const calculateTimes = () => {
    const paceInSeconds = parseInt(minutes) * 60 + parseInt(seconds || "0"); // Convert to total seconds
    const paces = generatePaceRange(paceInSeconds);
    const results = paces.map((p) => {
      return {
        pace: formatPace(p),
        "1k": formatTime(p),
        "5k": formatTime(5 * p),
        "10k": formatTime(10 * p),
        half: formatTime(21.0975 * p),
        marathon: formatTime(42.195 * p),
      };
    });
    setData(results);
  };

  const generatePaceRange = (basePace) => {
    const range = [];
    for (let i = -8; i <= 8; i++) {
      range.push(basePace + i * 2); // Adjust pace by +/- 5 seconds
    }
    return range;
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? "0" : ""}${mins}:${
        secs < 10 ? "0" : ""
      }${secs}`;
    } else {
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }
  };

  const formatPace = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs} min/km`;
  };

  return (
    <>
      <Header />
      <VStack spacing={8} align="stretch">
        <Box p={5} shadow="md" borderWidth="1px" width="300px" mx="auto">
          <Heading as="h1" size="lg" mb={6} textAlign="center">
            Pace Calculator
          </Heading>
          <HStack spacing={2}>
            <Input
              type="number"
              value={minutes}
              onChange={handleMinutesChange}
              placeholder="Min"
              width="80px"
              maxLength="2"
            />
            <Input
              ref={secondsInputRef}
              type="number"
              value={seconds}
              onChange={handleSecondsChange}
              placeholder="Sec"
              width="80px"
              maxLength="2"
            />
          </HStack>
          <Button
            mt={4}
            colorScheme="teal"
            onClick={calculateTimes}
            width="225px"
          >
            Calculate
          </Button>
        </Box>
        {data.length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            width="100%"
            mx="auto"
            maxW="800px"
          >
            <PaceTable data={data} />
          </Box>
        )}
      </VStack>
    </>
  );
}

const PaceTable = ({ data }) => {
  return (
    <Table variant="simple" size="sm">
      <Thead>
        <Tr>
          <Th>Pace (min/km)</Th>
          <Th>1k Time</Th>
          <Th>5k Time</Th>
          <Th>10k Time</Th>
          <Th>Half Marathon Time</Th>
          <Th>Marathon Time</Th>
        </Tr>
      </Thead>
      <Tbody>
        {data.map((row, index) => (
          <Tr key={index}>
            <Td>{row.pace}</Td>
            <Td>{row["1k"]}</Td>
            <Td>{row["5k"]}</Td>
            <Td>{row["10k"]}</Td>
            <Td>{row["half"]}</Td>
            <Td>{row["marathon"]}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default PaceCalculator;
