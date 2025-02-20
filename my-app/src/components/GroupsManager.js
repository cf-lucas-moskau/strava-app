import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
  createGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
} from "../utils/groups";

const GroupsManager = ({ groups, athletes }) => {
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isManageGroupModalOpen, setIsManageGroupModalOpen] = useState(false);
  const toast = useToast();

  const handleAddGroup = async () => {
    if (!newGroup.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a group name",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await createGroup(newGroup);
    if (result.success) {
      setNewGroup({ name: "", description: "" });
      setIsAddGroupModalOpen(false);
      toast({
        title: "Group Created",
        description: "New group has been created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create group",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const result = await deleteGroup(groupId);
    if (result.success) {
      toast({
        title: "Group Deleted",
        description: "Group has been deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete group",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddMemberToGroup = async (groupId, athleteId) => {
    const result = await addMemberToGroup(groupId, athleteId);
    if (result.success) {
      toast({
        title: "Member Added",
        description: "Member has been added to the group",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add member to group",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveMemberFromGroup = async (groupId, athleteId) => {
    const result = await removeMemberFromGroup(groupId, athleteId);
    if (result.success) {
      toast({
        title: "Member Removed",
        description: "Member has been removed from the group",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove member from group",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Groups</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          onClick={() => setIsAddGroupModalOpen(true)}
        >
          Create Group
        </Button>
      </Flex>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Members</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {groups.map((group) => (
            <Tr key={group.id}>
              <Td>{group.name}</Td>
              <Td>{group.description}</Td>
              <Td>
                {group.members ? Object.keys(group.members).length : 0} members
              </Td>
              <Td>
                <Flex gap={2}>
                  <IconButton
                    icon={<EditIcon />}
                    onClick={() => {
                      setSelectedGroup(group);
                      setIsManageGroupModalOpen(true);
                    }}
                    aria-label="Manage group"
                    size="sm"
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    onClick={() => handleDeleteGroup(group.id)}
                    aria-label="Delete group"
                    colorScheme="red"
                    size="sm"
                  />
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Add Group Modal */}
      <Modal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Group Name</FormLabel>
              <Input
                value={newGroup.name}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, name: e.target.value })
                }
                placeholder="Enter group name"
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Input
                value={newGroup.description}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, description: e.target.value })
                }
                placeholder="Enter group description"
              />
            </FormControl>

            <Button colorScheme="blue" mr={3} mt={4} onClick={handleAddGroup}>
              Create Group
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Manage Group Modal */}
      <Modal
        isOpen={isManageGroupModalOpen}
        onClose={() => setIsManageGroupModalOpen(false)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Manage Group: {selectedGroup?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="sm" mb={2}>
                  Current Members
                </Heading>
                <Flex wrap="wrap" gap={2}>
                  {selectedGroup?.members &&
                    Object.keys(selectedGroup.members).map((memberId) => (
                      <Tag
                        key={memberId}
                        size="lg"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="teal"
                      >
                        <TagLabel>
                          {athletes.find((a) => a.id === memberId)?.name ||
                            memberId}
                        </TagLabel>
                        <TagCloseButton
                          onClick={() =>
                            handleRemoveMemberFromGroup(
                              selectedGroup.id,
                              memberId
                            )
                          }
                        />
                      </Tag>
                    ))}
                </Flex>
              </Box>

              <Box>
                <Heading size="sm" mb={2}>
                  Add Members
                </Heading>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Athlete ID</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {athletes
                      .filter(
                        (athlete) => !selectedGroup?.members?.[athlete.id]
                      )
                      .map((athlete) => (
                        <Tr key={athlete.id}>
                          <Td>{athlete.id}</Td>
                          <Td>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleAddMemberToGroup(
                                  selectedGroup.id,
                                  athlete.id
                                )
                              }
                            >
                              Add
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GroupsManager;
