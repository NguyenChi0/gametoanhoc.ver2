// src/components/games/Game1.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import api from "../api";

export default function Game1({ payload }) {
  const questions = payload?.questions || [];

  const [selected, setSelected] = useState({});
  const [userScore, setUserScore] = useState(payload?.user?.score ?? null);
  const [weekScore, setWeekScore] = useState(payload?.user?.week_score ?? 0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fruits, setFruits] = useState([]);
  const [gameActive, setGameActive] = useState(true);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [isSlicing, setIsSlicing] = useState(false);
  const [slicePath, setSlicePath] = useState([]);
  const gameContainerRef = useRef(null);
  const animationRef = useRef(null);

  // Danh sách ảnh hoa quả
  const fruitImages = [
    "/game-images/game6-fruit1.png",
    "/game-images/game6-fruit2.png", 
    "/game-images/game6-fruit3.png",
    "/game-images/game6-fruit4.png"
  ];

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

  // Game loop - cập nhật vị trí quả
  useEffect(() => {
    if (!gameActive) return;

    const updateFruits = () => {
      setFruits(prev => prev.map(fruit => {
        if (fruit.hit) return fruit;

        let newY = fruit.y + fruit.speed;
        let newSpeed = fruit.speed;
        
        // Đổi hướng khi chạm biên
        if (newY <= 50) {
          newY = 50;
          newSpeed = Math.abs(fruit.speed); // Đi xuống
        } else if (newY >= 450) {
          newY = 450;
          newSpeed = -Math.abs(fruit.speed); // Đi lên
        }

        return {
          ...fruit,
          y: newY,
          speed: newSpeed
        };
      }));
      
      animationRef.current = requestAnimationFrame(updateFruits);
    };

    animationRef.current = requestAnimationFrame(updateFruits);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameActive]);

  // Tạo quả mới khi câu hỏi thay đổi
  useEffect(() => {
    if (!currentQuestion || !gameActive) return;

    const newFruits = currentQuestion.answers.map((answer, index) => {
      const size = 80 + Math.random() * 40; // Tăng kích thước quả
      const x = 70 + (index * 130); // Vị trí ngang cách đều
      const speed = 1 + Math.random() * 2; // Tốc độ ngẫu nhiên
      const direction = Math.random() > 0.5 ? 1 : -1; // Hướng bay ngẫu nhiên
      
      return {
        id: index,
        answer,
        size,
        x,
        y: 250, // Bắt đầu từ giữa
        speed: speed * direction,
        hit: false,
        sliced: false
      };
    });

    setFruits(newFruits);
    setSlicePath([]);
  }, [currentQuestionIndex, gameActive]);

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

  // Kiểm tra va chạm giữa đường chém và quả
  function checkSliceCollision(slicePoints, fruit) {
    if (fruit.hit) return false;

    for (let i = 1; i < slicePoints.length; i++) {
      const prev = slicePoints[i - 1];
      const curr = slicePoints[i];
      
      // Khoảng cách từ tâm quả đến đoạn thẳng
      const distance = pointToLineDistance(
        fruit.x, fruit.y,
        prev.x, prev.y,
        curr.x, curr.y
      );
      
      if (distance <= fruit.size / 2) {
        return true;
      }
    }
    return false;
  }

  // Tính khoảng cách từ điểm đến đoạn thẳng
  function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Xử lý bắt đầu chém
  function handleMouseDown(e) {
    if (!gameActive) return;
    
    const rect = gameContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsSlicing(true);
    setSlicePath([{ x, y }]);
  }

  // Xử lý khi đang chém
  function handleMouseMove(e) {
    if (!isSlicing || !gameActive) return;
    
    const rect = gameContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSlicePath = [...slicePath, { x, y }];
    setSlicePath(newSlicePath);

    // Kiểm tra va chạm với tất cả quả
    fruits.forEach(fruit => {
      if (checkSliceCollision(newSlicePath, fruit)) {
        handleFruitHit(fruit.id);
      }
    });
  }

  // Xử lý kết thúc chém
  function handleMouseUp() {
    setIsSlicing(false);
    setTimeout(() => setSlicePath([]), 300);
  }

  // Xử lý khi chém trúng quả
  function handleFruitHit(fruitId) {
    const fruit = fruits.find(f => f.id === fruitId);
    if (!fruit || fruit.hit) return;

    // Đánh dấu quả đã bị chém
    setFruits(prev => prev.map(f => 
      f.id === fruitId ? { ...f, hit: true, sliced: true } : f
    ));

    const isCorrect = fruit.answer.correct;

    if (isCorrect) {
      // Chém đúng
      setScore(prev => prev + 1);
      setMessage("Chém đúng! +1 điểm");

      // Cộng điểm thật
      const userId = payload?.user?.id ||
        (localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).id);

      if (userId) {
        incrementScoreOnServer(userId, 1).then((data) => {
          if (data && data.success) {
            setUserScore(data.score);
            setWeekScore(data.week_score ?? 0);

            // Cập nhật localStorage
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

      // Chuyển câu hỏi tiếp theo sau 1 giây
      setTimeout(() => {
        if (currentQuestionIndex < qs.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setMessage("");
        } else {
          setGameActive(false);
          setMessage("Chúc mừng! Bạn đã hoàn thành tất cả câu hỏi!");
        }
      }, 1000);
    } else {
      // Chém sai - kết thúc game
      setGameActive(false);
      setMessage("Chém sai! Game Over!");
    }
  }

  return (
    <div style={{ 
      fontFamily: "'Arial Rounded MT Bold', 'Arial', sans-serif", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      height:"100%",
      padding: "20px",
      color: "white",
      userSelect: "none"
    }}>
      <div style={{ 
        maxWidth: "1400px", 
        margin: "0 auto",
        display: "flex",
        gap: "10px"
      }}>
        {/* Phần bên trái - Thông tin câu hỏi */}
        <div style={{ 
          flex: "0 0 400px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <h1 style={{ 
            fontSize: "2rem", 
            marginBottom: "10px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            textAlign: "center"
          }}>
            🍎 Chém Hoa Quả Toán Học 🍊
          </h1>
          
          <div style={{ 
            background: "rgba(255,255,255,0.1)", 
            padding: "20px", 
            borderRadius: "15px",
            backdropFilter: "blur(10px)",
            flex: 1
          }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "15px", textAlign: "center" }}>
              Câu hỏi: <strong>{currentQuestionIndex + 1}</strong> / {qs.length}
            </div>
            
            {currentQuestion && (
              <div style={{
                fontSize: "1.3rem",
                fontWeight: "bold",
                marginBottom: "20px",
                color: "#FFD700",
                textAlign: "center",
                lineHeight: "1.4"
              }}>
                {currentQuestion.question_text}
              </div>
            )}
            
            {userScore !== null && (
              <div style={{ 
                fontSize: "1.1rem",
                background: "rgba(0,0,0,0.2)",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px"
              }}>
                <div style={{ marginBottom: "8px" }}>
                  Điểm tổng: <strong style={{ color: "#FFD700" }}>{userScore}</strong>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  Điểm tuần: <strong style={{ color: "#FFD700" }}>{weekScore}</strong>
                </div>
                <div>
                  Điểm hiện tại: <strong style={{ color: "#FFD700" }}>{score}</strong>
                </div>
              </div>
            )}

            

            {/* Hướng dẫn */}
            <div style={{
              background: "rgba(255,255,255,0.1)",
              padding: "15px",
              borderRadius: "10px",
              fontSize: "1rem",
              marginTop: "auto"
            }}>
              <strong>Hướng dẫn:</strong> 
              <p style={{ margin: "10px 0 0 0", lineHeight: "1.5" }}>
                Giữ chuột và kéo để chém vào quả có đáp án ĐÚNG. 
                Chém sai sẽ kết thúc game!
              </p>
            </div>
          </div>
        </div>

        {/* Phần bên phải - Khu vực game */}
        <div style={{ 
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }}>
          <div 
            ref={gameContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              position: "relative",
              height: "600px",
              background: "url(/game-images/game6-background.png) no-repeat center center",
              backgroundSize: "cover",
              borderRadius: "15px",
              overflow: "hidden",
              border: "3px solid rgba(255,255,255,0.2)",
              cursor: isSlicing ? "crosshair" : "default",
              flex: 1
            }}
          >
            {/* Vẽ vết chém */}
            {slicePath.length > 1 && (
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none"
                }}
              >
                <path
                  d={`M ${slicePath.map(p => `${p.x},${p.y}`).join(" L ")}`}
                  stroke="#FFD700"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {/* Hiển thị các quả với ảnh */}
            {fruits.map((fruit) => {
              const fruitImage = fruitImages[fruit.id % fruitImages.length];
              return (
                <div
                  key={fruit.id}
                  style={{
                    position: "absolute",
                    left: `${fruit.x - fruit.size/2}px`,
                    top: `${fruit.y - fruit.size/2}px`,
                    width: `${fruit.size}px`,
                    height: `${fruit.size}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: fruit.hit ? "all 0.3s ease" : "none",
                    transform: fruit.hit ? "scale(1.3) rotate(180deg)" : "scale(1)",
                    opacity: fruit.hit ? 0 : 1,
                    pointerEvents: "none",
                  }}
                >
                  <img 
                    src={fruitImage} 
                    alt="fruit"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: fruit.hit ? "brightness(1.5)" : "none"
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      fontSize: `${Math.max(14, fruit.size / 4)}px`,
                      fontWeight: "bold",
                      color: "white",
                      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                      textAlign: "center",
                      width: "80%"
                    }}
                  >
                    {fruit.answer.text}
                  </div>
                </div>
              );
            })}

            {/* Hiệu ứng chém thành công */}
            {fruits.filter(f => f.hit).map(fruit => (
              <div
                key={`effect-${fruit.id}`}
                style={{
                  position: "absolute",
                  left: `${fruit.x - fruit.size/2}px`,
                  top: `${fruit.y - fruit.size/2}px`,
                  width: `${fruit.size}px`,
                  height: `${fruit.size}px`,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #FFD700 0%, transparent 70%)",
                  animation: "explode 0.5s ease-out forwards",
                  pointerEvents: "none"
                }}
              />
            ))}
            {/* Nút chơi lại ở giữa khi game kết thúc */}
{!gameActive && (
  <button
    onClick={() => {
      setCurrentQuestionIndex(0);
      setScore(0);
      setGameActive(true);
      setMessage("");
      setFruits([]);
    }}
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "linear-gradient(45deg, #FF6B6B, #FF8E53)",
      border: "none",
      padding: "20px 40px",
      fontSize: "1.5rem",
      color: "white",
      borderRadius: "30px",
      cursor: "pointer",
      fontWeight: "bold",
      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
      transition: "transform 0.2s, opacity 0.3s",
      zIndex: 10,
      opacity: 0.95
    }}
    onMouseOver={(e) => e.target.style.transform = "translate(-50%, -50%) scale(1.1)"}
    onMouseOut={(e) => e.target.style.transform = "translate(-50%, -50%) scale(1)"}
  >
    🔄 Chơi Lại
  </button>
)}

          </div>
        </div>
      </div>

      {/* CSS animation cho hiệu ứng nổ */}
      <style>
        {`
          @keyframes explode {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}