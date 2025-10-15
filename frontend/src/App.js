// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Navbar from "./components/navbar";
import GamePage from "./pages/gamepage";
import Profile from "./pages/profile";
import Shop from "./pages/shop"; // 👈 Thêm dòng này

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:username" element={<Profile />} />

        {/* 👇 Thêm route mới cho cửa hàng */}
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </BrowserRouter>
  );
}
