import React from "react";
import { Link, useNavigate } from "react-router-dom";
import MusicPlayer from "./musicplayer"; // 👈 thêm dòng này

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 10px",
        background: "#007bff",
        color: "#fff",
      }}
    >
      <div>
        <Link
          to="/"
          style={{
            color: "#fff",
            textDecoration: "none",
            fontWeight: "bold",
            marginRight: 15,
          }}
        >
          🧮 Trang chủ
        </Link>

        {user && (
          <Link to="/shop" style={styles.link}>
            🛍️ Cửa hàng
          </Link>
        )}
      </div>

      {/* 👇 Thêm trình phát nhạc mini vào Navbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <MusicPlayer /> {/* 🎵 Trình phát nhạc */}
        {!user ? (
          <>
            <Link to="/login" style={styles.link}>
              Đăng nhập
            </Link>
            <Link to="/register" style={styles.link}>
              Đăng ký
            </Link>
          </>
        ) : (
          <>
            <Link to="/profile" style={styles.link}>
              Trang cá nhân
            </Link>
            <span style={{ marginRight: 5, marginLeft: 15 }}>
              Xin chào, {user.username}!
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Đăng xuất
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  link: {
    color: "#fff",
    marginLeft: 12,
    textDecoration: "none",
  },
  logoutBtn: {
    background: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 4,
    cursor: "pointer",
  },
};
