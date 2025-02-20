import React, { useState, useEffect } from "react";
import {
  Box,
  HStack,
  IconButton,
  Text,
  Input,
  Button,
  VStack,
  Avatar,
  Flex,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { AiOutlineLike, AiFillLike, AiOutlineComment } from "react-icons/ai";
import { database } from "../firebase-config";
import { ref, set, push, onValue, off } from "firebase/database";

const ActivitySocial = ({ activity, currentUser, runnerProfile }) => {
  const [kudos, setKudos] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!activity?.id) return;

    const kudosRef = ref(database, `kudos/${activity.id}`);
    const commentsRef = ref(database, `comments/${activity.id}`);

    onValue(kudosRef, (snapshot) => {
      setKudos(snapshot.val() || {});
    });

    onValue(commentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const commentsData = snapshot.val();
        const commentsArray = Object.entries(commentsData).map(
          ([id, comment]) => ({
            id,
            ...comment,
          })
        );
        setComments(
          commentsArray.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )
        );
      } else {
        setComments([]);
      }
    });

    return () => {
      off(kudosRef);
      off(commentsRef);
    };
  }, [activity?.id]);

  const handleKudos = async () => {
    if (!currentUser?.id) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to give kudos",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const hasGivenKudos = kudos[currentUser.id];
      await set(
        ref(database, `kudos/${activity.id}/${currentUser.id}`),
        !hasGivenKudos
      );

      // Create notification if giving kudos (not removing)
      if (!hasGivenKudos && activity.athlete.id !== currentUser.id) {
        const notificationRef = push(
          ref(database, `notifications/${activity.athlete.id}`)
        );
        await set(notificationRef, {
          type: "kudos",
          timestamp: new Date().toISOString(),
          activityId: activity.id,
          fromUser: {
            id: currentUser.id,
            name: currentUser.firstname,
            picture: currentUser.profile,
          },
        });
      }
    } catch (error) {
      console.error("Error toggling kudos:", error);
      toast({
        title: "Error",
        description: "Failed to update kudos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleComment = async () => {
    if (!currentUser?.id) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to comment",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentRef = push(ref(database, `comments/${activity.id}`));
      await set(commentRef, {
        text: newComment.trim(),
        authorId: currentUser.id,
        timestamp: new Date().toISOString(),
      });

      // Create notification for new comment
      if (activity.athlete.id !== currentUser.id) {
        const notificationRef = push(
          ref(database, `notifications/${activity.athlete.id}`)
        );
        await set(notificationRef, {
          type: "comment",
          timestamp: new Date().toISOString(),
          activityId: activity.id,
          text: newComment.trim(),
          fromUser: {
            id: currentUser.id,
            name: currentUser.firstname,
            picture: currentUser.profile,
          },
        });
      }

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box mt={4}>
      <HStack spacing={4} mb={4}>
        <IconButton
          icon={kudos[currentUser?.id] ? <AiFillLike /> : <AiOutlineLike />}
          aria-label="Give kudos"
          onClick={handleKudos}
          colorScheme={kudos[currentUser?.id] ? "blue" : "gray"}
        />
        <Text fontSize="sm">{Object.keys(kudos).length} kudos</Text>
        <AiOutlineComment />
        <Text fontSize="sm">{comments.length} comments</Text>
      </HStack>

      {/* Comments section */}
      <VStack spacing={4} align="stretch">
        {/* New comment input */}
        <HStack>
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button
            onClick={handleComment}
            isLoading={isSubmitting}
            disabled={!newComment.trim()}
          >
            Post
          </Button>
        </HStack>

        {/* Comments list */}
        <VStack spacing={3} align="stretch">
          {comments.map((comment) => (
            <Box key={comment.id} p={2} borderRadius="md" bg="gray.50">
              <Flex gap={3}>
                <Avatar
                  size="sm"
                  src={runnerProfile[comment.authorId]?.picture}
                  name={
                    runnerProfile[comment.authorId]?.name || "Unknown Runner"
                  }
                />
                <Box flex="1">
                  <Text fontWeight="medium">
                    {runnerProfile[comment.authorId]?.name || "Unknown Runner"}
                  </Text>
                  <Text fontSize="sm">{comment.text}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {new Date(comment.timestamp).toLocaleString()}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};

export default ActivitySocial;
