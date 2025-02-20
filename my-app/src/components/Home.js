const Home = ({ currentUser }) => {
  // ... existing code ...

  return (
    <Box>
      {/* ... existing content ... */}

      {/* My Activities */}
      <VStack spacing={4} align="stretch">
        {activities.map((activity) => (
          <Activity
            key={activity.id}
            activity={activity}
            runnerProfile={runnerProfiles[activity.athlete.id]}
            currentUser={currentUser}
          />
        ))}
      </VStack>

      {/* Group Activities */}
      <VStack spacing={4} align="stretch">
        {groupActivities.map((activity) => (
          <Activity
            key={activity.id}
            activity={activity}
            runnerProfile={runnerProfiles[activity.athlete.id]}
            currentUser={currentUser}
          />
        ))}
      </VStack>
    </Box>
  );
};
