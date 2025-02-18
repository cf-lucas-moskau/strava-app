import { database } from "../firebase-config";
import { ref, get, set, update } from "firebase/database";

export const COSMETIC_TYPES = {
  PROFILE_FRAME: "profileFrame",
  BACKGROUND: "background",
  ACTIVITY_THEME: "activityTheme",
  TOKEN_STYLE: "tokenStyle",
};

export const RARITY_LEVELS = {
  COMMON: { name: "Common", color: "gray.500", chance: 0.6 },
  UNCOMMON: { name: "Uncommon", color: "green.500", chance: 0.25 },
  RARE: { name: "Rare", color: "blue.500", chance: 0.1 },
  EPIC: { name: "Epic", color: "purple.500", chance: 0.04 },
  LEGENDARY: { name: "Legendary", color: "orange.500", chance: 0.01 },
};

// Get all available cosmetic items
export const getAvailableCosmetics = async () => {
  try {
    const cosmeticsRef = ref(database, "cosmetics/items");
    const snapshot = await get(cosmeticsRef);
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error("Error fetching cosmetics:", error);
    return {};
  }
};

// Get a user's profile including inventory and equipped items
export const getUserProfile = async (userId) => {
  try {
    const profileRef = ref(database, `profiles/${userId}`);
    const snapshot = await get(profileRef);
    return snapshot.exists()
      ? snapshot.val()
      : {
          inventory: {},
          equipped: {
            profileFrame: null,
            background: null,
            activityTheme: null,
            tokenStyle: null,
          },
        };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Add a cosmetic item to user's inventory
export const addCosmeticToInventory = async (userId, cosmeticId) => {
  try {
    const updates = {};
    updates[`profiles/${userId}/inventory/${cosmeticId}`] = {
      obtainedAt: new Date().toISOString(),
    };
    await update(ref(database), updates);
    return true;
  } catch (error) {
    console.error("Error adding cosmetic to inventory:", error);
    return false;
  }
};

// Equip a cosmetic item
export const equipCosmetic = async (userId, type, cosmeticId) => {
  try {
    const updates = {};
    updates[`profiles/${userId}/equipped/${type}`] = cosmeticId;
    await update(ref(database), updates);
    return true;
  } catch (error) {
    console.error("Error equipping cosmetic:", error);
    return false;
  }
};

// Unequip a cosmetic item
export const unequipCosmetic = async (userId, type) => {
  try {
    const updates = {};
    updates[`profiles/${userId}/equipped/${type}`] = null;
    await update(ref(database), updates);
    return true;
  } catch (error) {
    console.error("Error unequipping cosmetic:", error);
    return false;
  }
};

// Get a random cosmetic based on rarity chances
export const getRandomCosmetic = async () => {
  const cosmetics = await getAvailableCosmetics();

  // If there are no cosmetics at all, return null
  if (Object.keys(cosmetics).length === 0) {
    console.warn("No cosmetics available");
    return null;
  }

  const random = Math.random();
  let cumulativeProbability = 0;

  // First determine the rarity
  for (const [rarity, data] of Object.entries(RARITY_LEVELS)) {
    cumulativeProbability += data.chance;
    if (random <= cumulativeProbability) {
      // Filter cosmetics by the selected rarity
      const rarityCosmetics = Object.entries(cosmetics).filter(
        ([_, cosmetic]) => cosmetic.rarity === rarity
      );

      if (rarityCosmetics.length === 0) continue; // Skip if no cosmetics of this rarity

      // Return a random cosmetic of this rarity
      const randomIndex = Math.floor(Math.random() * rarityCosmetics.length);
      return {
        id: rarityCosmetics[randomIndex][0],
        ...rarityCosmetics[randomIndex][1],
      };
    }
  }

  // If we haven't returned yet, get any available cosmetic as a fallback
  const allCosmetics = Object.entries(cosmetics);
  const randomIndex = Math.floor(Math.random() * allCosmetics.length);
  return {
    id: allCosmetics[randomIndex][0],
    ...allCosmetics[randomIndex][1],
  };
};

// Initialize sample cosmetic items
export const initializeSampleCosmetics = async () => {
  try {
    const sampleCosmetics = {
      frame_1: {
        name: "Golden Frame",
        type: COSMETIC_TYPES.PROFILE_FRAME,
        rarity: "LEGENDARY",
        preview:
          "https://www.kapwing.com/resources/content/images/size/w1600/2021/09/video_image-vMCBZOVa_0.png",
      },
      frame_2: {
        name: "Silver Frame",
        type: COSMETIC_TYPES.PROFILE_FRAME,
        rarity: "EPIC",
        preview:
          "https://www.kapwing.com/resources/content/images/size/w1600/2021/09/video_image-vMCBZOVa_0.png",
      },
      bg_1: {
        name: "Mountain Background",
        type: COSMETIC_TYPES.BACKGROUND,
        rarity: "RARE",
        preview:
          "https://images.unsplash.com/photo-1515268064940-5150b7c29f35?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      theme_1: {
        name: "Neon Runner Theme",
        type: COSMETIC_TYPES.ACTIVITY_THEME,
        rarity: "EPIC",
        preview:
          "https://img.freepik.com/free-vector/geometric-shapes-neon-lights-background-theme_23-2148433564.jpg?t=st=1739897212~exp=1739900812~hmac=e2e2da8de3ef211c3456123132046fa450e9c6be0da3a85b741f76ed359879b8&w=2000",
        borderColor: "pink.400",
        backgroundColor: "black",
        boxShadow: "0 0 15px rgba(255, 20, 147, 0.3)",
        headingColor: "pink.400",
        textColor: "pink.200",
        statsBackgroundColor: "whiteAlpha.100",
        gradientOverlay: "linear-gradient(45deg, #FF1493, #00FFFF)",
      },
      theme_2: {
        name: "Forest Runner Theme",
        type: COSMETIC_TYPES.ACTIVITY_THEME,
        rarity: "RARE",
        preview:
          "https://img.freepik.com/free-vector/geometric-shapes-neon-lights-background-theme_23-2148433564.jpg?t=st=1739897212~exp=1739900812~hmac=e2e2da8de3ef211c3456123132046fa450e9c6be0da3a85b741f76ed359879b8&w=2000",
        borderColor: "green.500",
        backgroundColor: "#F7FFF7",
        boxShadow: "md",
        headingColor: "green.700",
        textColor: "green.800",
        statsBackgroundColor: "green.50",
      },
      theme_3: {
        name: "Night Runner Theme",
        type: COSMETIC_TYPES.ACTIVITY_THEME,
        rarity: "UNCOMMON",
        preview:
          "https://img.freepik.com/free-vector/geometric-shapes-neon-lights-background-theme_23-2148433564.jpg?t=st=1739897212~exp=1739900812~hmac=e2e2da8de3ef211c3456123132046fa450e9c6be0da3a85b741f76ed359879b8&w=2000",
        borderColor: "purple.600",
        backgroundColor: "#1A1B4B",
        boxShadow: "dark-lg",
        headingColor: "white",
        textColor: "whiteAlpha.900",
        statsBackgroundColor: "whiteAlpha.100",
        gradientOverlay: "linear-gradient(to right, #000428, #004e92)",
      },
      style_1: {
        name: "Dog Token Style",
        type: COSMETIC_TYPES.TOKEN_STYLE,
        rarity: "EPIC",
        preview:
          "https://img.freepik.com/free-vector/cute-dog-icon-design_24877-38224.jpg",
        icon: "🐕",
        tokenName: "Dogs",
        description: "Earn and spend adorable dog treats instead of stars!",
      },
      style_2: {
        name: "Pizza Token Style",
        type: COSMETIC_TYPES.TOKEN_STYLE,
        rarity: "RARE",
        preview:
          "https://img.freepik.com/free-vector/cute-pizza-icon-design_24877-38225.jpg",
        icon: "🍕",
        tokenName: "Pizza Slices",
        description:
          "Who wouldn't run for pizza? Earn and spend delicious pizza slices!",
      },
      style_3: {
        name: "Gem Token Style",
        type: COSMETIC_TYPES.TOKEN_STYLE,
        rarity: "UNCOMMON",
        preview:
          "https://img.freepik.com/free-vector/cute-gem-icon-design_24877-38226.jpg",
        icon: "💎",
        tokenName: "Gems",
        description:
          "Collect and spend sparkling gems on your running journey!",
      },
    };

    const updates = {};
    Object.entries(sampleCosmetics).forEach(([id, cosmetic]) => {
      updates[`cosmetics/items/${id}`] = cosmetic;
    });

    await update(ref(database), updates);
    return true;
  } catch (error) {
    console.error("Error initializing sample cosmetics:", error);
    return false;
  }
};
