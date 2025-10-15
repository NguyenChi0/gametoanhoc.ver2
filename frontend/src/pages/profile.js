// src/pages/profile.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function Profile() {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [userData, setUserData] = useState(null);

  const viewedUsername = paramUsername || storedUser?.username;

  useEffect(() => {
    if (!viewedUsername) return;
    // nếu muốn cập nhật achievement realtime khi xem, thêm ?force_check=true
    api.get(`/user/${viewedUsername}`)
      .then(res => setUserData(res.data))
      .catch(err => {
        console.error(err);
        // nếu 404 có thể điều hướng hoặc hiển thị message
      });
  }, [viewedUsername]);

  if (!storedUser && !viewedUsername) return <p>Bạn cần đăng nhập để xem trang cá nhân.</p>;
  if (!userData) return <p>Đang tải thông tin...</p>;

  const isOwnProfile = storedUser?.username === userData.username;

  return (
    <div style={styles.container}>
      <h2>👤 Trang cá nhân</h2>
      <p><strong>Tên đăng nhập:</strong> {userData.username}</p>
      <p><strong>Họ tên:</strong> {userData.fullname || "Chưa có"}</p>
      <p><strong>Trường học:</strong> {userData.school || "Chưa cập nhật"}</p>
      <p><strong>Điểm tổng:</strong> {userData.score ?? 0}</p>

      <div style={{ marginTop: 12 }}>
        <strong>Thành tích:</strong>{" "}
        {userData.achievement ? (
          <div>
            <div style={{ fontWeight: 600 }}>{userData.achievement.name}</div>
            {userData.week_rank ? <div style={{ fontStyle: "italic" }}>Hạng tuần: #{userData.week_rank}</div> : null}
            {userData.achievement.description ? <div>{userData.achievement.description}</div> : null}
            {userData.achievement.link ? (
              <div style={{ marginTop: 8 }}>
                {/* nếu link là tên file, giả sử ảnh nằm ở /images-achievement/ */}
                <img
                  src={`${process.env.REACT_APP_API_BASE || ""}/images-achievement/${userData.achievement.link}`}
                  alt={userData.achievement.name}
                  style={{ maxWidth: 120 }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <span>Chưa có</span>
        )}
      </div>

      <p style={{ marginTop: 12 }}>
        <strong>Số vật phẩm đã mua:</strong> {userData.itemsOwned?.length ?? 0}
      </p>
      <p><strong>Ngày tham gia:</strong> {new Date(userData.created_at).toLocaleString()}</p>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>🎁 Vật phẩm đã mua</h3>

        {userData.itemsOwned && userData.itemsOwned.length > 0 ? (
          <div style={styles.itemsGrid}>
            {userData.itemsOwned.map((item, idx) => {
              // key dùng id + idx vì có thể mua trùng item nhiều lần
              const key = `${item.id}-${idx}-${item.purchased_at}`;
              return (
                <div key={key} style={styles.itemCard}>
                  <img
                    src={`${process.env.REACT_APP_API_BASE || ""}/images-items/${item.link}`}
                    alt={item.name}
                    style={styles.itemImage}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-item.png"; }}
                  />
                  <div style={{ marginTop: 8, textAlign: "center" }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.description ? <div style={{ fontSize: 12 }}>{item.description}</div> : null}
                    <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
                      Mua: {item.purchased_at ? new Date(item.purchased_at).toLocaleString() : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontStyle: "italic", color: "#666" }}>Người dùng chưa mua vật phẩm nào.</p>
        )}
      </div>

      {isOwnProfile ? (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate("/profile/edit")}>Chỉnh sửa profile</button>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 800,
    margin: "40px auto",
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 12,
  },
  itemCard: {
    padding: 10,
    border: "1px solid #e6e6e6",
    borderRadius: 8,
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  itemImage: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
};
