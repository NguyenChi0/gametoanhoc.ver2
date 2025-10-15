// src/pages/leaderboard.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api"; // axios instance, baseURL = http://localhost:5000/api

export default function Leaderboard() {
  const [tab, setTab] = useState("all");
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await api.get(`/leaderboard/${tab}`); // expects /leaderboard/all or /leaderboard/week
        setLeaders(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy leaderboard:", err);
      }
    };
    fetchLeaders();
  }, [tab]);

  return (
    <div style={styles.container}>
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

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thtd}>Hạng</th>
            <th style={styles.thtd}>Tên người chơi</th>
            <th style={styles.thtd}>Điểm</th>
          </tr>
        </thead>
        <tbody>
          {leaders.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", padding: "10px" }}>
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            leaders.map((user, index) => (
              <tr key={user.username ?? index} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={styles.thtd}>#{index + 1}</td>
                <td style={styles.thtd}>
                  {/* Link tới trang profile của người khác */}
                  <Link to={`/profile/${user.username}`} style={styles.profileLink}>
                    {user.fullname || user.username}
                  </Link>
                </td>
                <td style={styles.thtd}>{tab === "week" ? (user.week_score ?? 0) : (user.score ?? 0)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    margin: "40px auto",
    width: "90%",
    maxWidth: "600px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    padding: "20px",
  },
  title: { textAlign: "center", color: "#333" },
  tabs: { display: "flex", justifyContent: "center", marginBottom: "15px" },
  tab: {
    background: "#eee",
    border: "none",
    padding: "8px 16px",
    margin: "0 4px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  activeTab: {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    margin: "0 4px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  thtd: {
    border: "none",
    padding: "10px 8px",
    textAlign: "left",
  },
  profileLink: {
    textDecoration: "none",
    color: "#007bff",
    fontWeight: 500,
  },
};
