// src/components/games/game7.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import api from "../api";

export default function Game1({ payload }) {
  const questions = payload?.questions || [];

  const [selected, setSelected] = useState({});
  const [userScore, setUserScore] = useState(payload?.user?.score ?? null);
  const [weekScore, setWeekScore] = useState(payload?.user?.week_score ?? 0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [targetPosition, setTargetPosition] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [visibleArea, setVisibleArea] = useState({ x: 0, width: 100 });
  const gameAreaRef = useRef(null);

  // Shuffle câu trả lời
  const qs = useMemo(() => {
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    return questions.map((q) => {
      const answers = Array.isArray(q.answers) ? shuffle(q.answers) : [];
      return { ...q, answers };
    });
  }, [questions]);

  const currentQuestion = qs[currentQuestionIndex];

  // Animation di chuyển mượt mà
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setCurrentPosition(prev => {
        const diff = targetPosition - prev;
        if (Math.abs(diff) < 0.1) return targetPosition;
        return prev + diff * 0.2;
      });
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [currentPosition, targetPosition]);

  // Cập nhật vùng nhìn thấy theo vị trí nhân vật
  useEffect(() => {
    const playerX = 20 + currentPosition * 25;
    setVisibleArea({
      x: Math.max(0, playerX - 25),
      width: 30
    });
  }, [currentPosition]);

  // Xử lý sự kiện bàn phím
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showResult) return;

      if (e.key === "ArrowLeft") {
        setTargetPosition((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "ArrowRight") {
        setTargetPosition((prev) => (prev < 3 ? prev + 1 : prev));
      } else if (e.key === "Enter") {
        choose(currentQuestion.id, Math.round(currentPosition));
      } else if (e.key === " ") {
        e.preventDefault();
        if (!isJumping) {
          setIsJumping(true);
          setTimeout(() => setIsJumping(false), 600);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPosition, showResult, currentQuestion, isJumping]);

  // Gọi API cộng điểm
  async function incrementScoreOnServer(userId, delta = 1) {
    try {
      const resp = await api.post("/score/increment", { userId, delta });
      return resp.data;
    } catch (e) {
      console.warn("Lỗi gọi API cộng điểm:", e);
      return null;
    }
  }

  function handleGameOver(isCorrect, reason = "") {
    setShowResult(true);
    
    if (isCorrect) {
      const userId =
        payload?.user?.id ||
        (localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).id);

      if (!userId) {
        console.warn("Người dùng chưa login — không thể cộng điểm trên server.");
        return;
      }

      incrementScoreOnServer(userId, 1).then((data) => {
        if (data && data.success) {
          setUserScore(data.score);
          setWeekScore(data.week_score ?? 0);

          const raw = localStorage.getItem("user");
          if (raw) {
            try {
              const u = JSON.parse(raw);
              u.score = data.score;
              u.week_score = data.week_score;
              localStorage.setItem("user", JSON.stringify(u));
            } catch (err) {
              console.warn("Không cập nhật được user trong localStorage:", err);
            }
          }
        }
      });
    }
  }

  function choose(qId, ansIdx) {
    if (selected[qId] !== undefined) return;
    setSelected((prev) => ({ ...prev, [qId]: ansIdx }));

    const q = qs.find((x) => x.id === qId);
    const a = q?.answers?.[ansIdx];
    
    if (a && a.correct) {
      handleGameOver(true);
    } else {
      handleGameOver(false, "sai cửa");
    }
  }

  function nextQuestion() {
    setShowResult(false);
    setCurrentPosition(0);
    setTargetPosition(0);
    setCurrentQuestionIndex((prev) => prev + 1);
  }

  if (!currentQuestion) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: "20px",
        background: "#000",
        color: "white",
        minHeight: "100vh"
      }}>
        <h2>Hoàn thành cuộc phiêu lưu!</h2>
        {userScore !== null && (
          <p>
            Điểm tổng: <b style={{ color: "#ffd700" }}>{userScore}</b> | 
            Điểm tuần: <b style={{ color: "#ffd700" }}>{weekScore}</b>
          </p>
        )}
      </div>
    );
  }

  const selectedAnswerIndex = selected[currentQuestion.id];
  const isCorrect = selectedAnswerIndex !== undefined && 
    currentQuestion.answers[selectedAnswerIndex]?.correct;

  // Kiểm tra xem đối tượng có nằm trong vùng nhìn thấy không
  const isInVisibleArea = (position) => {
    return position >= visibleArea.x && position <= visibleArea.x + visibleArea.width;
  };

  return (
    <div style={{ 
      background: 'white',
      backgroundSize: "cover",
      height: "100%",
      color: "white",
      fontFamily: "'Arial', sans-serif",
      overflow: "hidden"
    }}>
      <div style={{ 
        maxWidth: 800, // Giảm độ rộng
        margin: "0 auto", 
        padding: "10px",
        position: "relative"
      }}>

        {/* Thông tin điểm số */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "15px",
          padding: "10px",
          background: "rgba(20,20,20,0.9)",
          borderRadius: "8px",
          border: "1px solid #333"
        }}>
          <h3 style={{ 
            margin: 0, 
            color: "#ffd700",
            textShadow: "0 0 10px rgba(255,215,0,0.5)",
            fontSize: "18px"
          }}>
            🏰 Cuộc Phiêu Lưu Toán Học
          </h3>
          {userScore !== null && (
            <div style={{ fontSize: "14px" }}>
              💎 Điểm: <b style={{ color: "#ffd700" }}>{userScore}</b> | 
              ⭐ Tuần: <b style={{ color: "#ffd700" }}>{weekScore}</b>
            </div>
          )}
        </div>

        {/* Câu hỏi - Giảm kích thước */}
        <div style={{
          background: `url(${process.env.PUBLIC_URL}/game-images/game7-platform.png) no-repeat center center`,
          backgroundSize: "cover",
          padding: "15px",
          borderRadius: "8px",
          border: "2px solid #333",
          marginBottom: "15px",
          minHeight: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <h3 style={{ 
            margin: 0, 
            color: "#fff",
            textAlign: "center",
            fontSize: "16px",
            textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
          }}>
            Câu {currentQuestionIndex + 1}: {currentQuestion.question_text}
          </h3>
        </div>

        {/* Khu vực game */}
        <div 
  ref={gameAreaRef}
  style={{ 
    position: "relative", 
    height: "350px",
    backgroundImage: `url(${process.env.PUBLIC_URL}/game-images/game7-background.png)`,

    backgroundSize: "cover",
    backgroundPosition: "center",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "15px",
    border: "2px solid #222"
  }}
>

          {/* Màn che tối - chỉ để lộ một khoảng nhỏ */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `
              linear-gradient(to right, 
                #000 0%, 
                #000 ${visibleArea.x}%, 
                transparent ${visibleArea.x}%, 
                transparent ${visibleArea.x + visibleArea.width}%, 
                #000 ${visibleArea.x + visibleArea.width}%, 
                #000 100%
              )
            `,
            zIndex: 10,
            pointerEvents: "none"
          }}></div>

          {/* Hiệu ứng ánh sáng từ đuốc */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: `${currentPosition * 25}%`,
            transform: "translate(-50%, -50%)",
            width: "150px",
            height: "50px",
            background: "radial-gradient(circle, rgba(255,140,0,0.4) 0%, rgba(255,140,0,0.2) 30%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(10px)",
            transition: "left linear",
            zIndex: 1
          }}></div>

          {/* 4 Cánh cửa - dịch sang trái */}
          <div style={{
            display: "flex",
            justifyContent: "space-around",
            position: "absolute",
            bottom: "80px",
            width: "100%",
            padding: "0 1%", // Giảm padding để dịch sang trái
            zIndex: 2
          }}>
            {currentQuestion.answers.map((answer, index) => {
              const doorPosition = 10 + index * 25;
              const isVisible = isInVisibleArea(doorPosition);
              const isSelectedDoor = selectedAnswerIndex === index;
              
              return (
                <div
                  key={index}
                  style={{
                    width: "130px",
                    height: "130px",
                    position: "relative",
                    cursor: showResult ? "default" : "pointer",
                    transition: "all 0.3s ease",
                    opacity: isVisible ? 1 : 0,
                    filter: isSelectedDoor ? "drop-shadow(0 0 8px rgba(255,215,0,0.8))" : "none",
                    marginLeft: index === 0 ? "-10px" : "0" // Dịch cửa đầu tiên sang trái thêm
                  }}
                  onClick={() => !showResult && isVisible && choose(currentQuestion.id, index)}
                >
                  {/* Cánh cửa */}
                  <img
                    src={`${process.env.PUBLIC_URL}/game-images/game7-door.png`}
                    alt={`Cửa ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: showResult ? 
                        (answer.correct ? "hue-rotate(120deg) saturate(1.5)" : 
                         (isSelectedDoor && !answer.correct ? "hue-rotate(300deg) saturate(1.5)" : "none")) 
                        : "none"
                    }}
                  />
                  
                  {/* Hiển thị đáp án trên cửa */}
                  {isVisible && (
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "50px",
                      height: "30px",
                      background: "rgba(255, 215, 0, 0.9)",
                      borderRadius: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "30px",
                      border: "2px solid #B8860B",
                      color: "#8B4513",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                      padding: "2px"
                    }}>
                      {answer.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Nhân vật cầm đuốc */}
          <div style={{
            position: "absolute",
            bottom: isJumping ? "150px" : "60px",
            left: `${8 + currentPosition * 25}%`,
            transition: `left 0.1s linear, bottom ${isJumping ? '0.3s ease' : '0.2s ease'}`,
            transform: "translateX(-50%)",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            {/* Đuốc với hiệu ứng lửa */}
            <div style={{
              position: "relative",
              width: "15px",
              height: "30px",
              marginBottom: "3px",
              zIndex: 2
            }}>
              <img
                src={`${process.env.PUBLIC_URL}/game-images/game7-torch.png`}
                alt="Đuốc"
                style={{
                  width: "200%",
                  height: "200%",
                  objectFit: "contain"
                }}
              />
              {/* Hiệu ứng lửa */}
              <div style={{
                position: "absolute",
                top: "10px",
                left: "70%",
                transform: "translateX(-50%)",
                width: "20px",
                height: "25px",
                background: "radial-gradient(ellipse at center, #FF8C00 0%, #FF4500 70%, transparent 100%)",
                borderRadius: "50% 50% 20% 20%",
                filter: "blur(2px)",
                animation: "flicker 0.5s infinite alternate"
              }}></div>
            </div>

            {/* Nhân vật */}
            <img
              src={`${process.env.PUBLIC_URL}/game-images/game7-nv.png`}
              alt="Nhân vật"
              style={{
                width: "80px",
                height: "100px",
                objectFit: "contain",
                filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))"
              }}
            />
          </div>

          {/* Nền đất */}
          <div style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "100%",
            height: "60px",
            background: `url(${process.env.PUBLIC_URL}/game-images/game7-platform.png) repeat-x`,

            backgroundSize: "auto 100%",
            opacity: 0.9
          }}></div>

          {/* Hướng dẫn */}
          <div style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#fff",
            fontSize: "12px",
            textAlign: "center",
            background: "rgba(0,0,0,0.7)",
            padding: "5px 12px",
            borderRadius: "15px",
            zIndex: 11,
            textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
          }}>
            {!showResult ? 
              "← → di chuyển | SPACE nhảy | ENTER chọn cửa" : 
              "Nhấn TIẾP TỤC để tiếp theo"}
          </div>

          {/* Popup kết quả - hiển thị ở giữa game */}
          {showResult && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: isCorrect ? "rgba(34, 139, 34, 0.95)" : "rgba(178, 34, 34, 0.95)",
              padding: "20px",
              borderRadius: "12px",
              border: `3px solid ${isCorrect ? "#32CD32" : "#DC143C"}`,
              textAlign: "center",
              zIndex: 20,
              width: "80%",
              maxWidth: "300px",
              boxShadow: "0 0 20px rgba(0,0,0,0.8)"
            }}>
              <h2 style={{ 
                color: "#FFD700", 
                marginBottom: "10px",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                fontSize: "20px"
              }}>
                {isCorrect ? "🎉 CHÍNH XÁC! 🎉" : "❌ SAI RỒI! ❌"}
              </h2>
              <p style={{ 
                marginBottom: "15px", 
                fontSize: "14px",
                lineHeight: "1.4"
              }}>
                {isCorrect 
                  ? "Bạn đã chọn đúng cánh cửa!" 
                  : "Cánh cửa này không đúng. Thử câu tiếp theo nhé!"}
              </p>
              <button
                onClick={nextQuestion}
                style={{
                  padding: "8px 20px",
                  background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                  color: "#8B4513",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.target.style.transform = "scale(1)"}
              >
                TIẾP TỤC →
              </button>
            </div>
          )}
        </div>

        {/* Thông tin tiến độ */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#fff",
          padding: "8px",
          background: "rgba(20,20,20,0.9)",
          borderRadius: "6px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
        }}>
          <div>📊 Câu: {currentQuestionIndex + 1}/{qs.length}</div>
          <div>🎯 Chọn cửa có đáp án đúng</div>
        </div>

        {/* CSS animation cho lửa */}
        <style jsx>{`
          @keyframes flicker {
            0% { opacity: 0.7; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.9; transform: translateX(-50%) scale(1.05); }
            100% { opacity: 1; transform: translateX(-50%) scale(1.1); }
          }
        `}</style>
      </div>
    </div>
  );
}