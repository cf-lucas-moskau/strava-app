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
  ButtonGroup,
  Divider,
  Badge,
  Circle,
} from "@chakra-ui/react";
import {
  AddIcon,
  DeleteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { database } from "../firebase-config";
import { ref, onValue, off, get } from "firebase/database";
import {
  ADMIN_ATHLETE_ID,
  createTrainingPlan,
  updateTrainingPlan,
  getAthleteActivities,
  STATUS_OPTIONS,
} from "../utils/admin";
import Activity from "../components/Activity";

const TrainingPlanManager = ({ athlete }) => {
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [athletesData, setAthletesData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingActivities, setLoadingActivities] = useState(false);
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

    const requestsRef = ref(database, "trainingPlanRequests");
    const metaRef = ref(database, "athleteActivitiesMeta");

    // Listen for training plans, requests, and meta data
    const fetchData = async () => {
      try {
        const [requestsSnapshot, metaSnapshot] = await Promise.all([
          get(requestsRef),
          get(metaRef),
        ]);

        if (requestsSnapshot.exists()) {
          const requests = requestsSnapshot.val();
          const meta = metaSnapshot.exists() ? metaSnapshot.val() : {};

          const athletesList = Object.entries(requests).map(([id, data]) => {
            const athleteMeta = meta[id] || {};
            const lastSeenByAdmin = athleteMeta.lastSeenByAdmin
              ? new Date(athleteMeta.lastSeenByAdmin)
              : new Date(0);
            const lastUpdated = athleteMeta.lastUpdated
              ? new Date(athleteMeta.lastUpdated)
              : new Date(0);

            return {
              id,
              name: data.athleteName,
              status: data.status,
              lastUpdated: lastUpdated,
              hasNewActivities: lastUpdated > lastSeenByAdmin,
              activityCount: athleteMeta.count || 0,
            };
          });

          setAthletesData(athletesList);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [athlete]);

  useEffect(() => {
    if (!selectedAthleteId) return;

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
        setAthletesData(athletesList);
      }
    });

    return () => {
      off(trainingPlansRef);
      off(requestsRef);
    };
  }, [selectedAthleteId]);

  useEffect(() => {
    const fetchAthleteActivities = async () => {
      if (!selectedAthleteId) return;

      setLoadingActivities(true);
      try {
        const result = await getAthleteActivities(
          selectedAthleteId,
          currentPage,
          itemsPerPage
        );
        setActivities(result.activities);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error("Error fetching athlete activities:", error);
        toast({
          title: "Error",
          description: "Failed to fetch athlete activities",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchAthleteActivities();
  }, [selectedAthleteId, currentPage, itemsPerPage, toast]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
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

  // Add this new function to generate page numbers
  const getPageNumbers = (currentPage, totalPages) => {
    const delta = 2; // Number of pages to show before and after current page
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
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

        <Box>
          <Heading size="md" mb={4}>
            Athletes
          </Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Athlete</Th>
                <Th>Status</Th>
                <Th>Activities</Th>
                <Th>Last Update</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {athletesData.map((athleteData) => (
                <Tr
                  key={athleteData.id}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => setSelectedAthleteId(athleteData.id)}
                  bg={
                    selectedAthleteId === athleteData.id ? "blue.50" : undefined
                  }
                >
                  <Td>
                    <Flex align="center" gap={2}>
                      {athleteData.name}
                      {athleteData.hasNewActivities && (
                        <Circle size="8px" bg="red.500" />
                      )}
                    </Flex>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        STATUS_OPTIONS.find(
                          (s) => s.value === athleteData.status
                        )?.color
                      }
                    >
                      {athleteData.status}
                    </Badge>
                  </Td>
                  <Td>{athleteData.activityCount}</Td>
                  <Td>
                    {athleteData.lastUpdated
                      ? `${new Date(
                          athleteData.lastUpdated
                        ).toLocaleDateString()} ${new Date(
                          athleteData.lastUpdated
                        ).toLocaleTimeString()}`
                      : "Never"}
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAthleteId(athleteData.id);
                      }}
                    >
                      View Plan
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

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

            <Divider my={8} />

            <Box>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Athlete Activities</Heading>
                <HStack spacing={4}>
                  <Text>Items per page:</Text>
                  <Select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    width="100px"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                </HStack>
              </Flex>

              {loadingActivities ? (
                <Flex justify="center" py={8}>
                  <Spinner />
                </Flex>
              ) : (
                <>
                  <VStack spacing={4} align="stretch">
                    {activities.length === 0 ? (
                      <Text textAlign="center" py={8} color="gray.500">
                        No activities found
                      </Text>
                    ) : (
                      activities.map((activity) => (
                        <Activity
                          key={activity.id}
                          activity={activity}
                          loadSingleActivity={() => {}} // Empty function since we don't need navigation in admin view
                        />
                      ))
                    )}
                  </VStack>

                  {totalPages > 0 && (
                    <Flex justify="center" mt={4}>
                      <ButtonGroup variant="outline" spacing={2}>
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          onClick={() => handlePageChange(currentPage - 1)}
                          isDisabled={currentPage === 1 || loadingActivities}
                          aria-label="Previous page"
                        />
                        {getPageNumbers(currentPage, totalPages).map(
                          (page, index) =>
                            page === "..." ? (
                              <Text
                                key={`ellipsis-${index}`}
                                alignSelf="center"
                                mx={2}
                                color="gray.500"
                              >
                                ...
                              </Text>
                            ) : (
                              <Button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                colorScheme={
                                  currentPage === page ? "blue" : "gray"
                                }
                                variant={
                                  currentPage === page ? "solid" : "outline"
                                }
                                isDisabled={loadingActivities}
                              >
                                {page}
                              </Button>
                            )
                        )}
                        <IconButton
                          icon={<ChevronRightIcon />}
                          onClick={() => handlePageChange(currentPage + 1)}
                          isDisabled={
                            currentPage === totalPages || loadingActivities
                          }
                          aria-label="Next page"
                        />
                      </ButtonGroup>
                    </Flex>
                  )}
                </>
              )}
            </Box>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default TrainingPlanManager;
