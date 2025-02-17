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
} from "@chakra-ui/react";
import { database } from "../firebase-config";
import { ref, onValue, off, set } from "firebase/database";
import Header from "./Header";
import { handleLogin } from "../utils/auth";
import { ChevronDownIcon, AddIcon } from "@chakra-ui/icons";
import {
  ADMIN_ATHLETE_ID,
  STATUS_OPTIONS,
  updateTrainingPlanRequestStatus,
} from "../utils/admin";
import TrainingPlanManager from "./TrainingPlanManager";

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
  const toast = useToast();

  useEffect(() => {
    if (!athlete || athlete.id !== ADMIN_ATHLETE_ID) {
      return;
    }

    const requestsRef = ref(database, "trainingPlanRequests");
    console.log("Setting up listener for training plan requests");

    onValue(
      requestsRef,
      (snapshot) => {
        console.log("Received snapshot:", snapshot.val());
        if (snapshot.exists()) {
          const requestsData = snapshot.val();
          const requestsArray = Object.entries(requestsData).map(
            ([id, data]) => ({
              id,
              ...data,
            })
          );
          requestsArray.sort(
            (a, b) => new Date(b.requestDate) - new Date(a.requestDate)
          );
          console.log("Processed requests:", requestsArray);
          setRequests(requestsArray);
        } else {
          console.log("No requests found in snapshot");
          setRequests([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up listener");
      off(requestsRef);
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
            <Tab>Training Plan Requests</Tab>
            <Tab>Training Plan Manager</Tab>
          </TabList>

          <TabPanels>
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
              <TrainingPlanManager athlete={athlete} />
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
      </Container>
    </Box>
  );
};

export default AdminPage;
