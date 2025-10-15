import React, { useEffect, useState } from "react";
import api from "../api";

export default function Shop() {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/items").then((res) => setItems(res.data));
  }, []);

  const handleBuy = async (itemId, requireScore) => {
    if (user.score < requireScore) {
      setMessage("❌ Bạn không đủ điểm để mua vật phẩm này!");
      return;
    }
    try {
      const res = await api.post("/buy", { userId: user.id, itemId });
      setMessage(res.data.message);

      // Cập nhật điểm sau khi mua
      const newUser = { ...user, score: user.score - requireScore };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    } catch (err) {
      setMessage(err.response?.data?.error || "Lỗi khi mua vật phẩm");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🛍️ Cửa hàng vật phẩm</h2>
      <p>Điểm hiện tại của bạn: <strong>{user.score}</strong></p>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 10,
              width: 180,
              textAlign: "center",
            }}
          >
            {/* 👉 ảnh lấy từ /public/image-items */}
            <img
              src={`/images-items/${item.link}`}
              alt={item.name}
              style={{ width: "100%", height: 100, objectFit: "contain" }}
            />
            <h4>{item.name}</h4>
            <p>Giá: {item.require_score} điểm</p>
            <button onClick={() => handleBuy(item.id, item.require_score)}>
              Mua
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
