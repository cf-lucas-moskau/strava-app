import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Button,
  useToast,
  keyframes,
  Image,
  ModalFooter,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";
import {
  getRandomCosmetic,
  addCosmeticToInventory,
  initializeSampleCosmetics,
} from "../utils/cosmetics";
import { ADMIN_ATHLETE_ID } from "../utils/admin";
import { spendTokens } from "../utils/tokens";

const shakeAnimation = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
  75% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
`;

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px gold; }
  50% { box-shadow: 0 0 20px gold; }
  100% { box-shadow: 0 0 5px gold; }
`;

const popAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const ChestModal = ({
  isOpen,
  onClose,
  tokens,
  setTokens,
  athlete,
  tokenDisplay,
}) => {
  const [selectedChest, setSelectedChest] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState(null);
  const toast = useToast();

  const chests = [
    {
      id: "bronze",
      name: "Bronze Chest",
      cost: 1,
      description: `Contains common cosmetic items. Cost: 1 ${
        tokenDisplay?.name || "Stars"
      }`,
      rarity: "COMMON",
      color: "orange",
      image: "/bronze-chest.png",
    },
    {
      id: "silver",
      name: "Silver Chest",
      cost: 3,
      description: `Higher chance of rare cosmetic items. Cost: 3 ${
        tokenDisplay?.name || "Stars"
      }`,
      rarity: "RARE",
      color: "gray",
      image: "/silver-chest.png",
    },
    {
      id: "gold",
      name: "Gold Chest",
      cost: 7,
      description: `Guaranteed rare or better items! Cost: 7 ${
        tokenDisplay?.name || "Stars"
      }`,
      rarity: "EPIC",
      color: "yellow",
      image: "/gold-chest.png",
    },
  ];

  const handleChestSelect = (chestId) => {
    const chest = chests.find((c) => c.id === chestId);
    if (tokens < chest.cost) {
      toast({
        title: "Not enough tokens",
        description: `You need ${chest.cost} ${
          tokenDisplay?.name || "Stars"
        } to open this chest`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSelectedChest(chestId);
  };

  const handleOpenChest = async () => {
    if (!selectedChest) {
      toast({
        title: "Error",
        description: "Please select a chest first",
        status: "error",
        duration: 5000,
      });
      return;
    }

    const chest = chests.find((c) => c.id === selectedChest);
    if (tokens < chest.cost) {
      toast({
        title: "Not enough tokens",
        description: `You need ${chest.cost} ${
          tokenDisplay?.name || "Stars"
        } to open this chest`,
        status: "error",
        duration: 5000,
      });
      return;
    }

    setIsOpening(true);
    try {
      // First try to spend the tokens
      const tokensSpent = await spendTokens(athlete, chest.cost);
      if (!tokensSpent) {
        throw new Error("Failed to spend tokens");
      }

      let cosmeticReward = await getRandomCosmetic();

      // If no cosmetics are available, initialize sample cosmetics and try again
      if (!cosmeticReward && athlete.id === ADMIN_ATHLETE_ID) {
        await initializeSampleCosmetics();
        cosmeticReward = await getRandomCosmetic();
      }

      if (!cosmeticReward) {
        throw new Error("No cosmetic rewards available");
      }

      await addCosmeticToInventory(athlete.id, cosmeticReward.id);

      // Update tokens
      const newTokens = tokens - chest.cost;
      setTokens(newTokens);
      localStorage.setItem("tokens", newTokens.toString());

      setReward({
        ...cosmeticReward,
        type: "cosmetic",
      });

      toast({
        title: "Success!",
        description: `You received a ${cosmeticReward.name}! (-${chest.cost} ${
          tokenDisplay?.name || "Stars"
        })`,
        status: "success",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error opening chest:", error);
      toast({
        title: "Error opening chest",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsOpening(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common":
        return "gray.500";
      case "uncommon":
        return "green.500";
      case "rare":
        return "blue.500";
      case "epic":
        return "purple.500";
      case "legendary":
        return "orange.500";
      default:
        return "gray.500";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Open a Chest</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text mb={4}>
            Available {tokenDisplay?.name || "Stars"}: {tokens}{" "}
            {tokenDisplay?.icon || "⭐"}
          </Text>
          <VStack spacing={6}>
            <HStack spacing={8} justify="center">
              {chests.map((chest) => (
                <VStack key={chest.id}>
                  <Box
                    as="button"
                    p={4}
                    borderRadius="lg"
                    bg={
                      selectedChest === chest.id
                        ? `${chest.color}.100`
                        : "white"
                    }
                    borderWidth="2px"
                    borderColor={`${chest.color}.300`}
                    onClick={() => handleChestSelect(chest.id)}
                    _hover={{ transform: "translateY(-2px)" }}
                    transition="all 0.2s"
                  >
                    <Image src={chest.image} alt={chest.name} boxSize="100px" />
                  </Box>
                  <HStack>
                    {tokenDisplay?.icon || <StarIcon color="yellow.500" />}
                    <Text>{chest.cost}</Text>
                  </HStack>
                </VStack>
              ))}
            </HStack>

            {selectedChest && !reward && (
              <Button
                colorScheme="yellow"
                size="lg"
                onClick={handleOpenChest}
                isLoading={isOpening}
                loadingText="Opening..."
                animation={
                  isOpening ? `${shakeAnimation} 0.5s infinite` : undefined
                }
              >
                Open {chests.find((c) => c.id === selectedChest)?.name}
              </Button>
            )}

            {reward && (
              <Box
                p={6}
                borderRadius="lg"
                borderWidth="2px"
                borderColor={getRarityColor(reward.rarity)}
                bg={`${getRarityColor(reward.rarity)}10`}
                animation={`${glowAnimation} 2s infinite, ${popAnimation} 0.5s`}
              >
                <VStack spacing={2}>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color={getRarityColor(reward.rarity)}
                  >
                    {reward.name}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    textTransform="capitalize"
                  >
                    {reward.type} • {reward.rarity}
                  </Text>
                </VStack>
              </Box>
            )}

            <Text fontSize="sm" color="gray.500">
              Available tokens: {tokens}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleOpenChest}
            isLoading={isOpening}
            isDisabled={!selectedChest}
          >
            Open Chest
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChestModal;
