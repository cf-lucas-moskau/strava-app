import { database } from "../firebase-config";
import { ref, set, remove, push } from "firebase/database";

export const createGroup = async (groupData) => {
  try {
    const groupRef = ref(database, "groups");
    const newGroupRef = await push(groupRef);
    await set(newGroupRef, {
      ...groupData,
      createdAt: new Date().toISOString(),
      members: {},
    });
    return { success: true };
  } catch (error) {
    console.error("Error creating group:", error);
    return { success: false, error };
  }
};

export const deleteGroup = async (groupId) => {
  try {
    await remove(ref(database, `groups/${groupId}`));
    return { success: true };
  } catch (error) {
    console.error("Error deleting group:", error);
    return { success: false, error };
  }
};

export const addMemberToGroup = async (groupId, athleteId) => {
  try {
    await set(ref(database, `groups/${groupId}/members/${athleteId}`), {
      addedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding member to group:", error);
    return { success: false, error };
  }
};

export const removeMemberFromGroup = async (groupId, athleteId) => {
  try {
    await remove(ref(database, `groups/${groupId}/members/${athleteId}`));
    return { success: true };
  } catch (error) {
    console.error("Error removing member from group:", error);
    return { success: false, error };
  }
};
