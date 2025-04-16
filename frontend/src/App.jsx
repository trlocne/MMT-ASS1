import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import ServerSidebar from "./components/Sidebar/ServerSidebar";
import ChannelSidebar from "./components/Sidebar/ChannelSidebar";
import MainContent from "./components/MainContent/MainContent";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import MemberList from "./components/MainContent/Member.jsx";
import { GlobalContext } from "./context/index.jsx";

export default function App() {
  const MainApp = () => (
    <div className="bg-gray-900 text-gray-100 h-screen flex overflow-hidden">
      <ServerSidebar />
      <ChannelSidebar />
      <MainContent />
      {isMemberListVisible ? <MemberList /> : null}
    </div>
  );

  const {isMemberListVisible, isAuthenticated} = useContext(GlobalContext);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!isAuthenticated ? <Signup /> : <Navigate to="/" />}
        />
        <Route
          path="/*"
          element={isAuthenticated ? <MainApp /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}
