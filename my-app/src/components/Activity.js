import React, { useState } from "react";
import {
  Box,
  Flex,
  Stack,
  Text,
  Heading,
  IconButton,
  Input,
  Textarea,
  Button,
  Switch,
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import MapComponent from "./MapComponent"; // Adjust the path as necessary

function Activity({ activity, loadSingleActivity, updateActivityOnStrava }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(activity.name);
  const [description, setDescription] = useState(activity.description);
  const [isPrivate, setIsPrivate] = useState(activity.private);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveClick = () => {
    updateActivityOnStrava(activity.id, {
      title,
      description,
    });
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setTitle(activity.name); // Revert title to original
    setDescription(activity.description); // Revert description to original
    setIsPrivate(activity.private); // Revert privacy setting to original
    setIsEditing(false);
  };

  const handlePrivacyToggle = (e) => {
    setIsPrivate(e.target.checked);
  };

  return (
    <Box
      key={activity.id}
      borderWidth="1px"
      borderRadius="md"
      boxShadow="md"
      overflow="hidden"
      padding={4}
      marginBottom={6}
      bg="white"
    >
      <Box padding={4} borderRadius="md">
        <Flex justifyContent="space-between" marginBottom={4}>
          <Stack spacing={1}>
            <Text fontSize="sm" color="gray.600">
              {new Date(activity.start_date_local).toLocaleString()}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {activity.location_city ||
                activity.location_state ||
                activity.location_country}
            </Text>
          </Stack>

          <Stack spacing={1} textAlign="right">
            {isEditing ? (
              <>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="sm"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  size="sm"
                  mt={2}
                />
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={handleSaveClick}
                  mt={2}
                >
                  Save
                </Button>
                <Button size="sm" onClick={handleCancelClick} mt={2}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Heading
                  as="h3"
                  size="md"
                  cursor="pointer"
                  onClick={
                    !isEditing ? () => loadSingleActivity(activity.id) : null
                  }
                  _hover={!isEditing ? { textDecoration: "underline" } : {}}
                >
                  {title}
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  {description}
                </Text>
              </>
            )}
            {!isEditing && (
              <IconButton
                aria-label="Edit Activity"
                icon={<EditIcon />}
                size="sm"
                onClick={handleEditClick}
                variant="ghost"
                colorScheme="teal"
              />
            )}
          </Stack>
        </Flex>
      </Box>

      <Box padding={4} borderTopWidth="1px" borderColor="gray.200">
        <Flex justifyContent="space-between">
          <Text>
            <strong>Distanz:</strong>{" "}
            {formatMeterToKilometer(activity.distance)}
          </Text>
          <Text>
            <strong>Tempo:</strong> {formatPace(activity.average_speed)} /km
          </Text>
          <Text>
            <strong>Zeit:</strong> {formatDuration(activity.elapsed_time)}
          </Text>
        </Flex>
      </Box>

      <Box marginTop={4}>
        <MapComponent summaryPolyline={activity.map.summary_polyline} />
      </Box>
    </Box>
  );
}

// Utility functions

function formatMeterToKilometer(meters) {
  return (meters / 1000).toFixed(2) + " km";
}

function formatPace(speed) {
  const pace = 1000 / speed; // pace in seconds per kilometer
  const minutes = Math.floor(pace / 60);
  const seconds = Math.round(pace % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min ${secs}s`;
}

export default Activity;
