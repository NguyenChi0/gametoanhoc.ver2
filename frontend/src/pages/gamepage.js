// pages/GamePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Game1 from "../components/game1";
import Game2 from "../components/game2";
import Game3 from "../components/game3";
import Game4 from "../components/game4";
import Game5 from "../components/game5";

const SESSION_KEY = "game_play_state_v1"; // phải giống với Home

export default function GamePage() {
  const { gameId } = useParams(); // game1 | game2 | ...
  const location = useLocation();
  const navigate = useNavigate();

  const [payload, setPayload] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // 1) ưu tiên location.state (navigate truyền vào)
    if (location.state) {
      setPayload(location.state);
      // lưu lại để fallback khi reload
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ gameId, payload: location.state, ts: Date.now() })
        );
      } catch (e) {
        console.warn("Không lưu session:", e);
      }
      return;
    }

    // 2) nếu không có location.state, thử đọc sessionStorage
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // kiểm tra gameId khớp
        if (parsed && parsed.gameId === gameId && parsed.payload) {
          setPayload(parsed.payload);
          return;
        }
      }
    } catch (e) {
      console.warn("Lỗi đọc sessionStorage:", e);
    }

    // 3) không có data → thông báo và chuyển về Home sau 2s
    setMessage("Không tìm thấy dữ liệu chơi (state). Quay về trang chọn...");
    const t = setTimeout(() => navigate("/", { replace: true }), 1800);
    return () => clearTimeout(t);
  }, [location.state, gameId, navigate]);

  // Map gameId -> component
  const gameMap = {
    game1: <Game1 payload={payload} />,
    game2: <Game2 payload={payload} />,
    game3: <Game3 payload={payload} />,
    game4: <Game4 payload={payload} />,
    game5: <Game5 payload={payload} />
  };

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      {!payload && message && <div style={{ color: "#666" }}>{message}</div>}
      {!payload && !message && <div>Đang chuẩn bị dữ liệu...</div>}
      {payload && (
        <div>
          {/* hiển thị header thông tin ngắn */}
          <header style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{payload?.game?.name || gameId}</h2>
            <div style={{ color: "#666", fontSize: 13 }}>
              Lớp: {payload?.grade?.id} — Dạng: {payload?.type?.id} — Phép: {payload?.operation?.id}
            </div>
          </header>

          {/* render component theo map; nếu không tồn tại gameId thì báo lỗi */}
          <div>
            {gameMap[gameId] || (
              <div style={{ color: "crimson" }}>
                Giao diện <strong>{gameId}</strong> chưa có — quay về trang chọn.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
