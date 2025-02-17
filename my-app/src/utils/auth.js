import axios from "axios";
import { saveAthlete, clearData } from "./db";

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

    const accessToken = response.data.access_token;
    setAthlete(response.data.athlete);
    setAccessToken(accessToken);
    localStorage.setItem("accessToken", accessToken);
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

export const logout = async (setAthlete, setAccessToken) => {
  setAthlete(null);
  setAccessToken("");
  localStorage.removeItem("accessToken");
  await clearData();
};

export const getMailString = (athlete) => {
  if (!athlete || !athlete.id) {
    return "#";
  }
  return `mailto:lucas.moskau@web.de?subject=${athlete.id}&body=Ich%20h%C3%A4tte%20gerne%20einen%20Trainingsplan!`;
};
