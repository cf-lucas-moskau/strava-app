import axios from "axios";
import { saveAthlete, clearData } from "./db";
import { getAuth, signOut } from "firebase/auth";

export const handleLogin = () => {
  const clientId = "107512";
  const redirectUri = window.location.href.includes("localhost")
    ? "http:%2F%2Flocalhost:3000"
    : "https%3A%2F%2Fstrava-app-gamma.vercel.app";

  const authorizationUrl = `https://www.strava.com/oauth/authorize?approval_prompt=force&client_id=${clientId}&redirect_uri=${redirectUri}/callback&response_type=code&scope=activity:read_all,activity:write`;

  window.location.href = authorizationUrl;
};

export const handleAuthorizationCallback = async (
  setAthlete,
  setAccessToken,
  navigate
) => {
  const code = new URLSearchParams(window.location.search).get("code");
  if (!code) {
    console.log("No authorization code found in URL");
    return;
  }

  const clientId = "107512";
  const clientSecret = "1a8f803010a6cd40f81e426960729461ebc7523c";
  const redirectUri = window.location.href.includes("localhost")
    ? "http:%2F%2Flocalhost:3000"
    : "https%3A%2F%2Fstrava-app-gamma.vercel.app";

  const tokenUrl = "https://www.strava.com/oauth/token";

  try {
    const response = await axios.post(tokenUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const { access_token, refresh_token, expires_at } = response.data;
    setAthlete(response.data.athlete);
    setAccessToken(access_token);

    // Store all token information
    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    localStorage.setItem("tokenExpiresAt", expires_at);

    navigate("/");
  } catch (error) {
    console.error("Error exchanging authorization code for access token:", {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });
  }
};

export const refreshAccessToken = async (
  setAthlete = null,
  setAccessToken = null
) => {
  const clientId = "107512";
  const clientSecret = "1a8f803010a6cd40f81e426960729461ebc7523c";
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    // If no refresh token is available, force logout
    if (setAthlete && setAccessToken) {
      await logout(setAthlete, setAccessToken);
    }
    throw new Error("No refresh token available");
  }

  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const { access_token, refresh_token, expires_at } = response.data;

    // Update stored tokens
    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    localStorage.setItem("tokenExpiresAt", expires_at);

    return access_token;
  } catch (error) {
    console.error(
      "Error refreshing access token:",
      error.response?.data || error
    );
    // If token refresh fails, force logout
    if (setAthlete && setAccessToken) {
      await logout(setAthlete, setAccessToken);
    }
    throw error;
  }
};

export const getValidAccessToken = async (
  athleteId,
  setAthlete = null,
  setAccessToken = null,
  navigate = null,
  toast = null
) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const expiresAt = parseInt(localStorage.getItem("tokenExpiresAt"));
  const accessToken = localStorage.getItem("accessToken");

  // If token is missing entirely
  if (!accessToken) {
    console.log("No access token found, user needs to log in");
    if (setAthlete && setAccessToken) {
      // Only attempt to logout if we have the setter functions
      await logout(setAthlete, setAccessToken, navigate, toast);
    }
    return null;
  }

  // If token is expired or will expire in the next 5 minutes
  if (!expiresAt || currentTime > expiresAt - 300) {
    try {
      return await refreshAccessToken(setAthlete, setAccessToken);
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      if (setAthlete && setAccessToken) {
        // Only attempt to logout if we have the setter functions
        await logout(setAthlete, setAccessToken, navigate, toast);
      }
      return null;
    }
  }

  return accessToken;
};

export const logout = async (setAthlete, setAccessToken, navigate, toast) => {
  try {
    // Firebase signout
    const auth = getAuth();
    await signOut(auth);

    // Clear state
    setAthlete(null);
    setAccessToken("");

    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiresAt");

    // Clear IndexedDB data
    await clearData();

    // Show notification if toast is provided
    if (toast) {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    }

    // Navigate to login if navigate function is provided
    if (navigate) {
      navigate("/");
    }
  } catch (error) {
    console.error("Error during logout:", error);
    // Still attempt to clear everything even if there was an error
    setAthlete?.(null);
    setAccessToken?.("");
  }
};

export const getMailString = (athlete) => {
  if (!athlete || !athlete.id) {
    return "#";
  }
  return `mailto:lucas.moskau@web.de?subject=${athlete.id}&body=Ich%20h%C3%A4tte%20gerne%20einen%20Trainingsplan!`;
};
