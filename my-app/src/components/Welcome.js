import React from "react";
import { Box, Button, Heading, Text } from "@chakra-ui/react";

const Welcome = ({ handleLogin }) => {
  return (
    <Box maxWidth="1200px" margin="0 auto" px={6} py={20} textAlign="center">
      <Heading as="h1" size="2xl" mb={6} color="gray.800">
        Welcome to Strava Training App
      </Heading>
      <Text fontSize="xl" color="gray.600" mb={12} maxWidth="800px" mx="auto">
        Connect with Strava to track your runs, follow training plans, and earn
        achievements.
      </Text>
      <Button
        onClick={handleLogin}
        colorScheme="orange"
        size="lg"
        px={8}
        py={6}
        fontSize="lg"
      >
        Login with Strava
      </Button>
    </Box>
  );
};

export default Welcome;
