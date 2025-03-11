import React, { useState, useEffect, useRef } from "react";
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
  Grid,
  GridItem,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Switch,
  Collapse,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  Center,
  Skeleton,
  Progress,
  Code,
} from "@chakra-ui/react";
import {
  AddIcon,
  DeleteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  CheckIcon,
  InfoOutlineIcon,
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
    day: new Date().toISOString().split("T")[0],
    type: "run",
    intensity: "medium",
  });

  // AI suggestion state
  const [promptText, setPromptText] = useState("");
  const [generatedTrainings, setGeneratedTrainings] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTraining, setEditingTraining] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [previousTrainings, setPreviousTrainings] = useState([]);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Modal state
  const {
    isOpen: isPromptSummaryOpen,
    onOpen: onPromptSummaryOpen,
    onClose: onPromptSummaryClose,
  } = useDisclosure();

  const promptSummaryRef = useRef("");
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

  // Fetch previous trainings when athlete is selected
  useEffect(() => {
    if (selectedAthleteId) {
      fetchPreviousTrainings();
    }
  }, [selectedAthleteId]);

  const fetchPreviousTrainings = async () => {
    try {
      const db = database;
      const trainingPlansRef = ref(db, `trainingPlans/${selectedAthleteId}`);
      const snapshot = await get(trainingPlansRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.trainings && Array.isArray(data.trainings)) {
          // Sort trainings by date descending and take most recent 30
          const sortedTrainings = [...data.trainings]
            .sort((a, b) => new Date(b.day) - new Date(a.day))
            .slice(0, 30);

          setPreviousTrainings(sortedTrainings);
        } else {
          setPreviousTrainings([]);
        }
      } else {
        setPreviousTrainings([]);
      }
    } catch (error) {
      console.error("Error fetching previous trainings:", error);
      setPreviousTrainings([]);
    }
  };

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

  const generateTrainingSuggestion = async () => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for the training suggestion",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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

    // Prepare AI prompt with previous trainings if requested
    let trainingHistory = "";
    if (showHistory && previousTrainings.length > 0) {
      trainingHistory = previousTrainings
        .map(
          (t) =>
            `${t.day}: ${t.title} (${t.type}, ${t.intensity}, ${(
              t.distance / 1000
            ).toFixed(1)}km)`
        )
        .join("\n");
    }

    // Create the full prompt for the model
    const selectedAthlete = athletesData.find(
      (a) => a.id === selectedAthleteId
    );
    const systemPrompt = `You are an expert running coach who creates structured weekly training plans. 
              
    Your task is to create a week of training (6-9 sessions) based on the athlete's goals. 
    
    Always format your response as a valid JSON array of training objects.
    Each training object must have these fields:
    - title: short descriptive title
    - description: detailed instructions for the workout
    - distance: in meters (numeric)
    - day: date in YYYY-MM-DD format, starting from today and spanning a week
    - type: one of: "run", "tempo", "interval", "recovery"
    - intensity: one of: "easy", "medium", "hard"
    
    Ensure the weekly training plan:
    1. Follows a sensible structure with recovery days between hard workouts
    2. Includes variety in training types (easy runs, intervals, tempos, etc.)
    3. Precisely matches the athlete's requested total weekly distance
    4. Includes any specific workouts the athlete has requested
    5. Distributes training load appropriately (e.g., more rest before/after key sessions)
    
    Do not include ANY text outside of the JSON array.`;

    const userPrompt = `Create a week of training for athlete ${
      selectedAthlete?.name || selectedAthleteId
    }.
    
    My requirements: ${promptText}
    
    Today's date is ${new Date().toISOString().split("T")[0]}.
    Generate 6-9 training sessions spanning the next 7 days.
    
    ${
      showHistory && previousTrainings.length > 0
        ? `Here are the athlete's ${previousTrainings.length} most recent training sessions (for context on their typical training patterns):\n\n${trainingHistory}`
        : ""
    }`;

    // Store prompt for summary
    promptSummaryRef.current = {
      system: systemPrompt,
      user: userPrompt,
    };

    // Show prompt summary modal
    onPromptSummaryOpen();

    setIsGenerating(true);
    setGenerationProgress(10); // Start progress

    try {
      // Get OpenRouter API key from your environment or a secure storage
      const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;

      if (!apiKey) {
        throw new Error("OpenRouter API key not found");
      }

      setGenerationProgress(30); // Indicate progress

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.href, // Required by OpenRouter
            "X-Title": "Strava Training Plan Manager", // Optional
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
          }),
        }
      );

      setGenerationProgress(70); // Indicate progress

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content;

      if (!aiContent) {
        throw new Error("No content returned from AI");
      }

      setGenerationProgress(85); // Indicate progress

      // Extract JSON from the response (handle potential formatting issues)
      let jsonMatch;
      try {
        // First try to parse the whole response as JSON
        const parsedTrainings = JSON.parse(aiContent);
        jsonMatch = Array.isArray(parsedTrainings)
          ? parsedTrainings
          : [parsedTrainings];
      } catch (e) {
        // If that fails, try to extract JSON using regex
        const jsonRegex = /\[[\s\S]*\]/;
        const match = aiContent.match(jsonRegex);
        if (match) {
          jsonMatch = JSON.parse(match[0]);
        } else {
          throw new Error("Could not extract valid JSON from AI response");
        }
      }

      // Validate the generated trainings (remove time field)
      const validatedTrainings = jsonMatch.map((training) => ({
        title: training.title || "AI Generated Training",
        description: training.description || "",
        distance: parseInt(training.distance) || 5000,
        day: training.day || new Date().toISOString().split("T")[0],
        type: ["run", "tempo", "interval", "recovery"].includes(training.type)
          ? training.type
          : "run",
        intensity: ["easy", "medium", "hard"].includes(training.intensity)
          ? training.intensity
          : "medium",
      }));

      // Calculate total distance
      const totalDistance = validatedTrainings.reduce(
        (sum, training) => sum + training.distance,
        0
      );

      // Sort by date
      validatedTrainings.sort((a, b) => new Date(a.day) - new Date(b.day));

      setGenerationProgress(100); // Complete progress
      setGeneratedTrainings(validatedTrainings);

      toast({
        title: "Success",
        description: `Generated ${
          validatedTrainings.length
        } workouts totaling ${(totalDistance / 1000).toFixed(1)}km`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error generating training suggestion:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate training suggestion",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const startEditingTraining = (index) => {
    setEditingIndex(index);
    setEditingTraining({ ...generatedTrainings[index] });
  };

  const saveEditedTraining = () => {
    if (editingIndex === null || !editingTraining) return;

    const updatedTrainings = [...generatedTrainings];
    updatedTrainings[editingIndex] = editingTraining;
    setGeneratedTrainings(updatedTrainings);
    setEditingIndex(null);
    setEditingTraining(null);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingTraining(null);
  };

  const removeGeneratedTraining = (index) => {
    const updatedTrainings = [...generatedTrainings];
    updatedTrainings.splice(index, 1);
    setGeneratedTrainings(updatedTrainings);
  };

  const acceptGeneratedTrainings = async () => {
    if (!generatedTrainings || generatedTrainings.length === 0) return;

    try {
      const updatedTrainings = [...trainings, ...generatedTrainings];

      if (trainings.length === 0) {
        await createTrainingPlan(
          selectedAthleteId,
          athlete.id,
          generatedTrainings
        );
      } else {
        await updateTrainingPlan(
          selectedAthleteId,
          athlete.id,
          updatedTrainings
        );
      }

      setTrainings(updatedTrainings);
      setGeneratedTrainings(null);
      setPromptText("");

      toast({
        title: "Success",
        description: `Added ${generatedTrainings.length} workouts to the training plan`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding AI-generated trainings:", error);
      toast({
        title: "Error",
        description: "Failed to add AI-generated trainings",
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
    <Container maxW="container.xl" py={5}>
      <VStack spacing={5} align="stretch">
        <Heading as="h1" size="xl">
          Training Plan Manager
        </Heading>

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
            <Box p={5} borderWidth="1px" borderRadius="lg">
              <Heading as="h3" size="md" mb={4}>
                Athlete Training Plan
              </Heading>

              <FormControl mb={4}>
                <FormLabel>Select Athlete</FormLabel>
                <Select
                  placeholder="Select athlete"
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                >
                  {athletesData.map((athleteData) => (
                    <option key={athleteData.id} value={athleteData.id}>
                      {athleteData.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* AI Training Suggestion */}
              <Box
                mt={6}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                bg="gray.50"
              >
                <Heading as="h4" size="sm" mb={3}>
                  Generate AI Weekly Training Plan
                </Heading>

                <FormControl mb={3}>
                  <FormLabel>Weekly Training Requirements</FormLabel>
                  <Textarea
                    placeholder="Describe your training goals for the week (e.g., 'I want to run 120km this week with 3 key sessions: Tuesday 6×1 mile intervals, Saturday marathon-specific long run, and Thursday hill repeats')"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={4}
                  />
                </FormControl>

                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                  <FormControl display="flex" alignItems="center" width="auto">
                    <FormLabel htmlFor="include-history" mb="0" fontSize="sm">
                      Include training history
                    </FormLabel>
                    <Switch
                      id="include-history"
                      isChecked={showHistory}
                      onChange={(e) => setShowHistory(e.target.checked)}
                    />
                    <Tooltip
                      label="Include the athlete's previous training patterns to help the AI understand their routine"
                      fontSize="sm"
                    >
                      <Box as="span" ml={1}>
                        <InfoOutlineIcon />
                      </Box>
                    </Tooltip>
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    isLoading={isGenerating}
                    loadingText="Generating Plan..."
                    onClick={generateTrainingSuggestion}
                  >
                    Generate Weekly Plan
                  </Button>
                </Flex>

                {isGenerating && (
                  <Box
                    mb={6}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="white"
                  >
                    <Center flexDirection="column" py={8}>
                      <Text fontSize="lg" fontWeight="bold" mb={3}>
                        Creating your perfect training week...
                      </Text>
                      <Box w="100%" mb={4}>
                        <Progress
                          value={generationProgress}
                          size="sm"
                          colorScheme="blue"
                          hasStripe
                          isAnimated
                          borderRadius="full"
                        />
                      </Box>
                      <Text fontSize="sm" color="gray.500">
                        Analyzing training patterns and optimizing workouts...
                      </Text>
                    </Center>
                  </Box>
                )}

                {generatedTrainings && (
                  <Box
                    mt={4}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="white"
                  >
                    <Heading as="h5" size="xs" mb={2}>
                      Weekly Training Plan
                    </Heading>

                    <Flex justify="space-between" align="center" mb={3}>
                      <Text fontWeight="bold">
                        {generatedTrainings.length} workouts
                      </Text>
                      <Text fontSize="sm">
                        Total:{" "}
                        {(
                          generatedTrainings.reduce(
                            (sum, t) => sum + t.distance,
                            0
                          ) / 1000
                        ).toFixed(1)}{" "}
                        km
                      </Text>
                    </Flex>

                    <Divider mb={3} />

                    {/* Workouts list */}
                    <VStack
                      spacing={2}
                      align="stretch"
                      maxHeight="400px"
                      overflowY="auto"
                    >
                      {generatedTrainings.map((training, index) => (
                        <Box
                          key={index}
                          p={2}
                          borderWidth="1px"
                          borderRadius="md"
                          borderLeftWidth="4px"
                          borderLeftColor={
                            training.intensity === "hard"
                              ? "red.400"
                              : training.intensity === "medium"
                              ? "orange.400"
                              : "green.400"
                          }
                        >
                          {editingIndex === index ? (
                            // Editing mode
                            <VStack align="stretch" spacing={2}>
                              <FormControl>
                                <FormLabel fontSize="xs">Title</FormLabel>
                                <Input
                                  size="sm"
                                  value={editingTraining.title}
                                  onChange={(e) =>
                                    setEditingTraining({
                                      ...editingTraining,
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </FormControl>

                              <Flex gap={2}>
                                <FormControl>
                                  <FormLabel fontSize="xs">Date</FormLabel>
                                  <Input
                                    size="sm"
                                    type="date"
                                    value={editingTraining.day}
                                    onChange={(e) =>
                                      setEditingTraining({
                                        ...editingTraining,
                                        day: e.target.value,
                                      })
                                    }
                                  />
                                </FormControl>

                                <FormControl>
                                  <FormLabel fontSize="xs">
                                    Distance (m)
                                  </FormLabel>
                                  <NumberInput
                                    size="sm"
                                    value={editingTraining.distance}
                                    min={1000}
                                    step={500}
                                    onChange={(value) =>
                                      setEditingTraining({
                                        ...editingTraining,
                                        distance: parseInt(value),
                                      })
                                    }
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                </FormControl>
                              </Flex>

                              <Flex gap={2}>
                                <FormControl>
                                  <FormLabel fontSize="xs">Type</FormLabel>
                                  <Select
                                    size="sm"
                                    value={editingTraining.type}
                                    onChange={(e) =>
                                      setEditingTraining({
                                        ...editingTraining,
                                        type: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="run">Run</option>
                                    <option value="tempo">Tempo</option>
                                    <option value="interval">Interval</option>
                                    <option value="recovery">Recovery</option>
                                  </Select>
                                </FormControl>

                                <FormControl>
                                  <FormLabel fontSize="xs">Intensity</FormLabel>
                                  <Select
                                    size="sm"
                                    value={editingTraining.intensity}
                                    onChange={(e) =>
                                      setEditingTraining({
                                        ...editingTraining,
                                        intensity: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                  </Select>
                                </FormControl>
                              </Flex>

                              <FormControl>
                                <FormLabel fontSize="xs">Description</FormLabel>
                                <Textarea
                                  size="sm"
                                  value={editingTraining.description}
                                  onChange={(e) =>
                                    setEditingTraining({
                                      ...editingTraining,
                                      description: e.target.value,
                                    })
                                  }
                                  rows={2}
                                />
                              </FormControl>

                              <Flex justify="flex-end" gap={2}>
                                <Button size="xs" onClick={cancelEditing}>
                                  Cancel
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  leftIcon={<CheckIcon />}
                                  onClick={saveEditedTraining}
                                >
                                  Save
                                </Button>
                              </Flex>
                            </VStack>
                          ) : (
                            // Display mode
                            <>
                              <Flex justify="space-between" align="center">
                                <Text fontWeight="bold">
                                  {new Date(training.day).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                  : {training.title}
                                </Text>
                                <Flex align="center">
                                  <Badge
                                    colorScheme={
                                      training.type === "interval"
                                        ? "red"
                                        : training.type === "tempo"
                                        ? "orange"
                                        : training.type === "recovery"
                                        ? "green"
                                        : "blue"
                                    }
                                    mr={2}
                                  >
                                    {training.type}
                                  </Badge>
                                  <Text fontSize="sm" mr={2}>
                                    {(training.distance / 1000).toFixed(1)} km
                                  </Text>
                                  <IconButton
                                    icon={<EditIcon />}
                                    size="xs"
                                    variant="ghost"
                                    aria-label="Edit training"
                                    onClick={() => startEditingTraining(index)}
                                    mr={1}
                                  />
                                  <IconButton
                                    icon={<DeleteIcon />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    aria-label="Remove training"
                                    onClick={() =>
                                      removeGeneratedTraining(index)
                                    }
                                  />
                                </Flex>
                              </Flex>

                              <Text
                                fontSize="sm"
                                mt={1}
                                noOfLines={2}
                                title={training.description}
                              >
                                {training.description}
                              </Text>
                            </>
                          )}
                        </Box>
                      ))}
                    </VStack>

                    <Button
                      mt={4}
                      colorScheme="green"
                      onClick={acceptGeneratedTrainings}
                      width="full"
                    >
                      Accept and Add All Workouts
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Manual Training Input */}
              <Box mt={6} p={4} borderWidth="1px" borderRadius="md">
                <Heading as="h4" size="sm" mb={3}>
                  Add Training Manually
                </Heading>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <GridItem>
                    <FormControl mb={3}>
                      <FormLabel>Title</FormLabel>
                      <Input
                        value={newTraining.title}
                        onChange={(e) =>
                          setNewTraining({
                            ...newTraining,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g. Long Run"
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl mb={3}>
                      <FormLabel>Date</FormLabel>
                      <Input
                        type="date"
                        value={newTraining.day}
                        onChange={(e) =>
                          setNewTraining({
                            ...newTraining,
                            day: e.target.value,
                          })
                        }
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl mb={3}>
                      <FormLabel>Distance (m)</FormLabel>
                      <NumberInput
                        value={newTraining.distance}
                        onChange={(value) =>
                          setNewTraining({
                            ...newTraining,
                            distance: Number(value),
                          })
                        }
                        min={1000}
                        step={1000}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl mb={3}>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={newTraining.type}
                        onChange={(e) =>
                          setNewTraining({
                            ...newTraining,
                            type: e.target.value,
                          })
                        }
                      >
                        <option value="run">Run</option>
                        <option value="tempo">Tempo</option>
                        <option value="interval">Interval</option>
                        <option value="recovery">Recovery</option>
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl mb={3}>
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
                  </GridItem>

                  <GridItem colSpan={{ base: 1, md: 2 }}>
                    <FormControl mb={3}>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        value={newTraining.description}
                        onChange={(e) =>
                          setNewTraining({
                            ...newTraining,
                            description: e.target.value,
                          })
                        }
                        placeholder="Detailed instructions for the training"
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <Button colorScheme="teal" onClick={handleAddTraining} mt={2}>
                  Add Training
                </Button>
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
                            <Td>
                              {new Date(training.day).toLocaleDateString()}
                            </Td>
                            <Td>{training.title}</Td>
                            <Td>{training.distance}m</Td>
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
            </Box>
          </>
        )}
      </VStack>

      {/* Prompt Summary Modal */}
      <Modal
        isOpen={isPromptSummaryOpen}
        onClose={onPromptSummaryClose}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>AI Prompt Summary</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2} fontWeight="medium">
              Here's what's being sent to the AI:
            </Text>

            <Accordion defaultIndex={[0]} allowMultiple>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      System Prompt (Instructions to AI)
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} bg="gray.50">
                  <Code
                    p={2}
                    borderRadius="md"
                    whiteSpace="pre-wrap"
                    w="100%"
                    display="block"
                  >
                    {promptSummaryRef.current?.system || ""}
                  </Code>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      User Prompt (Your Requirements)
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} bg="gray.50">
                  <Code
                    p={2}
                    borderRadius="md"
                    whiteSpace="pre-wrap"
                    w="100%"
                    display="block"
                  >
                    {promptSummaryRef.current?.user || ""}
                  </Code>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onPromptSummaryClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default TrainingPlanManager;
