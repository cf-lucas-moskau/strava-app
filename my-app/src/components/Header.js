import React from "react";
import { Box, Button, Heading, Flex, Image } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const Header = ({ handleLogin, athlete }) => {
  // get url and check if it containcs "pace-calculator"

  const url = window.location.href;
  const isPaceCalculator = url.includes("pace-calculator");

  return (
    <Box as="nav" bg="#DBE0DE" paddingY={4} paddingX={4}>
      <Flex
        maxWidth="1200px"
        margin="0 auto"
        justify="space-between"
        align="center"
      >
        {/* Logo or Site Title */}
        <Heading as="h1" size="lg" color="white">
          <Link to="/">
            <Image src={"icon.png"} alt="logo" width="120px" />
          </Link>
        </Heading>

        {/* Right Side - Buttons */}
        {!isPaceCalculator && (
          <Flex align="center">
            <Button
              as={Link}
              to="/pace-calculator"
              colorScheme="teal"
              marginRight={4}
              width={"230px"}
            >
              Pace Calculator
            </Button>
            {/* <Button
            onClick={toggleMode}
            colorScheme="teal"
            marginRight={4}
            width={"200px"}
          >
            Switch to {mode === "Lucas" ? "Sophia" : "Lucas"} mode
          </Button> */}
            {!athlete && (
              <Button onClick={handleLogin} colorScheme="orange">
                Login with Strava
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
