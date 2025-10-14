// pages/Register.jsx
import React, { useState } from "react";
import api from "../api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState(""); // nếu muốn gửi fullname
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Gọi backend: /api/register
      const res = await api.post("/register", { username, password, fullname });
      setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Lỗi khi đăng ký!";
      setMessage(msg);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Đăng ký</h2>
      <form onSubmit={handleRegister} style={styles.form}>
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
        <input
          type="text"
          placeholder="Họ tên (tùy chọn)"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />
        <button type="submit">Đăng ký</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", marginTop: 50 },
  form: { display: "flex", flexDirection: "column", width: 200, margin: "0 auto", gap: 10 },
};
