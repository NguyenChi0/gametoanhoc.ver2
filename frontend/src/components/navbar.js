import React from "react";
import { Link, useNavigate } from "react-router-dom";

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
        padding: "10px 20px",
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

        {/* 👇 Thêm link Cửa hàng ở đây */}
        {user && (
          <Link to="/shop" style={styles.link}>
            🛍️ Cửa hàng
          </Link>
        )}
      </div>

      <div>
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
            <span style={{ marginRight: 10, marginLeft: 30 }}>
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
