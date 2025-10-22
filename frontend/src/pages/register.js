// pages/Register.jsx
import React, { useState } from "react";
import api from "../api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/register", { username, password, fullname });
      setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Lỗi khi đăng ký!";
      setMessage(msg);
    }
  };

  return (
    <div className="register-page">
      <style>{`
        :root {
          --card-bg: rgba(255, 255, 255, 0.21);
          --text: #0f172a;
        }

        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          background-image: url('/component-images/register-background.gif');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          box-sizing: border-box;
        }

        .register-card {
          width: 100%;
          max-width: 300px;
          padding: 28px;
          border-radius: 16px;
          background: var(--card-bg);
          box-shadow: 0 10px 30px rgba(2,6,23,0.35);
          backdrop-filter: blur(6px);
          text-align: center;
        }

        .register-card h2 {
          margin: 0 0 12px 0;
          color: var(--text);
          font-size: 1.5rem;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .register-form input {
          padding: 12px 14px;
          border-radius: 8px;
          border: 2px solid #ccc;
          outline: none;
          font-size: 16px;
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.2);
          transition: 0.3s;
        }

        .register-form input:focus {
          border-color: #00b4d8;
          box-shadow: 0 4px 10px rgba(0,180,216,0.2);
        }

        /* === Nút Đăng ký (giống Login.jsx) === */
        .register-form button {
          padding: 12px;
          font-size: 16px;
          background: linear-gradient(90deg, #3f3f3fff, #00b4d8);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
        }

        .register-form button:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 20px rgba(0,180,216,0.4);
        }

        .msg {
          margin-top: 12px;
          min-height: 1.2em;
          color: #111827;
          font-size: 0.95rem;
        }

        @media (min-width: 600px) {
          .register-card {
            width: 420px;
            padding: 34px;
          }
        }

        @media (min-width: 900px) {
          .register-card {
            width: 460px;
            padding: 40px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .register-page {
            background-attachment: scroll;
          }
        }
      `}</style>

      <div className="register-card" role="region" aria-labelledby="register-heading">
        <h2 id="register-heading">Đăng ký</h2>
        <form onSubmit={handleRegister} className="register-form" aria-describedby="register-help">
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={4}
          />
          <input
            type="text"
            placeholder="Họ tên (tùy chọn)"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            autoComplete="name"
          />
          <button type="submit">Đăng ký</button>
        </form>
        <p id="register-help" className="msg" aria-live="polite">{message}</p>
      </div>
    </div>
  );
}
