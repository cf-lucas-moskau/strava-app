import React, { useEffect, useRef } from "react";
import { Box, Center, Icon, Text, VStack } from "@chakra-ui/react";
import { FaRunning } from "react-icons/fa";

const decodePolyline = (encoded) => {
  if (!encoded) return [];

  let points = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
};

const RoutePreview = ({ summaryPolyline, height = "150px", type = "Run" }) => {
  const canvasRef = useRef(null);
  const points = decodePolyline(summaryPolyline);

  useEffect(() => {
    if (!summaryPolyline || points.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas size to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Find bounds of the route
    const bounds = points.reduce(
      (acc, [lat, lng]) => ({
        minLat: Math.min(acc.minLat, lat),
        maxLat: Math.max(acc.maxLat, lat),
        minLng: Math.min(acc.minLng, lng),
        maxLng: Math.max(acc.maxLng, lng),
      }),
      {
        minLat: Infinity,
        maxLat: -Infinity,
        minLng: Infinity,
        maxLng: -Infinity,
      }
    );

    // Add padding to bounds (5% on each side)
    const latPadding = (bounds.maxLat - bounds.minLat) * 0.05;
    const lngPadding = (bounds.maxLng - bounds.minLng) * 0.05;
    bounds.minLat -= latPadding;
    bounds.maxLat += latPadding;
    bounds.minLng -= lngPadding;
    bounds.maxLng += lngPadding;

    // Function to convert coordinates to canvas points
    const toCanvasPoint = (lat, lng) => {
      const x =
        ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) *
        canvas.width;
      const y =
        ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) *
        canvas.height;
      return [x, y];
    };

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the route
    ctx.beginPath();
    points.forEach(([lat, lng], index) => {
      const [x, y] = toCanvasPoint(lat, lng);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Style the line
    ctx.strokeStyle = "#3182CE"; // Chakra UI blue.500
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Draw start point
    const [startX, startY] = toCanvasPoint(points[0][0], points[0][1]);
    ctx.beginPath();
    ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#38A169"; // Chakra UI green.500
    ctx.fill();

    // Draw end point
    const [endX, endY] = toCanvasPoint(
      points[points.length - 1][0],
      points[points.length - 1][1]
    );
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#E53E3E"; // Chakra UI red.500
    ctx.fill();
  }, [summaryPolyline, points]);

  if (!summaryPolyline || points.length === 0) {
    return (
      <Box
        width="100%"
        height={height}
        borderRadius="md"
        bg="gray.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={2}>
          <Icon as={FaRunning} boxSize="2em" color="gray.400" />
          <Text fontSize="sm" color="gray.500" fontWeight="medium">
            Indoor {type}
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      width="100%"
      height={height}
      borderRadius="md"
      overflow="hidden"
      bg="gray.50"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </Box>
  );
};

export default RoutePreview;
