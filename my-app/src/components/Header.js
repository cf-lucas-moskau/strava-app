import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Avatar,
  useToast,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { ChevronDownIcon, DownloadIcon } from "@chakra-ui/icons";

const Header = ({ handleLogin, athlete, logout }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const toast = useToast();
  const url = window.location.href;
  const isPaceCalculator = url.includes("pace-calculator");

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Installation not available",
        description:
          "Your browser or device might not support app installation, or the app might already be installed.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast({
        title: "Thanks for installing!",
        description: "The app has been added to your home screen.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  return (
    <Box
      as="nav"
      bg="white"
      boxShadow="sm"
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <Flex
        maxWidth="1200px"
        margin="0 auto"
        justify="space-between"
        align="center"
        height="70px"
        px={4}
      >
        {/* Logo or Site Title */}
        <Link to="/">
          <Image
            src={"icon.png"}
            alt="logo"
            height="40px"
            objectFit="contain"
          />
        </Link>

        {/* Right Side - Buttons */}
        {!isPaceCalculator && (
          <Flex align="center" gap={6}>
            <Button
              as={Link}
              to="/pace-calculator"
              colorScheme="teal"
              size="md"
              px={6}
              width="200px"
            >
              Pace Calculator
            </Button>

            {deferredPrompt && (
              <Button
                onClick={handleInstallClick}
                leftIcon={<DownloadIcon />}
                colorScheme="orange"
                variant="outline"
                size="md"
              >
                Install App
              </Button>
            )}

            {athlete ? (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  _hover={{ bg: "gray.50" }}
                  _active={{ bg: "gray.100" }}
                  height="48px"
                  px={2}
                >
                  <Flex align="center" gap={3}>
                    <Avatar
                      size="sm"
                      src={athlete.profile}
                      name={athlete.firstname}
                      boxSize="32px"
                    />
                    <Text fontWeight="medium">{athlete.firstname}</Text>
                    <ChevronDownIcon color="gray.500" />
                  </Flex>
                </MenuButton>
                <MenuList shadow="lg" minW="unset" w="160px">
                  <MenuItem
                    onClick={logout}
                    _hover={{ bg: "gray.50" }}
                    fontWeight="medium"
                    color="red.500"
                    w="125px"
                  >
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                onClick={handleLogin}
                colorScheme="orange"
                size="md"
                px={6}
              >
                Login with Strava
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
