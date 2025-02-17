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
import { fetchActivities, updateActivityOnStrava } from "./utils/activities";
import { calculateAchievementProgress } from "./utils/achievementCalculator";
import { achievementsList } from "./utils/achievements";

import { Box, Flex, Text, Button, Spinner } from "@chakra-ui/react";
import Activity from "./components/Activity";
import { RepeatIcon } from "@chakra-ui/icons";
import AchievementsDisplay from "./components/AchievementsDisplay";
import axios from "axios";
import Header from "./components/Header";
import Welcome from "./components/Welcome";
import WeeklyProgress from "./components/WeeklyProgress";
import WeeklyTrainingGrid from "./components/WeeklyTrainingGrid";
import UnmatchedRuns from "./components/UnmatchedRuns";
import RequestTrainingPlan from "./components/RequestTrainingPlan";
import AdminPage from "./components/AdminPage";

function Home({ admin }) {
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
  const [userAchievements, setUserAchievements] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0);

  const [hasTrainingPlanState, setHasTrainingPlanState] = useState(false);
  const [checkingTrainingPlan, setCheckingTrainingPlan] = useState(true);

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

  useEffect(() => {
    if (activities && athlete && !loadingActivities) {
      // Calculate achievements
      const progress = calculateAchievementProgress(activities);
      setUserAchievements(progress);
    }
  }, [activities?.length, athlete?.id, loadingActivities]); // Only recalculate when activities length or athlete ID changes

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

                {/* Gamification Section */}
                {athlete && (
                  <Box
                    mt={6}
                    pt={4}
                    borderTop="1px"
                    borderColor="gray.200"
                    overflow="hidden"
                  >
                    <AchievementsDisplay
                      achievements={achievementsList}
                      userProgress={userAchievements}
                    />
                  </Box>
                )}

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
          >
            <div className="activity-div">
              {activities &&
                athlete &&
                activities.length > 0 &&
                activities
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
