import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { database } from "../firebase-config";
import { ref, set, get } from "firebase/database";

const RequestTrainingPlan = ({ athlete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!athlete?.id) return;

      try {
        const snapshot = await get(
          ref(database, `trainingPlanRequests/${athlete.id}`)
        );
        if (snapshot.exists()) {
          const request = snapshot.val();
          setExistingRequest(request);
          setIsRequested(true);
        }
      } catch (error) {
        console.error("Error checking existing request:", error);
      }
    };

    checkExistingRequest();
  }, [athlete?.id]);

  const handleRequest = async () => {
    if (!athlete?.id) return;

    // Double check for existing request before submitting
    try {
      const snapshot = await get(
        ref(database, `trainingPlanRequests/${athlete.id}`)
      );
      if (snapshot.exists()) {
        setExistingRequest(snapshot.val());
        setIsRequested(true);
        toast({
          title: "Request Already Exists",
          description: "You have already submitted a training plan request.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    } catch (error) {
      console.error("Error checking existing request:", error);
    }

    setIsSubmitting(true);
    try {
      // Create request data object with required fields
      const requestData = {
        athleteId: athlete.id,
        athleteName: `${athlete.firstname || ""} ${
          athlete.lastname || ""
        }`.trim(),
        requestDate: new Date().toISOString(),
        status: "pending",
      };

      // Only add email if it exists
      if (athlete.email) {
        requestData.email = athlete.email;
      }

      await set(
        ref(database, `trainingPlanRequests/${athlete.id}`),
        requestData
      );

      setIsRequested(true);
      setExistingRequest(requestData);
      toast({
        title: "Request Sent",
        description: "Your training plan request has been submitted.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error requesting training plan:", error);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRequested && existingRequest) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <VStack align="start" spacing={2}>
          <Text>You have already submitted a training plan request.</Text>
          <Text fontSize="sm" color="gray.600">
            Status: <strong>{existingRequest.status}</strong>
            {existingRequest.status === "pending" &&
              " - We'll review your request soon!"}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Requested on:{" "}
            {new Date(existingRequest.requestDate).toLocaleDateString()}
          </Text>
        </VStack>
      </Alert>
    );
  }

  return (
    <Box
      maxW="600px"
      mx="auto"
      p={8}
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      boxShadow="sm"
    >
      <VStack spacing={6} align="stretch">
        <Text fontSize="xl" fontWeight="bold" textAlign="center">
          No Training Plan Yet?
        </Text>
        <Text textAlign="center" color="gray.600">
          Get a personalized training plan tailored to your goals and current
          fitness level.
        </Text>
        <Button
          colorScheme="teal"
          size="lg"
          onClick={handleRequest}
          isLoading={isSubmitting}
          loadingText="Submitting Request..."
        >
          Request Training Plan
        </Button>
      </VStack>
    </Box>
  );
};

export default RequestTrainingPlan;
