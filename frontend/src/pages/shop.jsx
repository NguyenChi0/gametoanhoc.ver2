import React, { useEffect, useState } from "react";
import api from "../api";

export default function Shop() {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [message, setMessage] = useState("");
  const [showSeller, setShowSeller] = useState(true);

  useEffect(() => {
    api.get("/items").then((res) => setItems(res.data));

    // 👇 Hiệu ứng bay lên cho shop-seller
    const seller = document.getElementById("shop-seller");
    if (seller) {
      seller.style.opacity = "0";
      seller.style.transform = "translateY(50px)";
      setTimeout(() => {
        seller.style.transition = "all 2s ease-out";
        seller.style.opacity = "1";
        seller.style.transform = "translateY(0)";
      }, 200);
    }
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

  // 🎨 Hàm chọn màu ánh sáng theo điểm
  const getAuraColor = (score) => {
    if (score >= 20000) return "rgba(255, 0, 0, 0.8)"; // đỏ
    if (score >= 10000) return "rgba(128, 0, 128, 0.8)"; // tím
    if (score >= 5000) return "rgba(255, 215, 0, 0.8)"; // vàng
    if (score >= 1000) return "rgba(0, 255, 0, 0.8)"; // xanh lá
    return "rgba(255, 255, 255, 0.3)"; // mặc định nhạt
  };

  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",
        backgroundImage: `url(${process.env.PUBLIC_URL}/component-images/shop-background.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <h2 style={{ color: "#fff", textShadow: "2px 2px 4px #000" }}>
        🛍️ Cửa hàng vật phẩm
      </h2>
      <p style={{ color: "#fff", textShadow: "1px 1px 3px #000" }}>
        Điểm hiện tại của bạn: <strong>{user.score}</strong>
      </p>
      {message && <p style={{ color: "red" }}>{message}</p>}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              position: "relative",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 10,
              width: 180,
              textAlign: "center",
              background: "rgba(255,255,255,0.85)",
              overflow: "hidden",
            }}
          >
            {/* Ảnh vật phẩm có aura quanh viền */}
            <img
              src={`${process.env.PUBLIC_URL}/images-items/${item.link}`}
              alt={item.name}
              style={{
                width: "100%",
                height: 100,
                objectFit: "contain",
                position: "relative",
                zIndex: 1,
                filter: `
                  drop-shadow(0 0 10px ${getAuraColor(item.require_score)})
                  drop-shadow(0 0 20px ${getAuraColor(item.require_score)})
                  drop-shadow(0 0 30px ${getAuraColor(item.require_score)})
                `,
                transition: "filter 0.3s ease-in-out",
              }}
            />

            <h4>{item.name}</h4>
            <p>Giá: {item.require_score} điểm</p>
            <button
              onClick={() => handleBuy(item.id, item.require_score)}
              style={{
                background: "#ff9800",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              Mua
            </button>
          </div>
        ))}
      </div>

      {/* 🧍‍♂️ Shop seller */}
      {showSeller && (
        <div
          style={{
            position: "fixed",
            bottom: "10px",
            right: "20px",
            zIndex: 10,
            textAlign: "center",
          }}
        >
          {/* Nút đóng */}
          <button
            onClick={() => setShowSeller(false)}
            style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "25px",
              height: "25px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ×
          </button>

          <img
            id="shop-seller"
            src={`${process.env.PUBLIC_URL}/component-images/shop-seller.png`}
            alt="Shop Seller"
            style={{
              width: "400px",
              height: "auto",
              transition: "all 1s ease-out",
            }}
          />
        </div>
      )}
    </div>
  );
}
