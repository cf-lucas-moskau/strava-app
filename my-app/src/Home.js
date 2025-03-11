import React, { useEffect, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { useToast, useBreakpointValue } from "@chakra-ui/react";
import {
  getActivities,
  saveAthlete,
  getAthlete as getAthleteFromDB,
  clearData,
} from "./utils/db";
import { claimToken, checkAndUpdateClaimedTokens } from "./utils/tokens";
import { hasTrainingPlan } from "./utils/training";
import { handleLogin, handleAuthorizationCallback, logout } from "./utils/auth";
import {
  fetchActivities,
  updateActivityOnStrava,
  fetchGroupActivities,
} from "./utils/activities";
import { getUserProfile, getAvailableCosmetics } from "./utils/cosmetics";
import axios from "axios";

import {
  Box,
  Flex,
  Text,
  Button,
  Spinner,
  ButtonGroup,
  VStack,
} from "@chakra-ui/react";
import Activity from "./components/Activity";
import { RepeatIcon } from "@chakra-ui/icons";
import Header from "./components/Header";
import Welcome from "./components/Welcome";
import WeeklyProgress from "./components/WeeklyProgress";
import WeeklyTrainingGrid from "./components/WeeklyTrainingGrid";
import UnmatchedRuns from "./components/UnmatchedRuns";
import RequestTrainingPlan from "./components/RequestTrainingPlan";
import AdminPage from "./components/AdminPage";
import Profile from "./components/Profile";
import { getValidAccessToken } from "./utils/auth";

function Home({ admin, profile }) {
  const navigate = useNavigate();
  const toast = useToast();

  // Move all breakpoint values to the top level
  const containerPadding = useBreakpointValue({ base: 3, md: 6 });
  const containerMaxWidth = useBreakpointValue({ base: "100%", md: "1200px" });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const buttonText = useBreakpointValue({
    base: "Refresh",
    md: "Refresh Activities",
  });

  const [tokens, setTokens] = useState(
    parseInt(localStorage.getItem("tokens")) || 0
  );
  const [unclaimedTokens, setUnclaimedTokens] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = previous week

  const [accessToken, setAccessToken] = useState("");
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0);

  const [hasTrainingPlanState, setHasTrainingPlanState] = useState(false);
  const [checkingTrainingPlan, setCheckingTrainingPlan] = useState(true);

  const [userProfile, setUserProfile] = useState(null);
  const [cosmetics, setCosmetics] = useState({});

  const [feedType, setFeedType] = useState("group"); // 'group' or 'own'
  const [groupActivities, setGroupActivities] = useState([]);
  const [loadingGroupActivities, setLoadingGroupActivities] = useState(false);

  const [runnerProfiles, setRunnerProfiles] = useState({});

  // Function to handle logging out
  const handleLogout = async () => {
    try {
      await logout(setAthlete, setAccessToken, navigate, toast);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Initialize app data
  useEffect(() => {
    const init = async () => {
      if (isInitialized) return;

      try {
        // Try to load data from IndexedDB first
        const storedAthlete = await getAthleteFromDB();
        const storedActivities = await getActivities();

        // Set stored data if available
        if (storedAthlete) {
          setAthlete(storedAthlete);
        }
        if (storedActivities && storedActivities.length > 0) {
          setActivities(storedActivities);
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

        // Check for valid access token and logout if not found
        const storedAccessToken = await getValidAccessToken(
          storedAthlete?.id,
          setAthlete,
          setAccessToken,
          navigate,
          toast
        );

        if (!storedAccessToken) {
          console.log("No valid access token found");
          return; // The getValidAccessToken function will handle logout for us
        }

        setAccessToken(storedAccessToken);

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
              // Token is invalid, logout
              handleLogout();
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
        toast,
        setAthlete,
        setAccessToken,
        navigate
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

    // Check tokens whenever activities change
    if (athlete && activities) {
      checkAndUpdateClaimedTokens(
        athlete,
        activities,
        weekOffset,
        setTokens,
        setUnclaimedTokens
      );
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isInitialized, athlete, activities, weekOffset]);

  const loadSingleActivity = async (activityId) => {
    navigate(`/run/${activityId}`);
  };

  const getWeekLabel = (offset = 0) => {
    if (offset === 0) return "This Week";
    if (offset === 1) return "Next Week";
    if (offset === -1) return "Last Week";
    return offset > 0
      ? `${offset} Weeks Ahead`
      : `${Math.abs(offset)} Weeks Ago`;
  };

  // Add new useEffect for checking training plan
  useEffect(() => {
    const checkTrainingPlan = async () => {
      if (!athlete?.id) {
        setHasTrainingPlanState(false);
        setCheckingTrainingPlan(false);
        return;
      }

      try {
        const hasPlan = await hasTrainingPlan(athlete.id);
        setHasTrainingPlanState(hasPlan);
      } catch (error) {
        console.error("Error checking training plan:", error);
        setHasTrainingPlanState(false);
      } finally {
        setCheckingTrainingPlan(false);
      }
    };

    checkTrainingPlan();
  }, [athlete?.id]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (athlete?.id) {
        try {
          const [profileData, cosmeticsData] = await Promise.all([
            getUserProfile(athlete.id),
            getAvailableCosmetics(),
          ]);
          setUserProfile(profileData);
          setCosmetics(cosmeticsData);
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      }
    };
    fetchProfileData();
  }, [athlete]);

  // Get the equipped activity theme
  const getEquippedTheme = () => {
    if (!userProfile?.equipped?.activityTheme || !cosmetics) return null;
    return cosmetics[userProfile.equipped.activityTheme];
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

  // Add new useEffect for fetching group activities
  useEffect(() => {
    const fetchGroupFeed = async () => {
      if (!athlete?.id) return;

      setLoadingGroupActivities(true);
      try {
        const activities = await fetchGroupActivities(athlete.id);
        setGroupActivities(activities);
      } catch (error) {
        console.error("Error fetching group activities:", error);
        toast({
          title: "Error",
          description: "Failed to load group activities",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingGroupActivities(false);
      }
    };

    if (feedType === "group") {
      fetchGroupFeed();
    }
  }, [athlete?.id, feedType]);

  // Add new useEffect for fetching runner profiles
  useEffect(() => {
    const fetchRunnerProfiles = async () => {
      if (!activities || !groupActivities) return;

      const allActivities = [...(activities || []), ...groupActivities];
      const uniqueAthleteIds = [
        ...new Set(allActivities.map((a) => a.athlete.id)),
      ];

      console.log("Fetching profiles for athletes:", uniqueAthleteIds);

      const profiles = {};
      await Promise.all(
        uniqueAthleteIds.map(async (athleteId) => {
          try {
            const profile = await getUserProfile(athleteId);
            if (profile?.name) {
              profiles[athleteId] = profile;
            }
          } catch (error) {
            console.error(
              `Error fetching profile for athlete ${athleteId}:`,
              error
            );
          }
        })
      );

      console.log("Fetched runner profiles:", profiles);
      setRunnerProfiles(profiles);
    };

    fetchRunnerProfiles();
  }, [activities, groupActivities]);

  if (!athlete) {
    return (
      <Box>
        <Header handleLogin={handleLogin} athlete={athlete} />
        <Welcome handleLogin={handleLogin} />
      </Box>
    );
  }

  if (profile) {
    return (
      <Box>
        <Header
          handleLogin={handleLogin}
          athlete={athlete}
          logout={logout}
          tokens={tokens}
        />
        <Profile athlete={athlete} activities={activities} />
      </Box>
    );
  }

  if (admin) {
    return <AdminPage athlete={athlete} />;
  }

  return (
    <div>
      {isLoading || checkingTrainingPlan ? (
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
            logout={logout}
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
                    p={4}
                    borderRadius="lg"
                    boxShadow="xl"
                    textAlign="center"
                    mx={3}
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

              {/* Refresh Activities button */}
              <Box
                maxWidth={containerMaxWidth}
                margin="0 auto"
                px={containerPadding}
                py={3}
              >
                <Flex gap={4}>
                  <Button
                    onClick={fetchActivitiesWithDebounce}
                    colorScheme="teal"
                    size={buttonSize}
                    flex="1"
                    isLoading={loadingActivities}
                    loadingText="Refreshing..."
                    leftIcon={<RepeatIcon />}
                  >
                    {buttonText}
                  </Button>
                </Flex>
              </Box>

              <Box
                maxWidth={containerMaxWidth}
                margin="0 auto"
                px={containerPadding}
              >
                {athlete && athlete.id && hasTrainingPlanState ? (
                  <Box>
                    <WeeklyProgress
                      weekOffset={weekOffset}
                      setWeekOffset={setWeekOffset}
                      athlete={athlete}
                      activities={activities}
                      getWeekLabel={getWeekLabel}
                    />

                    <Box overflow="hidden" width="100%">
                      <WeeklyTrainingGrid
                        athlete={athlete}
                        activities={activities}
                        weekOffset={weekOffset}
                        unclaimedTokens={unclaimedTokens}
                        onClaimToken={(training, matchedActivity) =>
                          claimToken(
                            athlete,
                            matchedActivity,
                            setTokens,
                            setUnclaimedTokens
                          )
                        }
                        tokenDisplay={tokenDisplay}
                      />
                    </Box>

                    <UnmatchedRuns
                      athlete={athlete}
                      activities={activities}
                      weekOffset={weekOffset}
                      getWeekLabel={getWeekLabel}
                    />
                  </Box>
                ) : athlete && athlete.id ? (
                  <Box px={2}>
                    <RequestTrainingPlan athlete={athlete} />
                  </Box>
                ) : null}

                {loadingActivities && (
                  <Flex justifyContent="center" my={4}>
                    <Spinner color="teal.500" />
                  </Flex>
                )}
              </Box>
            </>
          )}

          <Box
            maxWidth={containerMaxWidth}
            margin="0 auto"
            px={containerPadding}
            mt={8}
          >
            <Flex justify="space-between" align="center" mb={6}>
              <ButtonGroup isAttached variant="outline">
                <Button
                  onClick={() => setFeedType("group")}
                  colorScheme={feedType === "group" ? "teal" : "gray"}
                >
                  Group Feed
                </Button>
                <Button
                  onClick={() => setFeedType("own")}
                  colorScheme={feedType === "own" ? "teal" : "gray"}
                >
                  My Activities
                </Button>
              </ButtonGroup>
            </Flex>

            {(loadingActivities || loadingGroupActivities) && (
              <Flex justifyContent="center" my={4}>
                <Spinner color="teal.500" />
              </Flex>
            )}

            <Box>
              {/* Activities Feed */}
              <VStack spacing={4} align="stretch">
                {feedType === "own"
                  ? // My Activities
                    activities?.map((activity) => (
                      <Activity
                        key={activity.id}
                        activity={activity}
                        runnerProfile={runnerProfiles[activity.athlete.id]}
                        currentUser={athlete}
                        cosmetics={cosmetics}
                      />
                    ))
                  : // Group Activities
                    groupActivities?.map((activity) => (
                      <Activity
                        key={activity.id}
                        activity={activity}
                        runnerProfile={runnerProfiles[activity.athlete.id]}
                        currentUser={athlete}
                        cosmetics={cosmetics}
                      />
                    ))}
              </VStack>
            </Box>
          </Box>
        </>
      )}
    </div>
  );
}

export default Home;
