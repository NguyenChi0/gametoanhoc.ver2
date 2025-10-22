import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/login", { username, password });
      const { user, message: msg } = res.data || {};

      if (!user) {
        setMessage("Đăng nhập thất bại. Kiểm tra backend.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      setMessage(msg || "Đăng nhập thành công");
      navigate("/");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu!";
      setMessage(msg);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <form onSubmit={handleLogin} style={styles.form}>
          <h2 style={styles.title}>Đăng nhập</h2>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Đăng nhập
          </button>
          <p style={styles.message}>{message}</p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundImage: "url('/component-images/login-background.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 4px 25px rgba(0, 0, 0, 0.2)",
    backdropFilter: "blur(6px)",
    width: "90%",
    maxWidth: "300px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  title: {
    textAlign: "center",
    color: "#333",
    marginBottom: "10px",
  },
  input: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "2px solid #ccc",
    outline: "none",
    transition: "0.3s",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  button: {
    padding: "12px",
    background: "linear-gradient(90deg, #3f3f3fff, #00b4d8)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.3s",
  },
  message: {
    textAlign: "center",
    color: "#d9534f",
    fontWeight: 500,
    marginTop: "10px",
  },
};

// Responsive inline style tweaks
// Vì inline styles không có media query, ta thêm logic JS
// để tự điều chỉnh theo kích thước màn hình
if (window.innerWidth < 768) {
  styles.overlay.width = "85%";
  styles.overlay.padding = "30px";
  styles.input.fontSize = "15px";
  styles.button.fontSize = "15px";
}

if (window.innerWidth < 480) {
  styles.overlay.width = "90%";
  styles.overlay.padding = "20px";
  styles.title.fontSize = "20px";
}
