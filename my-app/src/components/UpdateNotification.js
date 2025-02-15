import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Box,
  useToast,
} from "@chakra-ui/react";

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Listen for service worker updates
    const handleServiceWorkerUpdate = (event) => {
      if (event.data?.type === "APP_UPDATE") {
        setShowUpdate(true);
        toast({
          title: "Update Available",
          description:
            "A new version of the app is available. Please refresh to update.",
          status: "info",
          duration: null,
          isClosable: true,
          position: "top",
        });
      }
    };

    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerUpdate
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerUpdate
      );
    };
  }, [toast]);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <Box position="fixed" bottom={4} right={4} zIndex={9999}>
      <Alert
        status="info"
        variant="solid"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        borderRadius="md"
        p={4}
      >
        <AlertIcon boxSize="24px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="md">
          Update Available
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          A new version of the app is available.
        </AlertDescription>
        <Button colorScheme="blue" size="sm" mt={4} onClick={handleRefresh}>
          Refresh to Update
        </Button>
      </Alert>
    </Box>
  );
};

export default UpdateNotification;
