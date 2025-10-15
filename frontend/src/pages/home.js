// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Leaderboard from "../components/leaderboard";
import ChooseLesson from "../components/chooselesson";

const SESSION_KEY = "game_play_state_v1";

export default function Home() {
  const navigate = useNavigate();

  function persistPlayState(gameId, payload) {
    try {
      const saved = { gameId, payload, ts: Date.now() };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));
    } catch (e) {
      console.warn("Không lưu được state chơi:", e);
    }
  }

  function handleStartGame(gameInterface, payload) {
    persistPlayState(gameInterface, payload);
    navigate(`/game/${gameInterface}`, { state: payload });
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Chọn bài học và bắt đầu chơi</h2>

      {/* 👉 Component chọn bài */}
      <ChooseLesson onStartGame={handleStartGame} />

      {/* 🏆 Bảng xếp hạng */}
      <Leaderboard />
    </div>
  );
}
