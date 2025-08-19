// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/theme-provider";

// Layouts & Pages
import PublicLayout from "./layouts/PublicLayout";
import HomePage from "./pages/Home";

// Global UI
// import Footer from "./components/user-interface/footer";

import "./App.css";

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <PublicLayout>
          <HomePage />
        </PublicLayout>
      }
    />
    {/* Fallback: render PublicLayout for unknown routes */}
    <Route path="*" element={<PublicLayout />} />
  </Routes>
);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <AppRoutes />
        {/* <Footer /> */}
      </Router>
    </ThemeProvider>
  );
}

export default App;
