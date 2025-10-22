// src/pages/leaderboard.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Leaderboard() {
  const [tab, setTab] = useState("all");
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await api.get(`/leaderboard/${tab}`); // expects /leaderboard/all or /leaderboard/week
        // Chỉ lấy top 5 người đầu tiên
        setLeaders(res.data.slice(0, 5));
      } catch (err) {
        console.error("Lỗi khi lấy leaderboard:", err);
      }
    };
    fetchLeaders();
  }, [tab]);

  // Style cho từng top
  const getRankStyle = (index) => {
    const base = {
      ...styles.row,
      position: "relative",
      overflow: "hidden",
    };

    switch (index) {
      case 0: // Vàng
        return {
          ...base,
          border: "2px solid #ffffffff",
          background: "linear-gradient(90deg, #fff024ff, #ffe925ff)",
          boxShadow: "0 0 12px rgba(255, 217, 0, 0.86)",
        };
      case 1: // Bạc
        return {
          ...base,
          border: "2px solid #ffffffff",
          background: "linear-gradient(90deg, #e7e7e7ff, #b6b6b6ff)",
          boxShadow: "0 0 10px rgba(192,192,192,0.7)",
        };
      case 2: // Đồng
        return {
          ...base,
          border: "2px solid #ffffffff",
          background: "linear-gradient(90deg, #ffb055ff, #ff922dff)",
          boxShadow: "0 0 10px rgba(205,127,50,0.6)",
        };
      default: // Các top còn lại
        return {
          ...base,
          border: "1px solid #ddd",
          background: "#74b5ffff",
        };
    }
  };

  return (
    <div style={styles.container}>
      {/* Hiệu ứng CSS */}
      <style>
        {`
          /* Sao sáng lung linh trong mỗi top */
          .sparkle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, white 0%, rgba(255,255,255,0.2) 80%);
  box-shadow: 0 0 6px rgba(255,255,255,0.6);
  animation: sparkleAnim 2.8s infinite ease-in-out;
}

@keyframes sparkleAnim {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}

          /* Ánh sáng quét ngang */
          .shimmer::after {
            content: "";
            position: absolute;
            top: 0;
            left: -75%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              120deg,
              rgba(255,255,255,0) 0%,
              rgba(255,255,255,0.3) 50%,
              rgba(255,255,255,0) 100%
            );
            animation: slideGlow 2.5s infinite;
          }

          @keyframes slideGlow {
            0% { left: -75%; }
            100% { left: 125%; }
          }
        `}
      </style>

      <h2 style={styles.title}>🏆 Bảng xếp hạng</h2>

      <div style={styles.tabs}>
        <button
          style={tab === "week" ? styles.activeTab : styles.tab}
          onClick={() => setTab("week")}
        >
          Top Tuần
        </button>
        <button
          style={tab === "all" ? styles.activeTab : styles.tab}
          onClick={() => setTab("all")}
        >
          Top Tất Cả
        </button>
      </div>

      <div style={styles.table}>
        {leaders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "10px" }}>
            Không có dữ liệu
          </div>
        ) : (
          leaders.map((user, index) => (
            <div
              key={user.username ?? index}
              className={index < 3 ? "shimmer" : ""}
              style={getRankStyle(index)}
            >
              {/* Hiệu ứng sao bên trong từng top */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="sparkle"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3 + 2}px`,
                    height: `${Math.random() * 3 + 2}px`,
                    animationDelay: `${Math.random() * 3}s`,
                  }}
                />
              ))}

              <div style={styles.rank}>
                #{index + 1}{" "}
                {index < 3 && (
                  <span style={styles.medal}>
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : "🥉"}
                  </span>
                )}
              </div>
              <div style={styles.name}>
                <Link
                  to={`/profile/${user.username}`}
                  style={styles.profileLink}
                >
                  {user.fullname || user.username}
                </Link>
              </div>
              <div style={styles.score}>
                {tab === "week"
                  ? user.week_score ?? 0
                  : user.score ?? 0}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    margin: "40px auto",
    width: "90%",
    maxWidth: "600px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    padding: "20px",
  },
  title: {
    textAlign: "center",
    color: "#333",
    marginBottom: "20px",
    fontSize: "24px",
    fontWeight: "bold",
  },
  tabs: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  tab: {
    background: "#eee",
    border: "none",
    padding: "10px 20px",
    margin: "0 8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    color: "#333",
    transition: "all 0.3s ease",
  },
  activeTab: {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    margin: "0 8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,123,255,0.3)",
  },
  table: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "10px",
    padding: "14px 18px",
    position: "relative",
    color: "#333",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  rank: {
    width: "70px",
    fontWeight: "bold",
    fontSize: "16px",
  },
  name: {
    flex: 1,
    fontWeight: "500",
    textAlign: "left",
  },
  score: {
    width: "70px",
    textAlign: "right",
    fontWeight: "bold",
  },
  profileLink: {
    textDecoration: "none",
    color: "#007bff",
    transition: "color 0.2s ease",
  },
  medal: {
    fontSize: "18px",
    marginLeft: "6px",
  },
};
