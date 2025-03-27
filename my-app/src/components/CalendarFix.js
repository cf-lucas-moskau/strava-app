import React from "react";

export const CalendarFix = () => {
  return (
    <VStack spacing={4} align="stretch">
      {groupTrainingsByWeek(trainings).map((week, weekIndex) => (
        <Box key={weekIndex}>
          <Flex>
            <Text>Week header</Text>
          </Flex>

          <SimpleGrid columns={7}>
            {week.days.map((dayTrainings, dayIndex) => {
              return (
                <Box key={dayIndex}>
                  <Text>Day content</Text>
                </Box>
              );
            })}
          </SimpleGrid>
        </Box>
      ))}
    </VStack>
  );
};
