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
import RunView from "./components/RunView";
import UpdateNotification from "./components/UpdateNotification";
import AdminPage from "./components/AdminPage";

function App() {
  return (
    <Router>
      <UpdateNotification />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pace-calculator" element={<PaceCalculator />} />
        <Route path="/run/:id" element={<RunView />} />
        <Route path="/callback" element={<Home />} />
        <Route path="/admin" element={<Home admin={true} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
