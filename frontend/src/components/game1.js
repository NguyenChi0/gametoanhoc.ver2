// src/components/games/Game1.jsx
import React, { useState } from "react";
import api from "../api";

export default function Game1({ payload }) {
  const questions = payload?.questions || [];
  const user = payload?.user;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [userScore, setUserScore] = useState(user?.score ?? 0);
  const [weekScore, setWeekScore] = useState(user?.week_score ?? 0);
  const [locked, setLocked] = useState(false);
  const [background, setBackground] = useState("game1-asker.png");

  const prizeLevels = [
    "10.000", "20.000", "30.000", "40.000", "50.000",
    "100.000", "200.000", "300.000", "500.000", "1.000.000"
  ];

  const gameQuestions = questions.slice(0, 10);
  const currentQuestion = gameQuestions[current];

  async function incrementScore(userId, delta = 1) {
    try {
      const res = await api.post("/score/increment", { userId, delta });
      if (res.data.success) {
        setUserScore(res.data.score);
        setWeekScore(res.data.week_score);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...user,
            score: res.data.score,
            week_score: res.data.week_score,
          })
        );
      }
    } catch (err) {
      console.error("API cộng điểm lỗi:", err);
    }
  }

  function handleAnswer(answer) {
    if (locked) return;
    setLocked(true);
    setSelected(answer);

    if (answer.correct && user?.id) {
      setBackground("game1-winner.png");
      incrementScore(user.id, 1);
      setTimeout(() => {
        if (current + 1 < gameQuestions.length) {
          setCurrent((c) => c + 1);
          setSelected(null);
          setLocked(false);
          setBackground("game1-asker.png");
        } else {
          setShowResult(true);
          setBackground("game1-winner.png");
        }
      }, 1500);
    } else {
      setBackground("game1-loser.png");
      setTimeout(() => {
        setGameOver(true);
        setShowResult(true);
      }, 1500);
    }
  }

  function resetGame() {
    setCurrent(0);
    setSelected(null);
    setShowResult(false);
    setGameOver(false);
    setLocked(false);
    setBackground("game1-asker.png");
  }

  if (!gameQuestions.length) {
    return (
      <div style={{ textAlign: "center", marginTop: 100, color: "white" }}>
        Không có câu hỏi nào!
      </div>
    );
  }

  const getImageSrc = (imgPath) => {
    if (!imgPath) return null;
    if (/^https?:\/\//i.test(imgPath)) return imgPath;
    if (imgPath.startsWith("/")) return imgPath;
    if (imgPath.startsWith("game-images/")) return `/${imgPath}`;
    return `${process.env.PUBLIC_URL || ""}/game-images/${imgPath}`;
  };

  // Background toàn màn hình - giữ nguyên
  const backgroundStyle = {
    minHeight: "20vh",
    backgroundColor: "#001f3f",
    display: "flex",
    alignItems: "center", // Căn giữa theo chiều dọc
    padding: "20px 0" // Giảm padding để khung ngắn hơn
  };

  const resultBackgroundStyle = {
    minHeight: "100vh",
    backgroundColor: "#001f3f",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    textAlign: "center",
    padding: 20,
  };

  if (showResult) {
    return (
      <div style={resultBackgroundStyle}>
        <div style={{
          background: "rgba(0, 31, 63, 0.9)",
          padding: "40px 30px",
          borderRadius: 15,
          maxWidth: 400,
          border: "3px solid #FFD700"
        }}>
          <h2 style={{
            color: gameOver ? "#dc3545" : "#FFD700",
            fontSize: "2.5em",
            marginBottom: 20
          }}>
            {gameOver ? "💔 RẤT TIẾC!" : "🎉 CHÚC MỪNG!"}
          </h2>

          {gameOver ? (
            <div style={{ marginBottom: 25 }}>
              <p style={{ fontSize: "1.2em", marginBottom: 10 }}>
                Bạn đã trả lời sai ở câu {current + 1}
              </p>
              <p style={{ fontSize: "1.1em", color: "#FFD700" }}>
                Phần thưởng của bạn: <b>{current > 0 ? prizeLevels[current - 1] : "0"} VNĐ</b>
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: 25 }}>
              <p style={{ fontSize: "1.2em", marginBottom: 10 }}>
                Bạn đã trả lời đúng tất cả {gameQuestions.length} câu hỏi!
              </p>
              <p style={{ fontSize: "1.1em", color: "#FFD700" }}>
                Phần thưởng: <b>{prizeLevels[prizeLevels.length - 1]} VNĐ</b>
              </p>
            </div>
          )}

          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: 15,
            borderRadius: 8,
            marginBottom: 25
          }}>
            <p style={{ marginBottom: 5 }}>
              Điểm tổng: <b style={{ color: "#4CAF50" }}>{userScore}</b>
            </p>
            <p>
              Điểm tuần: <b style={{ color: "#2196F3" }}>{weekScore}</b>
            </p>
          </div>

          <div style={{
            display: "flex",
            gap: 15,
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            <button
              onClick={resetGame}
              style={{
                background: "linear-gradient(135deg, #4CAF50, #45a049)",
                color: "white",
                padding: "12px 25px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "1.1em",
                fontWeight: "bold"
              }}
            >
              🔄 Chơi Lại
            </button>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                background: "linear-gradient(135deg, #2196F3, #1976D2)",
                color: "white",
                padding: "12px 25px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "1.1em",
                fontWeight: "bold"
              }}
            >
              🏠 Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questionImageSrc = getImageSrc(currentQuestion.question_image);

  return (
    <div style={backgroundStyle}>
      <div style={{
        display: "flex",
        maxWidth: 1200,
        margin: "0 auto",
        gap: 20,
        width: "100%"
      }}>
        {/* Cột trái - Giảm chiều cao */}
        <div style={{
          width: 250,
          background: "linear-gradient(135deg, rgba(0, 31, 63, 0.9), rgba(0, 51, 102, 0.9))",
          color: "white",
          padding: 15, // Giảm padding
          borderRadius: 12,
          border: "2px solid #FFD700",
          height: "fit-content" // Chiều cao vừa với nội dung
        }}>
          <h3 style={{
            textAlign: "center",
            color: "#FFD700",
            marginBottom: 15, // Giảm margin
            fontSize: "1.1em" // Giảm kích thước chữ
          }}>MỐC TIỀN THƯỞNG</h3>
          {prizeLevels.map((prize, index) => (
            <div key={index} style={{
              background: index === current
                ? "linear-gradient(135deg, #FFD700, #FFA000)"
                : index < current
                  ? "linear-gradient(135deg, #4CAF50, #45a049)"
                  : "linear-gradient(135deg, rgba(0, 51, 102, 0.8), rgba(0, 34, 68, 0.8))",
              color: index === current ? "black" : "white",
              padding: "8px 10px", // Giảm padding
              borderRadius: 6,
              textAlign: "center",
              marginBottom: 6, // Giảm margin
              fontSize: "0.9em" // Giảm kích thước chữ
            }}>
              {prize} VNĐ
            </div>
          ))}
        </div>

        {/* Cột phải - Giảm chiều cao tổng thể */}
        <div style={{
          flex: 1,
          background: "linear-gradient(135deg, rgba(0, 31, 63, 0.9), rgba(0, 51, 102, 0.9))",
          color: "white",
          padding: 20, // Giảm padding
          borderRadius: 12,
          border: "2px solid #1e88e5",
          height: "fit-content" // Chiều cao vừa với nội dung
        }}>
          {/* Ô hiển thị câu hỏi - GIỮ NGUYÊN KÍCH THƯỚC và LÀM BACKGROUND RÕ NÉT */}
          <div style={{
            fontSize: 22,
            fontWeight: 600,
            backgroundImage: `url(${process.env.PUBLIC_URL || ""}/game-images/${background})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            backgroundSize: "cover",
            padding: 25, // Giữ nguyên
            borderRadius: 10,
            marginBottom: 20, // Giảm margin
            border: "3px solid #FFD700",
            lineHeight: 1.4,
            minHeight: 200, // Giữ nguyên chiều cao
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 10,
            position: "relative",
            color: "black"
          }}>
            {/* THAY ĐỔI: Giảm độ trong suốt của lớp phủ để background rõ nét hơn */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 31, 63, 0)", // Giảm từ 0.7 xuống 0.4
              borderRadius: 10,
              zIndex: 1
            }}></div>
            
            {/* Nội dung câu hỏi */}
            <div style={{ position: "relative", zIndex: 2 }}>
              {/* Ảnh minh họa trong ô */}
              {questionImageSrc && (
                <img
                  src={questionImageSrc}
                  alt="Minh họa câu hỏi"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `${process.env.PUBLIC_URL || ""}/game-images/placeholder.png`;
                  }}
                  style={{
                    maxWidth: "80%",
                    maxHeight: 120,
                    borderRadius: 8,
                    border: "2px solid #1e88e5",
                    marginBottom: 15,
                    objectFit: "contain"
                  }}
                />
              )}

              {/* Text câu hỏi */}
              <div style={{color:"white"}}>{currentQuestion.question_text}</div>
            </div>
          </div>

          {/* Đáp án - Giảm chiều cao */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12 // Giảm gap
          }}>
            {currentQuestion.answers.map((ans, i) => {
              const chosen = selected === ans;
              let bg = "linear-gradient(135deg, rgba(0, 51, 102, 0.8), rgba(0, 34, 68, 0.8))";
              let borderColor = "#1e88e5";
              if (selected) {
                if (chosen && ans.correct) {
                  bg = "linear-gradient(135deg, #4CAF50, #45a049)";
                  borderColor = "#4CAF50";
                } else if (chosen && !ans.correct) {
                  bg = "linear-gradient(135deg, #dc3545, #c82333)";
                  borderColor = "#dc3545";
                } else if (ans.correct) {
                  bg = "linear-gradient(135deg, #4CAF50, #45a049)";
                  borderColor = "#4CAF50";
                } else {
                  bg = "linear-gradient(135deg, rgba(44, 62, 80, 0.8), rgba(52, 73, 94, 0.8))";
                  borderColor = "#2c3e50";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(ans)}
                  disabled={locked}
                  style={{
                    background: bg,
                    color: "white",
                    border: `3px solid ${borderColor}`,
                    borderRadius: 8,
                    padding: "12px 10px", // Giảm padding
                    fontSize: 14, // Giảm kích thước chữ
                    cursor: locked ? "default" : "pointer",
                    fontWeight: "bold",
                    minHeight: 60, // Giảm chiều cao
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    transition: "all 0.3s ease"
                  }}
                >
                  <span style={{
                    marginRight: 10, // Giảm margin
                    fontSize: "1.1em", // Giảm kích thước
                    minWidth: 25, // Giảm kích thước
                    textAlign: "center"
                  }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {ans.text}
                </button>
              );
            })}
          </div>

          {/* Thông tin điểm - Giảm chiều cao */}
          <div style={{
            marginTop: 20, // Giảm margin
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.1)",
            padding: "10px 15px", // Giảm padding
            borderRadius: 6,
            border: "1px solid #1e88e5",
            fontSize: "0.9em" // Giảm kích thước chữ
          }}>
            <div>Điểm tổng: <b style={{ color: "#4CAF50" }}>{userScore}</b></div>
            <div>Điểm tuần: <b style={{ color: "#2196F3" }}>{weekScore}</b></div>
            <div style={{ color: "#FFD700" }}>Mốc hiện tại: <b>{prizeLevels[current]} VNĐ</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}