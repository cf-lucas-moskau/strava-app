import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Avatar,
  useToast,
  Circle,
  HStack,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDownIcon, DownloadIcon, SettingsIcon } from "@chakra-ui/icons";
import ChestModal from "./ChestModal";
import { getUnseenAthletes } from "../utils/admin";
import { getUserProfile, getAvailableCosmetics } from "../utils/cosmetics";

const ADMIN_ATHLETE_ID = 32945540;

const Header = ({ handleLogin, athlete, logout, tokens = 0 }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [localTokens, setLocalTokens] = useState(tokens);
  const [hasUnseenAthletes, setHasUnseenAthletes] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const url = window.location.href;
  const isPaceCalculator = url.includes("pace-calculator");
  const [showChestModal, setShowChestModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [cosmetics, setCosmetics] = useState({});

  useEffect(() => {
    setLocalTokens(tokens);
  }, [tokens]);

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

  useEffect(() => {
    const checkUnseenAthletes = async () => {
      if (athlete?.id === ADMIN_ATHLETE_ID) {
        const unseenAthletes = await getUnseenAthletes();
        setHasUnseenAthletes(unseenAthletes.length > 0);
      }
    };

    checkUnseenAthletes();
    // Set up polling to check for unseen athletes every minute
    const interval = setInterval(checkUnseenAthletes, 60000);

    return () => clearInterval(interval);
  }, [athlete]);

  useEffect(() => {
    const fetchData = async () => {
      if (athlete?.id) {
        try {
          const [profile, availableCosmetics] = await Promise.all([
            getUserProfile(athlete.id),
            getAvailableCosmetics(),
          ]);
          setUserProfile(profile);
          setCosmetics(availableCosmetics);
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      }
    };
    fetchData();
  }, [athlete]);

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

  const getTokenDisplay = () => {
    if (
      !userProfile?.equipped?.tokenStyle ||
      !cosmetics[userProfile.equipped.tokenStyle]
    ) {
      return { icon: "⭐", name: "Stars" }; // Default token style
    }
    const style = cosmetics[userProfile.equipped.tokenStyle];
    return { icon: style.icon, name: style.tokenName };
  };

  const tokenDisplay = getTokenDisplay();

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
            {athlete && (
              <>
                <HStack spacing={4} mr={4}>
                  <Text fontWeight="medium">
                    {localTokens} {tokenDisplay.icon} {tokenDisplay.name}
                  </Text>
                  <Button
                    colorScheme="teal"
                    size="sm"
                    onClick={() => setShowChestModal(true)}
                  >
                    Open Chest
                  </Button>
                </HStack>
                {athlete.id === ADMIN_ATHLETE_ID && (
                  <Box position="relative">
                    <Button
                      onClick={() => navigate("/admin")}
                      leftIcon={<SettingsIcon />}
                      colorScheme="purple"
                      variant="solid"
                      size="md"
                    >
                      Admin
                    </Button>
                    {hasUnseenAthletes && (
                      <Circle
                        size="10px"
                        bg="red.500"
                        position="absolute"
                        top="-1"
                        right="-1"
                      />
                    )}
                  </Box>
                )}
              </>
            )}

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
                    as={Link}
                    to="/profile"
                    _hover={{ bg: "gray.50" }}
                    fontWeight="medium"
                    w="150px"
                  >
                    Profile
                  </MenuItem>
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

      {athlete && (
        <ChestModal
          isOpen={showChestModal}
          onClose={() => setShowChestModal(false)}
          tokens={localTokens}
          setTokens={setLocalTokens}
          athlete={athlete}
          tokenDisplay={tokenDisplay}
        />
      )}
    </Box>
  );
};

export default Header;
