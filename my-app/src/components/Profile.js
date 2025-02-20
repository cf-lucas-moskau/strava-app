import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  Text,
  Grid,
  Badge,
  Button,
  useToast,
  Heading,
  Flex,
  Avatar,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import {
  getUserProfile,
  getAvailableCosmetics,
  equipCosmetic,
  unequipCosmetic,
  COSMETIC_TYPES,
  RARITY_LEVELS,
} from "../utils/cosmetics";
import { achievementsList } from "../utils/achievements";
import { calculateAchievementProgress } from "../utils/achievementCalculator";
import AchievementsDisplay from "./AchievementsDisplay";

const CosmeticItem = ({ item, isEquipped, onEquip, onUnequip }) => {
  const rarityData = RARITY_LEVELS[item.rarity];

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      cursor="pointer"
      position="relative"
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", shadow: "md" }}
      bg={isEquipped ? `${rarityData.color}50` : "white"}
    >
      <VStack spacing={2}>
        <Image
          src={item.preview}
          alt={item.name}
          boxSize="100px"
          objectFit="contain"
        />
        <Text fontWeight="bold">{item.name}</Text>
        <Badge colorScheme={rarityData.color.split(".")[0]}>
          {rarityData.name}
        </Badge>
        <Button
          size="sm"
          colorScheme={isEquipped ? "red" : "blue"}
          onClick={() => (isEquipped ? onUnequip() : onEquip())}
        >
          {isEquipped ? "Unequip" : "Equip"}
        </Button>
      </VStack>
    </Box>
  );
};

const Profile = ({ athlete, activities }) => {
  const [profile, setProfile] = useState({
    inventory: {},
    equipped: {
      profileFrame: null,
      background: null,
      activityTheme: null,
      tokenStyle: null,
    },
  });
  const [cosmetics, setCosmetics] = useState({});
  const [loading, setLoading] = useState(true);
  const [userAchievements, setUserAchievements] = useState({});
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!athlete?.id) {
        console.log("No athlete ID available, skipping profile fetch");
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log("Starting profile data fetch for athlete:", athlete.id);
      try {
        console.log("Fetching profile and cosmetics data...");
        const [profile, availableCosmetics] = await Promise.all([
          getUserProfile(athlete.id, athlete),
          getAvailableCosmetics(),
        ]);

        console.log("Data fetch complete:", {
          profileReceived: !!profile,
          cosmeticsReceived: !!availableCosmetics,
          profileData: profile,
          cosmeticsCount: Object.keys(availableCosmetics || {}).length,
        });

        if (profile) {
          console.log("Setting profile state:", profile);
          setProfile(profile);
        }
        if (availableCosmetics) {
          console.log("Setting cosmetics state:", {
            count: Object.keys(availableCosmetics).length,
            types: Object.values(availableCosmetics).map((c) => c.type),
          });
          setCosmetics(availableCosmetics);
        }
      } catch (error) {
        console.error("Error in Profile fetchData:", error);
        console.error("Error details:", {
          athleteId: athlete.id,
          errorMessage: error.message,
          errorStack: error.stack,
        });
        toast({
          title: "Error",
          description: "Failed to load profile data",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        console.log("Setting loading state to false");
        setLoading(false);
      }
    };

    fetchData();
  }, [athlete, toast]);

  // Calculate achievements when activities change
  useEffect(() => {
    if (activities && athlete) {
      const progress = calculateAchievementProgress(activities);
      setUserAchievements(progress);
    }
  }, [activities, athlete]);

  const handleEquip = async (type, itemId) => {
    try {
      await equipCosmetic(athlete.id, type, itemId);
      setProfile((prev) => ({
        ...prev,
        equipped: {
          ...prev.equipped,
          [type]: itemId,
        },
      }));
      toast({
        title: "Success",
        description: "Item equipped successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error equipping item:", error);
      toast({
        title: "Error",
        description: "Failed to equip item",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUnequip = async (type) => {
    try {
      await unequipCosmetic(athlete.id, type);
      setProfile((prev) => ({
        ...prev,
        equipped: {
          ...prev.equipped,
          [type]: null,
        },
      }));
      toast({
        title: "Success",
        description: "Item unequipped successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error unequipping item:", error);
      toast({
        title: "Error",
        description: "Failed to unequip item",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  const filterCosmeticsByType = (type) => {
    return Object.entries(cosmetics)
      .filter(([_, item]) => item.type === type)
      .filter(([id]) => profile.inventory[id]); // Only show items in inventory
  };

  // Get the equipped background cosmetic
  const equippedBackground = profile.equipped.background
    ? cosmetics[profile.equipped.background]
    : null;

  return (
    <Box maxW="1200px" mx="auto" p={6}>
      <VStack spacing={8} align="stretch">
        {/* Profile Preview */}
        <Box
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          position="relative"
          overflow="hidden"
        >
          {/* Background Image */}
          {equippedBackground && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              backgroundImage={equippedBackground.preview}
              backgroundSize="cover"
              backgroundPosition="center"
              opacity={0.15}
            />
          )}

          <Flex align="center" gap={6} position="relative">
            <Box position="relative" width="128px" height="128px">
              <Avatar
                size="2xl"
                src={athlete.profile}
                name={athlete.firstname}
                width="100%"
                height="100%"
              />
              {profile.equipped.profileFrame &&
                cosmetics[profile.equipped.profileFrame] && (
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    width="100%"
                    height="100%"
                    zIndex={1}
                  >
                    <Image
                      src={cosmetics[profile.equipped.profileFrame].preview}
                      alt="Profile Frame"
                      width="100%"
                      height="100%"
                      position="absolute"
                      top="0"
                      left="0"
                      objectFit="contain"
                    />
                  </Box>
                )}
            </Box>
            <VStack align="start" spacing={2}>
              <Heading size="lg">
                {athlete.firstname} {athlete.lastname}
              </Heading>
              <Text color="gray.600">{athlete.city}</Text>
            </VStack>
          </Flex>
        </Box>

        <Divider />

        {/* Achievements Section */}
        <Box>
          <AchievementsDisplay
            achievements={achievementsList}
            userProgress={userAchievements}
            equippedStyle={profile.equipped.achievementStyle}
            cosmetics={cosmetics}
          />
        </Box>

        <Divider />

        {/* Cosmetics Management */}
        <Tabs>
          <TabList>
            <Tab>Profile Frames</Tab>
            <Tab>Backgrounds</Tab>
            <Tab>Activity Themes</Tab>
            <Tab>Token Styles</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Grid
                templateColumns="repeat(auto-fill, minmax(200px, 1fr))"
                gap={6}
              >
                {filterCosmeticsByType(COSMETIC_TYPES.PROFILE_FRAME).map(
                  ([id, item]) => (
                    <CosmeticItem
                      key={id}
                      item={item}
                      isEquipped={profile.equipped.profileFrame === id}
                      onEquip={() =>
                        handleEquip(COSMETIC_TYPES.PROFILE_FRAME, id)
                      }
                      onUnequip={() =>
                        handleUnequip(COSMETIC_TYPES.PROFILE_FRAME)
                      }
                    />
                  )
                )}
              </Grid>
            </TabPanel>

            <TabPanel>
              <Grid
                templateColumns="repeat(auto-fill, minmax(200px, 1fr))"
                gap={6}
              >
                {filterCosmeticsByType(COSMETIC_TYPES.BACKGROUND).map(
                  ([id, item]) => (
                    <CosmeticItem
                      key={id}
                      item={item}
                      isEquipped={profile.equipped.background === id}
                      onEquip={() => handleEquip(COSMETIC_TYPES.BACKGROUND, id)}
                      onUnequip={() => handleUnequip(COSMETIC_TYPES.BACKGROUND)}
                    />
                  )
                )}
              </Grid>
            </TabPanel>

            <TabPanel>
              <Grid
                templateColumns="repeat(auto-fill, minmax(200px, 1fr))"
                gap={6}
              >
                {filterCosmeticsByType(COSMETIC_TYPES.ACTIVITY_THEME).map(
                  ([id, item]) => (
                    <CosmeticItem
                      key={id}
                      item={item}
                      isEquipped={profile.equipped.activityTheme === id}
                      onEquip={() =>
                        handleEquip(COSMETIC_TYPES.ACTIVITY_THEME, id)
                      }
                      onUnequip={() =>
                        handleUnequip(COSMETIC_TYPES.ACTIVITY_THEME)
                      }
                    />
                  )
                )}
              </Grid>
            </TabPanel>

            <TabPanel>
              <Grid
                templateColumns="repeat(auto-fill, minmax(200px, 1fr))"
                gap={6}
              >
                {filterCosmeticsByType(COSMETIC_TYPES.TOKEN_STYLE).map(
                  ([id, item]) => (
                    <CosmeticItem
                      key={id}
                      item={item}
                      isEquipped={profile.equipped.tokenStyle === id}
                      onEquip={() =>
                        handleEquip(COSMETIC_TYPES.TOKEN_STYLE, id)
                      }
                      onUnequip={() =>
                        handleUnequip(COSMETIC_TYPES.TOKEN_STYLE)
                      }
                    />
                  )
                )}
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default Profile;
