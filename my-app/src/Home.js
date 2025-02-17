import React, { useEffect, useState } from "react";
import "./App.css";
import * as Realm from "realm-web";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { trainingPlans } from "./trainingPLans";
import {
  getActivities,
  saveAthlete,
  getAthlete as getAthleteFromDB,
  clearData,
} from "./utils/db";
import { setupNotifications } from "./utils/notifications";
import {
  saveClaimedToken,
  checkIfTokenClaimed,
  getClaimedTokensCount,
} from "./utils/tokens";
import {
  formatMeterToKilometer,
  formatDuration,
  convertToPace,
  metersPerSecondsToPace,
} from "./utils/formatters";
import {
  getThisWeeksTrainings,
  getThisWeeksActivities,
  getAllThisWeeksActivities,
} from "./utils/training";
import {
  handleLogin,
  handleAuthorizationCallback,
  logout,
  getMailString,
} from "./utils/auth";
import { fetchActivities, updateActivityOnStrava } from "./utils/activities";
import { calculateAchievementProgress } from "./utils/achievementCalculator";
import { achievementsList, calculateWeeklyTotal } from "./utils/achievements";
import { isSameDay, isConsecutiveDay } from "./utils/achievements";

import {
  Box,
  Flex,
  Text,
  Button,
  Heading,
  Grid,
  Link,
  Spinner,
  CircularProgress,
  CircularProgressLabel,
} from "@chakra-ui/react";
import Activity from "./components/Activity";
import TrainingCard from "./components/TrainingCard";
import { RepeatIcon } from "@chakra-ui/icons";
import AchievementsDisplay from "./components/AchievementsDisplay";
import { ref, get, getDatabase } from "firebase/database";
import axios from "axios";
import Header from "./components/Header";
import Welcome from "./components/Welcome";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

function Home() {
  const navigate = useNavigate();

  const [tokens, setTokens] = useState(
    parseInt(localStorage.getItem("tokens")) || 0
  );
  const [unclaimedTokens, setUnclaimedTokens] = useState({});
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = previous week

  const [distanceInputs, setDistanceInputs] = useState([]);
  const [timeInputs, setTimeInputs] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState(null);
  const [filteredActivities, setFilteredActivities] = useState(null);
  const [hideActivities, setHideActivities] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [userAchievements, setUserAchievements] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0);

  const database = getDatabase();
  const toast = useToast();

  // Initialize app data
  useEffect(() => {
    const init = async () => {
      if (isInitialized) return;

      try {
        // Try to load data from IndexedDB first
        const storedAthlete = await getAthleteFromDB();
        const storedActivities = await getActivities();
        const storedAccessToken = localStorage.getItem("accessToken");

        // Set stored data if available
        if (storedAthlete) {
          setAthlete(storedAthlete);
        }
        if (storedActivities && storedActivities.length > 0) {
          setActivities(storedActivities);
        }
        if (storedAccessToken) {
          setAccessToken(storedAccessToken);
        }

        // Only handle authorization if we're on the callback route
        const isCallbackRoute = window.location.pathname === "/callback";
        if (isCallbackRoute) {
          await handleAuthorizationCallback(
            setAthlete,
            setAccessToken,
            navigate
          );
          return;
        }

        // If we don't have an access token, we're not authenticated
        if (!storedAccessToken) {
          console.log("No access token found, user needs to log in");
          return;
        }

        // If we have a token but no athlete data, fetch it from Strava
        if (storedAccessToken && !storedAthlete) {
          try {
            const response = await axios.get(
              "https://www.strava.com/api/v3/athlete",
              {
                headers: {
                  Authorization: `Bearer ${storedAccessToken}`,
                },
              }
            );
            const athleteData = response.data;
            await saveAthlete(athleteData);
            setAthlete(athleteData);
          } catch (error) {
            console.error("Error fetching athlete data:", error);
            if (error.response?.status === 401) {
              // Token is invalid, clear everything
              localStorage.removeItem("accessToken");
              setAccessToken("");
              setAthlete(null);
              await clearData();
            }
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error during initialization:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Consolidated activity fetching
  const fetchActivitiesWithDebounce = async () => {
    const now = Date.now();
    // Prevent fetching more often than every 30 seconds
    if (now - lastFetchTimestamp < 30000) {
      console.log("Skipping fetch, too soon since last fetch");
      return;
    }

    if (!athlete || !accessToken || !navigator.onLine || loadingActivities) {
      console.log("Skipping fetch, prerequisites not met");
      return;
    }

    try {
      setLastFetchTimestamp(now);
      const newActivities = await fetchActivities(
        athlete,
        accessToken,
        setLoadingActivities,
        toast
      );
      if (newActivities) {
        setActivities(newActivities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    const handleOnline = () => {
      console.log("App is online, checking for updates");
      fetchActivitiesWithDebounce();
    };

    // Initial fetch if we're online
    if (navigator.onLine) {
      fetchActivitiesWithDebounce();
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isInitialized, athlete, accessToken]);

  const loadSingleActivity = async (activityId) => {
    navigate(`/run/${activityId}`);
  };

  const getAthlete = async (_accessToken) => {
    try {
      const storedAthlete = await getAthleteFromDB();
      if (storedAthlete) {
        return storedAthlete;
      }

      if (!_accessToken && !accessToken) {
        console.warn("No access token available, aborting!");
        return null;
      }

      const token = _accessToken || accessToken;
      const response = await axios.get(
        "https://www.strava.com/api/v3/athlete",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const athleteData = response.data;
      await saveAthlete(athleteData);
      return athleteData;
    } catch (error) {
      console.error("Error fetching athlete:", error);
      if (error.response?.status === 401) {
        logout(setAthlete, setAccessToken);
      }
      return null;
    }
  };

  const claimToken = async (training, matchedActivity) => {
    if (!athlete || !matchedActivity) return;

    const claimed = await saveClaimedToken(athlete.id, matchedActivity.id);
    if (claimed) {
      // Update token count
      setTokens((prev) => {
        const newTokens = prev + 1;
        localStorage.setItem("tokens", newTokens.toString());
        return newTokens;
      });

      // Remove from unclaimed tokens to hide the button
      setUnclaimedTokens((prev) => {
        const newUnclaimed = { ...prev };
        delete newUnclaimed[matchedActivity.id];
        return newUnclaimed;
      });
    }
  };

  useEffect(() => {
    const checkClaimedTokens = async () => {
      if (!athlete || !activities || isCheckingTokens) return;

      setIsCheckingTokens(true);
      const thisWeeksTrainings = trainingPlans[athlete.id]?.filter(
        (training) => {
          const trainingDate = new Date(training.day);
          const today = new Date();
          const monday = new Date(today);
          monday.setDate(
            today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
          );
          monday.setHours(0, 0, 0, 0);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          return trainingDate >= monday && trainingDate <= sunday;
        }
      );

      if (!thisWeeksTrainings) {
        setIsCheckingTokens(false);
        return;
      }

      try {
        // Count total claimed tokens for this athlete
        const totalTokens = await getClaimedTokensCount(athlete.id);
        console.log("Total claimed tokens:", totalTokens);
        setTokens(totalTokens);

        // Create a new object to store the updated unclaimed tokens
        const newUnclaimedTokens = {};

        // Check each training and its matched activity
        for (const training of thisWeeksTrainings) {
          console.log(
            "Checking training:",
            training.title,
            "Completed:",
            training.completed,
            "Matched Activity:",
            training.matchedActivity?.id
          );

          if (training.completed && training.matchedActivity) {
            const isClaimed = await checkIfTokenClaimed(
              athlete.id,
              training.matchedActivity.id
            );
            console.log(
              "Activity",
              training.matchedActivity.id,
              "claimed status:",
              isClaimed
            );

            // Only add to unclaimed tokens if it's completed but not claimed
            if (!isClaimed) {
              newUnclaimedTokens[training.matchedActivity.id] =
                training.matchedActivity;
              console.log(
                "Adding to unclaimed tokens:",
                training.matchedActivity.id
              );
            }
          }
        }

        console.log("New unclaimed tokens:", newUnclaimedTokens);
        // Update state with the new unclaimed tokens
        setUnclaimedTokens(newUnclaimedTokens);
      } catch (error) {
        console.error("Error checking claimed tokens:", error);
      } finally {
        setIsCheckingTokens(false);
      }
    };

    checkClaimedTokens();
  }, [athlete?.id, activities]); // Only run when athlete ID or activities change

  useEffect(() => {
    if (activities && athlete && !loadingActivities) {
      // Calculate achievements
      const progress = calculateAchievementProgress(activities);
      setUserAchievements(progress);
    }
  }, [activities?.length, athlete?.id, loadingActivities]); // Only recalculate when activities length or athlete ID changes

  const getWeekDates = (offset = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const getWeekLabel = (offset = 0) => {
    if (offset === 0) return "This Week";
    if (offset === 1) return "Next Week";
    if (offset === -1) return "Last Week";
    return offset > 0
      ? `${offset} Weeks Ahead`
      : `${Math.abs(offset)} Weeks Ago`;
  };

  return (
    <div>
      {isLoading ? (
        <Box
          height="100vh"
          width="100vw"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="white"
        >
          <Box textAlign="center">
            <Spinner
              size="xl"
              color="teal.500"
              thickness="4px"
              speed="0.65s"
              mb={4}
            />
            <Text fontWeight="medium" color="gray.700">
              Loading...
            </Text>
          </Box>
        </Box>
      ) : (
        <>
          <Header
            handleLogin={handleLogin}
            athlete={athlete}
            logout={() => logout(setAthlete, setAccessToken)}
            tokens={tokens}
          />

          {!athlete ? (
            <Welcome handleLogin={handleLogin} />
          ) : (
            <>
              {/* Loading overlay */}
              {loadingActivities && (
                <Box
                  position="fixed"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bg="blackAlpha.300"
                  zIndex="overlay"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  backdropFilter="blur(2px)"
                >
                  <Box
                    bg="white"
                    p={6}
                    borderRadius="lg"
                    boxShadow="xl"
                    textAlign="center"
                  >
                    <Spinner
                      size="xl"
                      color="teal.500"
                      thickness="4px"
                      speed="0.65s"
                      mb={4}
                    />
                    <Text fontWeight="medium" color="gray.700">
                      Loading activities...
                    </Text>
                  </Box>
                </Box>
              )}

              {/* Add Refresh Activities button */}
              <Box maxWidth="1200px" margin="0 auto" px={6} py={4}>
                <Flex gap={4}>
                  <Button
                    onClick={fetchActivitiesWithDebounce}
                    colorScheme="teal"
                    size="md"
                    flex="1"
                    isLoading={loadingActivities}
                    loadingText="Refreshing activities..."
                    leftIcon={<RepeatIcon />}
                  >
                    Refresh Activities
                  </Button>
                </Flex>
              </Box>

              <Box maxWidth="1200px" margin="0 auto" px={6}>
                {athlete && athlete.id && trainingPlans[athlete.id] && (
                  <Box>
                    <Flex
                      justify="space-between"
                      align="center"
                      mb={6}
                      borderBottom="1px"
                      borderColor="gray.200"
                      pb={4}
                    >
                      <Box>
                        <Heading as="h2" size="lg" mb={2}>
                          {getWeekLabel(weekOffset)}
                        </Heading>
                        <Flex gap={4}>
                          <Button
                            size="sm"
                            onClick={() => setWeekOffset((prev) => prev - 1)}
                            leftIcon={<ChevronLeftIcon />}
                            variant="ghost"
                          >
                            Previous Week
                          </Button>
                          {weekOffset !== 0 && (
                            <Button
                              size="sm"
                              onClick={() => setWeekOffset(0)}
                              variant="ghost"
                            >
                              Back to Current Week
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => setWeekOffset((prev) => prev + 1)}
                            rightIcon={<ChevronRightIcon />}
                            variant="ghost"
                          >
                            Next Week
                          </Button>
                        </Flex>
                      </Box>
                      <Flex align="center" gap={8}>
                        <Box textAlign="right">
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="gray.700"
                          >
                            Weekly Progress
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {formatMeterToKilometer(
                              getAllThisWeeksActivities(
                                activities,
                                weekOffset
                              ).reduce((acc, curr) => acc + curr.distance, 0)
                            )}{" "}
                            of{" "}
                            {formatMeterToKilometer(
                              getThisWeeksTrainings(
                                athlete,
                                activities,
                                weekOffset
                              ).reduce((acc, curr) => acc + curr.distance, 0)
                            )}
                          </Text>
                        </Box>
                        <Box position="relative" width="100px" height="100px">
                          <CircularProgress
                            value={
                              (getAllThisWeeksActivities(
                                activities,
                                weekOffset
                              ).reduce((acc, curr) => acc + curr.distance, 0) /
                                getThisWeeksTrainings(
                                  athlete,
                                  activities,
                                  weekOffset
                                ).reduce(
                                  (acc, curr) => acc + curr.distance,
                                  0
                                )) *
                              100
                            }
                            color="teal.400"
                            size="100px"
                            thickness="8px"
                          >
                            <CircularProgressLabel>
                              {Math.round(
                                (getAllThisWeeksActivities(
                                  activities,
                                  weekOffset
                                ).reduce(
                                  (acc, curr) => acc + curr.distance,
                                  0
                                ) /
                                  getThisWeeksTrainings(
                                    athlete,
                                    activities,
                                    weekOffset
                                  ).reduce(
                                    (acc, curr) => acc + curr.distance,
                                    0
                                  )) *
                                  100
                              )}
                              %
                            </CircularProgressLabel>
                          </CircularProgress>
                        </Box>
                      </Flex>
                    </Flex>

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      }}
                      gap={6}
                    >
                      {getThisWeeksTrainings(
                        athlete,
                        activities,
                        weekOffset
                      ).map((event) => {
                        console.log("Rendering training card:", event.title, {
                          matchedActivityId: event.matchedActivity?.id,
                          canClaim:
                            event.matchedActivity &&
                            unclaimedTokens[event.matchedActivity.id],
                          isCompleted: event.completed,
                        });

                        return (
                          <TrainingCard
                            key={`${event.matchedActivity?.id || event.day}-${
                              event.title
                            }`}
                            event={event}
                            formatMeterToKilometer={formatMeterToKilometer}
                            convertToPace={convertToPace}
                            onClaimToken={() =>
                              claimToken(event, event.matchedActivity)
                            }
                            canClaim={
                              event.matchedActivity &&
                              unclaimedTokens[event.matchedActivity.id]
                            }
                          />
                        );
                      })}
                    </Grid>

                    {getThisWeeksActivities(activities, weekOffset).length >
                      0 && (
                      <Box mt={8} pt={6} borderTop="1px" borderColor="gray.200">
                        <Flex justify="space-between" align="center" mb={4}>
                          <Box>
                            <Text
                              fontSize="md"
                              fontWeight="medium"
                              color="gray.700"
                            >
                              Unmatched Runs {getWeekLabel(weekOffset)}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {
                                getThisWeeksActivities(
                                  activities,
                                  weekOffset
                                ).filter((activity) => {
                                  // Check if this activity is matched to any training
                                  const isMatched = getThisWeeksTrainings(
                                    athlete,
                                    activities,
                                    weekOffset
                                  ).some(
                                    (training) =>
                                      training.matchedActivity?.id ===
                                      activity.id
                                  );
                                  return !isMatched;
                                }).length
                              }{" "}
                              activities totaling{" "}
                              {formatMeterToKilometer(
                                getThisWeeksActivities(activities, weekOffset)
                                  .filter((activity) => {
                                    const isMatched = getThisWeeksTrainings(
                                      athlete,
                                      activities,
                                      weekOffset
                                    ).some(
                                      (training) =>
                                        training.matchedActivity?.id ===
                                        activity.id
                                    );
                                    return !isMatched;
                                  })
                                  .reduce((acc, curr) => acc + curr.distance, 0)
                              )}
                            </Text>
                          </Box>
                          <Text fontSize="sm" color="gray.500">
                            These runs weren't matched to any training plan
                            items
                          </Text>
                        </Flex>

                        <Box>
                          {getThisWeeksActivities(activities, weekOffset)
                            .filter((activity) => {
                              // Check if this activity is matched to any training
                              const isMatched = getThisWeeksTrainings(
                                athlete,
                                activities,
                                weekOffset
                              ).some(
                                (training) =>
                                  training.matchedActivity?.id === activity.id
                              );
                              return !isMatched;
                            })
                            .map((activity) => (
                              <Flex
                                key={activity.id}
                                p={3}
                                borderWidth="1px"
                                borderRadius="md"
                                mb={2}
                                justify="space-between"
                                align="center"
                                _hover={{ bg: "gray.50" }}
                              >
                                <Box>
                                  <Text fontWeight="medium">
                                    {activity.name}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    {new Date(
                                      activity.start_date_local
                                    ).toLocaleDateString()}{" "}
                                    at{" "}
                                    {new Date(
                                      activity.start_date_local
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </Text>
                                </Box>
                                <Flex gap={4} align="center">
                                  <Text color="gray.700">
                                    {formatMeterToKilometer(activity.distance)}
                                  </Text>
                                  <Text color="gray.700">
                                    {formatDuration(activity.moving_time)}
                                  </Text>
                                  <Text color="gray.700">
                                    {metersPerSecondsToPace(
                                      activity.average_speed
                                    )}{" "}
                                    /km
                                  </Text>
                                </Flex>
                              </Flex>
                            ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Gamification Section */}
                {athlete && (
                  <>
                    <Box mt={8} pt={6} borderTop="1px" borderColor="gray.200">
                      <AchievementsDisplay
                        achievements={achievementsList}
                        userProgress={userAchievements}
                      />
                    </Box>
                  </>
                )}

                {loadingActivities && (
                  <Flex justifyContent="center" marginY={4}>
                    <Spinner color="teal.500" />
                  </Flex>
                )}
              </Box>
            </>
          )}

          <Box maxWidth="1200px" margin="0 auto" px={6}>
            <div className="activity-div">
              {!hideActivities &&
                activities &&
                athlete &&
                activities.length &&
                [...(filteredActivities ? filteredActivities : activities)]
                  .sort(
                    (a, b) =>
                      new Date(b.start_date_local) -
                      new Date(a.start_date_local)
                  )
                  .map((activity) => (
                    <Activity
                      key={activity.id}
                      activity={activity}
                      loadSingleActivity={loadSingleActivity}
                      updateActivityOnStrava={updateActivityOnStrava}
                    />
                  ))}
            </div>
          </Box>
        </>
      )}
    </div>
  );
}

export default Home;
