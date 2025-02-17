import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Textarea,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Flex,
  Spinner,
  Select,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { database } from "../firebase-config";
import { ref, onValue, off } from "firebase/database";
import {
  ADMIN_ATHLETE_ID,
  createTrainingPlan,
  updateTrainingPlan,
  getAllTrainingPlans,
} from "../utils/admin";

const TrainingPlanManager = ({ athlete }) => {
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState([]);
  const [newTraining, setNewTraining] = useState({
    title: "",
    description: "",
    distance: 5000,
    time: "",
    day: new Date().toISOString().split("T")[0],
    type: "run",
    intensity: "medium",
  });

  const toast = useToast();

  useEffect(() => {
    if (!athlete || athlete.id !== ADMIN_ATHLETE_ID) return;

    const trainingPlansRef = ref(database, "trainingPlans");
    const requestsRef = ref(database, "trainingPlanRequests");

    // Listen for training plans
    onValue(trainingPlansRef, (snapshot) => {
      if (snapshot.exists()) {
        const plans = snapshot.val();
        if (selectedAthleteId && plans[selectedAthleteId]) {
          setTrainings(plans[selectedAthleteId].trainings || []);
        }
      }
      setLoading(false);
    });

    // Listen for athlete list from requests
    onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requests = snapshot.val();
        const athletesList = Object.entries(requests).map(([id, data]) => ({
          id,
          name: data.athleteName,
        }));
        setAthletes(athletesList);
      }
    });

    return () => {
      off(trainingPlansRef);
      off(requestsRef);
    };
  }, [athlete, selectedAthleteId]);

  const handleAthleteChange = (e) => {
    setSelectedAthleteId(e.target.value);
  };

  const handleAddTraining = async () => {
    if (!selectedAthleteId) {
      toast({
        title: "Error",
        description: "Please select an athlete first",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updatedTrainings = [...trainings, newTraining];
    try {
      if (trainings.length === 0) {
        await createTrainingPlan(selectedAthleteId, athlete.id, [newTraining]);
      } else {
        await updateTrainingPlan(
          selectedAthleteId,
          athlete.id,
          updatedTrainings
        );
      }

      setTrainings(updatedTrainings);
      setNewTraining({
        title: "",
        description: "",
        distance: 5000,
        time: "",
        day: new Date().toISOString().split("T")[0],
        type: "run",
        intensity: "medium",
      });

      toast({
        title: "Success",
        description: "Training added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding training:", error);
      toast({
        title: "Error",
        description: "Failed to add training",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTraining = async (index) => {
    const updatedTrainings = trainings.filter((_, i) => i !== index);
    try {
      await updateTrainingPlan(selectedAthleteId, athlete.id, updatedTrainings);
      setTrainings(updatedTrainings);
      toast({
        title: "Success",
        description: "Training deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error deleting training:", error);
      toast({
        title: "Error",
        description: "Failed to delete training",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!athlete || athlete.id !== ADMIN_ATHLETE_ID) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>You don't have permission to access this page.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Training Plan Manager</Heading>

        <FormControl>
          <FormLabel>Select Athlete</FormLabel>
          <Select
            value={selectedAthleteId}
            onChange={handleAthleteChange}
            placeholder="Select athlete"
          >
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.name} ({athlete.id})
              </option>
            ))}
          </Select>
        </FormControl>

        {selectedAthleteId && (
          <>
            <Box borderWidth="1px" borderRadius="lg" p={6}>
              <Heading size="md" mb={4}>
                Add New Training
              </Heading>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={newTraining.title}
                    onChange={(e) =>
                      setNewTraining({ ...newTraining, title: e.target.value })
                    }
                    placeholder="e.g., Easy Run"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={newTraining.description}
                    onChange={(e) =>
                      setNewTraining({
                        ...newTraining,
                        description: e.target.value,
                      })
                    }
                    placeholder="Training description"
                  />
                </FormControl>

                <HStack spacing={4} width="100%">
                  <FormControl>
                    <FormLabel>Distance (meters)</FormLabel>
                    <NumberInput
                      value={newTraining.distance}
                      onChange={(value) =>
                        setNewTraining({
                          ...newTraining,
                          distance: parseInt(value),
                        })
                      }
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Time (minutes, optional)</FormLabel>
                    <NumberInput
                      value={newTraining.time}
                      onChange={(value) =>
                        setNewTraining({
                          ...newTraining,
                          time: value ? parseInt(value) : "",
                        })
                      }
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </HStack>

                <HStack spacing={4} width="100%">
                  <FormControl>
                    <FormLabel>Date</FormLabel>
                    <Input
                      type="date"
                      value={newTraining.day}
                      onChange={(e) =>
                        setNewTraining({ ...newTraining, day: e.target.value })
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={newTraining.type}
                      onChange={(e) =>
                        setNewTraining({ ...newTraining, type: e.target.value })
                      }
                    >
                      <option value="run">Run</option>
                      <option value="recovery">Recovery</option>
                      <option value="tempo">Tempo</option>
                      <option value="intervals">Intervals</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Intensity</FormLabel>
                    <Select
                      value={newTraining.intensity}
                      onChange={(e) =>
                        setNewTraining({
                          ...newTraining,
                          intensity: e.target.value,
                        })
                      }
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </Select>
                  </FormControl>
                </HStack>

                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="teal"
                  onClick={handleAddTraining}
                  alignSelf="flex-end"
                >
                  Add Training
                </Button>
              </VStack>
            </Box>

            <Box>
              <Heading size="md" mb={4}>
                Current Training Plan
              </Heading>
              {loading ? (
                <Flex justify="center" py={8}>
                  <Spinner />
                </Flex>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Title</Th>
                      <Th>Distance</Th>
                      <Th>Time</Th>
                      <Th>Type</Th>
                      <Th>Intensity</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {trainings.length === 0 ? (
                      <Tr>
                        <Td colSpan={7} textAlign="center">
                          No trainings added yet
                        </Td>
                      </Tr>
                    ) : (
                      trainings.map((training, index) => (
                        <Tr key={index}>
                          <Td>{new Date(training.day).toLocaleDateString()}</Td>
                          <Td>{training.title}</Td>
                          <Td>{training.distance}m</Td>
                          <Td>{training.time || "-"}</Td>
                          <Td>{training.type}</Td>
                          <Td>{training.intensity}</Td>
                          <Td>
                            <IconButton
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDeleteTraining(index)}
                              aria-label="Delete training"
                            />
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              )}
            </Box>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default TrainingPlanManager;
