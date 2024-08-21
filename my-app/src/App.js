// App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./Home"; // Assuming Home is your default component
import PaceCalculator from "./PaceCalculator"; // Assuming this is the component for /pace-calculator

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Home />} />
        <Route path="/pace-calculator" element={<PaceCalculator />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
