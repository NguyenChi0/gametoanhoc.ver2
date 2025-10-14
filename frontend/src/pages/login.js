// pages/Login.jsx
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
      // Gọi backend: /api/login
      const res = await api.post("/login", { username, password });

      const { user, message: msg } = res.data || {};

      if (!user) {
        setMessage("Đăng nhập thất bại. Kiểm tra backend.");
        return;
      }

      // Lưu user tạm (backend chưa trả token)
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
    <div style={styles.container}>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="text"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Đăng nhập</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", marginTop: 50 },
  form: {
    display: "flex",
    flexDirection: "column",
    width: 200,
    margin: "0 auto",
    gap: 10,
  },
};
