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
  Center,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

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

const CHEST_COSTS = {
  bronze: 1,
  silver: 3,
  gold: 7,
};

const REWARDS = {
  bronze: [
    {
      type: "achievement",
      name: "Bronze Achievement",
      rarity: "common",
      chance: 0.7,
    },
    { type: "badge", name: "Bronze Runner", rarity: "uncommon", chance: 0.25 },
    { type: "title", name: "The Persistent", rarity: "rare", chance: 0.05 },
  ],
  silver: [
    {
      type: "achievement",
      name: "Silver Achievement",
      rarity: "uncommon",
      chance: 0.6,
    },
    { type: "badge", name: "Silver Sprinter", rarity: "rare", chance: 0.3 },
    { type: "title", name: "The Dedicated", rarity: "epic", chance: 0.1 },
  ],
  gold: [
    {
      type: "achievement",
      name: "Gold Achievement",
      rarity: "rare",
      chance: 0.5,
    },
    { type: "badge", name: "Golden Champion", rarity: "epic", chance: 0.35 },
    { type: "title", name: "The Legendary", rarity: "legendary", chance: 0.15 },
  ],
};

const ChestModal = ({ isOpen, onClose, tokens, setTokens }) => {
  const [selectedChest, setSelectedChest] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState(null);
  const toast = useToast();

  const handleChestSelect = (chestType) => {
    if (tokens < CHEST_COSTS[chestType]) {
      toast({
        title: "Not enough tokens",
        description: `You need ${CHEST_COSTS[chestType]} tokens to open this chest`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSelectedChest(chestType);
  };

  const getRandomReward = (chestType) => {
    const rewards = REWARDS[chestType];
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const reward of rewards) {
      cumulativeProbability += reward.chance;
      if (random <= cumulativeProbability) {
        return reward;
      }
    }
    return rewards[0]; // Fallback to first reward
  };

  const handleOpenChest = async () => {
    setIsOpening(true);
    // Simulate opening animation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newReward = getRandomReward(selectedChest);
    setReward(newReward);
    setTokens((prev) => prev - CHEST_COSTS[selectedChest]);
    localStorage.setItem(
      "tokens",
      (tokens - CHEST_COSTS[selectedChest]).toString()
    );

    setIsOpening(false);
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

  const handleClose = () => {
    setSelectedChest(null);
    setReward(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Open Treasure Chests</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6}>
            <HStack spacing={8} justify="center">
              <VStack>
                <Box
                  as="button"
                  p={4}
                  borderRadius="lg"
                  bg={selectedChest === "bronze" ? "orange.100" : "white"}
                  borderWidth="2px"
                  borderColor="orange.300"
                  onClick={() => handleChestSelect("bronze")}
                  _hover={{ transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                >
                  <Image
                    src="/bronze-chest.png"
                    alt="Bronze Chest"
                    boxSize="100px"
                  />
                </Box>
                <HStack>
                  <StarIcon color="yellow.500" />
                  <Text>{CHEST_COSTS.bronze}</Text>
                </HStack>
              </VStack>

              <VStack>
                <Box
                  as="button"
                  p={4}
                  borderRadius="lg"
                  bg={selectedChest === "silver" ? "gray.100" : "white"}
                  borderWidth="2px"
                  borderColor="gray.300"
                  onClick={() => handleChestSelect("silver")}
                  _hover={{ transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                >
                  <Image
                    src="/silver-chest.png"
                    alt="Silver Chest"
                    boxSize="100px"
                  />
                </Box>
                <HStack>
                  <StarIcon color="yellow.500" />
                  <Text>{CHEST_COSTS.silver}</Text>
                </HStack>
              </VStack>

              <VStack>
                <Box
                  as="button"
                  p={4}
                  borderRadius="lg"
                  bg={selectedChest === "gold" ? "yellow.100" : "white"}
                  borderWidth="2px"
                  borderColor="yellow.300"
                  onClick={() => handleChestSelect("gold")}
                  _hover={{ transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                >
                  <Image
                    src="/gold-chest.png"
                    alt="Gold Chest"
                    boxSize="100px"
                  />
                </Box>
                <HStack>
                  <StarIcon color="yellow.500" />
                  <Text>{CHEST_COSTS.gold}</Text>
                </HStack>
              </VStack>
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
                Open{" "}
                {selectedChest.charAt(0).toUpperCase() + selectedChest.slice(1)}{" "}
                Chest
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
      </ModalContent>
    </Modal>
  );
};

export default ChestModal;
