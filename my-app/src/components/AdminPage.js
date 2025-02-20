import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Flex,
  IconButton,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";
import { database } from "../firebase-config";
import {
  ref,
  onValue,
  off,
  set,
  remove,
  update,
  push,
} from "firebase/database";
import Header from "./Header";
import { handleLogin } from "../utils/auth";
import { ChevronDownIcon, AddIcon } from "@chakra-ui/icons";
import {
  ADMIN_ATHLETE_ID,
  STATUS_OPTIONS,
  updateTrainingPlanRequestStatus,
} from "../utils/admin";
import TrainingPlanManager from "./TrainingPlanManager";
import { initializeSampleCosmetics } from "../utils/cosmetics";
import GroupsManager from "./GroupsManager";

const AdminPage = ({ athlete }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    athleteId: "",
    athleteName: "",
    email: "",
  });
  const [isResettingCosmetics, setIsResettingCosmetics] = useState(false);
  const [groups, setGroups] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!athlete || athlete.id !== ADMIN_ATHLETE_ID) {
      return;
    }

    // Set up real-time listener for requests
    const requestsRef = ref(database, "trainingPlanRequests");
    onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requestsData = snapshot.val();
        const requestsArray = Object.entries(requestsData).map(
          ([id, data]) => ({
            id,
            ...data,
          })
        );
        setRequests(requestsArray);
      } else {
        setRequests([]);
      }
      setLoading(false);
    });

    // Set up real-time listener for groups
    const groupsRef = ref(database, "groups");
    onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const groupsData = snapshot.val();
        const groupsArray = Object.entries(groupsData).map(([id, data]) => ({
          id,
          ...data,
          memberCount: data.members ? Object.keys(data.members).length : 0,
        }));
        setGroups(groupsArray);
      } else {
        setGroups([]);
      }
    });

    // Set up real-time listener for athletes
    const athletesRef = ref(database, "athleteActivitiesMeta");
    onValue(athletesRef, (snapshot) => {
      if (snapshot.exists()) {
        const athletesData = snapshot.val();
        const athletesArray = Object.entries(athletesData).map(
          ([id, data]) => ({
            id,
            ...data,
          })
        );
        setAthletes(athletesArray);
      } else {
        setAthletes([]);
      }
    });

    // Cleanup listeners
    return () => {
      off(requestsRef);
      off(groupsRef);
      off(athletesRef);
    };
  }, [athlete]);

  const handleStatusUpdate = async (requestId, newStatus) => {
    if (!athlete || athlete.id !== ADMIN_ATHLETE_ID) return;

    setUpdating(requestId);
    try {
      await updateTrainingPlanRequestStatus(requestId, newStatus, athlete.id);

      toast({
        title: "Status Updated",
        description: `Request status changed to ${newStatus}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleAddRequest = async () => {
    if (!athlete || athlete.id !== ADMIN_ATHLETE_ID) return;
    if (!newRequest.athleteId || !newRequest.athleteName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const requestRef = ref(
        database,
        `trainingPlanRequests/${newRequest.athleteId}`
      );
      await set(requestRef, {
        ...newRequest,
        status: "pending",
        requestDate: new Date().toISOString(),
      });

      toast({
        title: "Request Added",
        description: "Training plan request has been created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsAddModalOpen(false);
      setNewRequest({
        athleteId: "",
        athleteName: "",
        email: "",
      });
    } catch (error) {
      console.error("Error adding request:", error);
      toast({
        title: "Error",
        description: "Failed to add request. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleResetCosmetics = async () => {
    if (!athlete || athlete.id !== ADMIN_ATHLETE_ID) {
      toast({
        title: "Unauthorized",
        description: "Only admin can reset cosmetics",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsResettingCosmetics(true);
    try {
      // Delete all existing cosmetics
      await remove(ref(database, "cosmetics/items"));

      // Add sample cosmetics
      const success = await initializeSampleCosmetics();

      if (success) {
        toast({
          title: "Success",
          description: "Sample cosmetics have been reset",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to initialize sample cosmetics");
      }
    } catch (error) {
      console.error("Error resetting cosmetics:", error);
      toast({
        title: "Error",
        description: "Failed to reset cosmetics",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsResettingCosmetics(false);
    }
  };

  if (!athlete || athlete.id !== ADMIN_ATHLETE_ID) {
    return (
      <Box>
        <Header athlete={athlete} handleLogin={handleLogin} />
        <Container maxW="container.xl" py={8}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access this page.
            </AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Header athlete={athlete} handleLogin={handleLogin} />
      <Container maxW="container.xl" py={8}>
        <Tabs>
          <TabList>
            <Tab>Training Plan Manager</Tab>
            <Tab>
              Training Plan Requests{" "}
              {requests.filter((req) => req.status === "pending").length >
                0 && (
                <Badge ml={2} colorScheme="red" borderRadius="full">
                  {requests.filter((req) => req.status === "pending").length}
                </Badge>
              )}
            </Tab>
            <Tab>Groups</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <TrainingPlanManager athlete={athlete} />
            </TabPanel>
            <TabPanel>
              <Flex justify="space-between" align="center" mb={6}>
                <Heading>Training Plan Requests</Heading>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="teal"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Request
                </Button>
              </Flex>
              {loading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="xl" color="purple.500" />
                  <Text mt={4}>Loading requests...</Text>
                </Box>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Athlete</Th>
                        <Th>Email</Th>
                        <Th>Request Date</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {requests.map((request) => (
                        <Tr key={request.id}>
                          <Td>
                            <Box>
                              <Text fontWeight="medium">
                                {request.athleteName}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                ID: {request.athleteId}
                              </Text>
                            </Box>
                          </Td>
                          <Td>{request.email || "No email provided"}</Td>
                          <Td>
                            {new Date(request.requestDate).toLocaleString()}
                          </Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={Badge}
                                colorScheme={
                                  STATUS_OPTIONS.find(
                                    (s) => s.value === request.status
                                  )?.color
                                }
                                px={2}
                                py={1}
                                borderRadius="full"
                                cursor="pointer"
                                display="flex"
                                alignItems="center"
                                isLoading={updating === request.id}
                              >
                                {request.status}{" "}
                                <ChevronDownIcon ml={1} fontSize="1.1em" />
                              </MenuButton>
                              <MenuList>
                                {STATUS_OPTIONS.map((status) => (
                                  <MenuItem
                                    key={status.value}
                                    onClick={() =>
                                      handleStatusUpdate(
                                        request.id,
                                        status.value
                                      )
                                    }
                                  >
                                    {status.label}
                                  </MenuItem>
                                ))}
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                      {requests.length === 0 && !loading && (
                        <Tr>
                          <Td colSpan={4} textAlign="center" py={8}>
                            No training plan requests yet
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>
            <TabPanel>
              <GroupsManager groups={groups} athletes={athletes} />
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Add Request Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          size="md"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add Training Plan Request</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Athlete ID</FormLabel>
                  <Input
                    value={newRequest.athleteId}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        athleteId: e.target.value,
                      })
                    }
                    placeholder="Enter athlete ID"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Athlete Name</FormLabel>
                  <Input
                    value={newRequest.athleteName}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        athleteName: e.target.value,
                      })
                    }
                    placeholder="Enter athlete name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email (optional)</FormLabel>
                  <Input
                    value={newRequest.email}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter email address"
                    type="email"
                  />
                </FormControl>

                <Button
                  colorScheme="teal"
                  width="100%"
                  mt={4}
                  onClick={handleAddRequest}
                >
                  Add Request
                </Button>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Add this new section before the training plan requests section */}
        <Box mb={8} p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>
            Cosmetics Management
          </Heading>
          <Button
            colorScheme="purple"
            onClick={handleResetCosmetics}
            isLoading={isResettingCosmetics}
            loadingText="Resetting Cosmetics..."
          >
            Reset Sample Cosmetics
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminPage;
