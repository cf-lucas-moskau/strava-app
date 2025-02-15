import React from "react";
import {
  Box,
  Button,
  Heading,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Avatar,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { ChevronDownIcon } from "@chakra-ui/icons";

const Header = ({ handleLogin, athlete, logout }) => {
  // get url and check if it containcs "pace-calculator"

  const url = window.location.href;
  const isPaceCalculator = url.includes("pace-calculator");

  return (
    <Box
      as="nav"
      bg="white"
      boxShadow="sm"
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <Flex
        maxWidth="1200px"
        margin="0 auto"
        justify="space-between"
        align="center"
        height="70px"
        px={4}
      >
        {/* Logo or Site Title */}
        <Link to="/">
          <Image
            src={"icon.png"}
            alt="logo"
            height="40px"
            objectFit="contain"
          />
        </Link>

        {/* Right Side - Buttons */}
        {!isPaceCalculator && (
          <Flex align="center" gap={6}>
            <Button
              as={Link}
              to="/pace-calculator"
              colorScheme="teal"
              size="md"
              px={6}
              width="200px"
            >
              Pace Calculator
            </Button>

            {athlete ? (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  _hover={{ bg: "gray.50" }}
                  _active={{ bg: "gray.100" }}
                  height="48px"
                  px={2}
                >
                  <Flex align="center" gap={3}>
                    <Avatar
                      size="sm"
                      src={athlete.profile}
                      name={athlete.firstname}
                      boxSize="32px"
                    />
                    <Text fontWeight="medium">{athlete.firstname}</Text>
                    <ChevronDownIcon color="gray.500" />
                  </Flex>
                </MenuButton>
                <MenuList shadow="lg" minW="unset" w="160px">
                  <MenuItem
                    onClick={logout}
                    _hover={{ bg: "gray.50" }}
                    fontWeight="medium"
                    color="red.500"
                    w="125px"
                  >
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                onClick={handleLogin}
                colorScheme="orange"
                size="md"
                px={6}
              >
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
