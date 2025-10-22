// src/pages/leaderboard2.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Leaderboard() {
  const [tab, setTab] = useState("all");
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await api.get(`/leaderboard/${tab}`);
        setLeaders(res.data.slice(0, 5));
      } catch (err) {
        console.error("Lỗi khi lấy leaderboard:", err);
      }
    };
    fetchLeaders();
  }, [tab]);

  const getRankStyle = (index) => {
    const base = {
      ...styles.row,
      position: "relative",
      overflow: "hidden",
    };

    switch (index) {
      case 0:
        return {
          ...base,
          border: "1px solid rgba(255, 215, 0, 0.3)",
          background: "linear-gradient(45deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))",
          color: "white",
        };
      case 1:
        return {
          ...base,
          border: "1px solid rgba(192, 192, 192, 0.3)",
          background: "linear-gradient(45deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1))",
          color: "white",
        };
      case 2:
        return {
          ...base,
          border: "1px solid rgba(205, 127, 50, 0.3)",
          background: "linear-gradient(45deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1))",
          color: "white",
        };
      default:
        return {
          ...base,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.1)",
          color: "white",
        };
    }
  };

  return (
    <div style={styles.container}>
      {/* CSS Styles */}
      <style>
        {`
          .leaderboard-item {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .leaderboard-item:hover {
            transform: translateX(5px);
            background: rgba(255, 255, 255, 0.15) !important;
          }

          /* Hiệu ứng cho Top 1 */
          .top1 {
            background: linear-gradient(45deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1)) !important;
            border: 1px solid rgba(255, 215, 0, 0.3) !important;
          }

          .top1::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 215, 0, 0.4),
              transparent
            );
            animation: goldShine 3s ease-in-out infinite;
            z-index: 1;
          }

          /* Container cho các chấm sáng vàng bay top1 */
          .top1::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            pointer-events: none;
          }

          .stars-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .star {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #FFD700;
            border-radius: 50%;
            box-shadow: 0 0 6px #FFD700, 0 0 12px #FFD700;
            opacity: 0;
            animation: starFloat 4s ease-in-out infinite;
          }

          .star:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
          .star:nth-child(2) { top: 60%; left: 80%; animation-delay: 1s; }
          .star:nth-child(3) { top: 80%; left: 30%; animation-delay: 2s; }
          .star:nth-child(4) { top: 30%; left: 70%; animation-delay: 3s; }
          .star:nth-child(5) { top: 70%; left: 20%; animation-delay: 1.5s; }

          /* Hiệu ứng cho Top 2 */
          .top2 {
            background: linear-gradient(45deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1)) !important;
            border: 1px solid rgba(192, 192, 192, 0.3) !important;
          }

          .top2::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(192, 192, 192, 0.4),
              transparent
            );
            animation: silverShine 4s ease-in-out infinite;
            z-index: 1;
          }

          /* Container cho các chấm sáng bạc bay top2 */
          .top2-effects {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .silver-crystal {
            position: absolute;
            width: 3px;
            height: 3px;
            background: #C0C0C0;
            border-radius: 50%;
            box-shadow: 0 0 5px #C0C0C0, 0 0 10px #C0C0C0;
            opacity: 0;
            animation: crystalFloat 3s ease-in-out infinite;
          }

          .silver-crystal:nth-child(1) { top: 10%; left: 15%; animation-delay: 0s; }
          .silver-crystal:nth-child(2) { top: 70%; left: 85%; animation-delay: 1s; }
          .silver-crystal:nth-child(3) { top: 85%; left: 25%; animation-delay: 2s; }
          .silver-crystal:nth-child(4) { top: 25%; left: 75%; animation-delay: 1.5s; }

          /* Hiệu ứng cho Top 3 */
          .top3 {
            background: linear-gradient(45deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1)) !important;
            border: 1px solid rgba(205, 127, 50, 0.3) !important;
          }

          .top3::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(205, 127, 50, 0.4),
              transparent
            );
            animation: bronzeShine 5s ease-in-out infinite;
            z-index: 1;
          }

          /* Container cho các chấm sáng đồng bay top3 */
          .top3-effects {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .bronze-leaf {
            position: absolute;
            width: 3px;
            height: 3px;
            background: #CD7F32;
            border-radius: 50%;
            box-shadow: 0 0 5px #CD7F32, 0 0 10px #CD7F32;
            opacity: 0;
            animation: leafFloat 4s ease-in-out infinite;
          }

          .bronze-leaf:nth-child(1) { top: 15%; left: 10%; animation-delay: 0s; }
          .bronze-leaf:nth-child(2) { top: 65%; left: 90%; animation-delay: 1.2s; }
          .bronze-leaf:nth-child(3) { top: 80%; left: 20%; animation-delay: 2.4s; }
          .bronze-leaf:nth-child(4) { top: 30%; left: 80%; animation-delay: 1.8s; }

          /* Animations */
          @keyframes goldShine {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: 100%; }
          }

          @keyframes silverShine {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: 100%; }
          }

          @keyframes bronzeShine {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: 100%; }
          }

          @keyframes starFloat {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0;
            }
            25% { opacity: 1; }
            50% {
              transform: translateY(-20px) translateX(10px) rotate(180deg);
              opacity: 0.7;
            }
            75% { opacity: 0.3; }
            100% {
              transform: translateY(-40px) translateX(20px) rotate(360deg);
              opacity: 0;
            }
          }

          @keyframes crystalFloat {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0;
            }
            25% { opacity: 0.8; }
            50% {
              transform: translateY(-15px) translateX(8px) rotate(120deg);
              opacity: 0.6;
            }
            75% { opacity: 0.4; }
            100% {
              transform: translateY(-30px) translateX(15px) rotate(240deg);
              opacity: 0;
            }
          }

          @keyframes leafFloat {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0;
            }
            20% { opacity: 0.7; }
            40% {
              transform: translateY(-12px) translateX(5px) rotate(90deg);
              opacity: 0.5;
            }
            60% { opacity: 0.3; }
            80% {
              transform: translateY(-24px) translateX(10px) rotate(180deg);
              opacity: 0.1;
            }
            100% {
              transform: translateY(-30px) translateX(12px) rotate(270deg);
              opacity: 0;
            }
          }

          /* Đảm bảo nội dung hiển thị trên cùng các hiệu ứng nền */
          .rank,
          .name,
          .score {
            position: relative;
            z-index: 2;
          }

          @media (max-width: 768px) {
            .leaderboard-item {
              padding: 12px 16px !important;
            }
            
            .rank,
            .score {
              width: 60px;
              font-size: 14px;
            }
            
            .name {
              font-size: 1rem;
            }
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
          <div style={{ textAlign: "center", padding: "10px", color: "rgba(255, 255, 255, 0.8)" }}>
            Không có dữ liệu
          </div>
        ) : (
          leaders.map((user, index) => (
            <div
              key={user.username ?? index}
              className={`leaderboard-item ${index === 0 ? 'top1' : index === 1 ? 'top2' : index === 2 ? 'top3' : ''}`}
              style={getRankStyle(index)}
            >
              {/* Hiệu ứng sao cho top1 */}
              {index === 0 && (
                <div className="stars-container">
                  <div className="star"></div>
                  <div className="star"></div>
                  <div className="star"></div>
                  <div className="star"></div>
                  <div className="star"></div>
                </div>
              )}

              {/* Hiệu ứng crystal cho top2 */}
              {index === 1 && (
                <div className="top2-effects">
                  <div className="silver-crystal"></div>
                  <div className="silver-crystal"></div>
                  <div className="silver-crystal"></div>
                  <div className="silver-crystal"></div>
                </div>
              )}

              {/* Hiệu ứng leaf cho top3 */}
              {index === 2 && (
                <div className="top3-effects">
                  <div className="bronze-leaf"></div>
                  <div className="bronze-leaf"></div>
                  <div className="bronze-leaf"></div>
                  <div className="bronze-leaf"></div>
                </div>
              )}

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
    background: "rgba(66, 66, 66, 1)",
    backdropFilter: "blur(10px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  },
  title: {
    textAlign: "center",
    color: "white",
    marginBottom: "20px",
    fontSize: "2rem",
    fontWeight: "700",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
  },
  tabs: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
    gap: "1rem",
  },
  tab: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "12px 24px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  activeTab: {
    background: "linear-gradient(45deg, #ff6b6b, #ee5a24)",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(255, 107, 107, 0.4)",
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
    borderRadius: "12px",
    padding: "16px 20px",
    position: "relative",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  rank: {
    width: "70px",
    fontWeight: "bold",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  name: {
    flex: 1,
    fontWeight: "600",
    textAlign: "left",
    fontSize: "1.1rem",
  },
  score: {
    width: "70px",
    textAlign: "right",
    fontWeight: "bold",
    color: "#4ecdc4",
    fontSize: "1rem",
  },
  profileLink: {
    textDecoration: "none",
    color: "white",
    transition: "color 0.2s ease",
  },
  medal: {
    fontSize: "1.2rem",
  },
};