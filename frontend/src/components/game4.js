import React, { useMemo, useState, useEffect, useRef } from "react";
import api from "../api";

export default function Game1({ payload }) {
  const questions = payload?.questions || [];
  
  const [selected, setSelected] = useState({});
  const [userScore, setUserScore] = useState(payload?.user?.score ?? 0);
  const [weekScore, setWeekScore] = useState(payload?.user?.week_score ?? 0);

  // Game states
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [playerLane, setPlayerLane] = useState(1);
  const [gameState, setGameState] = useState("running"); // Bắt đầu luôn với running
  const [obstaclePosition, setObstaclePosition] = useState(800);
  const [isJumping, setIsJumping] = useState(false);
  const animationRef = useRef();
  const hasScoredRef = useRef(false);
  const gameSpeed = 0.65;

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

  // Reset hasScored khi chuyển câu hỏi
  useEffect(() => {
    hasScoredRef.current = false;
  }, [currentQuestion]);

  // Animation loop
  useEffect(() => {
    if (gameState !== "running") return;

    const animate = () => {
      setObstaclePosition(prev => {
        const newPos = prev - gameSpeed;
        
        // Kiểm tra va chạm khi chướng ngại vật đến vị trí nhân vật
        if (newPos <= 120 && newPos >= 60) {
          const currentQ = qs[currentQuestion];
          const correctLane = currentQ?.answers.findIndex(a => a.correct);
          
          if (playerLane === correctLane) {
            // Nhảy qua thành công - chỉ cộng điểm 1 lần
            if (!isJumping && !hasScoredRef.current) {
              hasScoredRef.current = true;
              setIsJumping(true);

              // Lưu câu trả lời đã chọn
              setSelected(prev => ({ ...prev, [currentQ.id]: playerLane }));

              // Lấy userId từ payload hoặc localStorage
              const userId =
                payload?.user?.id ||
                (localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).id);

              // Cộng điểm
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

              // Chuyển câu hỏi tiếp theo sau khi barrier chạy xong (đợi 2s để thấy hiệu ứng)
              setTimeout(() => {
                setIsJumping(false);
                
                if (currentQuestion < qs.length - 1) {
                  setCurrentQuestion(prev => prev + 1);
                  setObstaclePosition(800);
                  // Lưu ý: không reset playerLane ở đây để giữ vị trí người chơi
                } else {
                  setGameState("finished");
                }
              }, 2000);
            }
            return newPos;
          } else if (newPos <= 100 && !isJumping) {
            // Va chạm - chọn sai
            setGameState("crashed");
            setSelected(prev => ({ ...prev, [currentQ.id]: playerLane }));
            return newPos;
          }
        }
        
        // Nếu chướng ngại vật đi hết màn hình mà không va chạm
        if (newPos < -100) {
          return 800; // Reset về vị trí ban đầu
        }
        
        return newPos;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, playerLane, isJumping, currentQuestion, qs, payload]);

  // Di chuyển nhân vật
  function moveLane(newLane) {
    if (gameState === "crashed" || gameState === "finished") return;
    if (newLane >= 0 && newLane < qs[currentQuestion]?.answers.length) {
      setPlayerLane(newLane);
    }
  }

  // Xử lý phím
  useEffect(() => {
    const handleKey = (e) => {
      if (gameState === "running") {
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") moveLane(playerLane - 1);
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") moveLane(playerLane + 1);
        if (e.key === "1") moveLane(0);
        if (e.key === "2") moveLane(1);
        if (e.key === "3") moveLane(2);
        if (e.key === "4") moveLane(3);
      }
      
      // Restart game
      if ((e.key === "r" || e.key === "R") && (gameState === "crashed" || gameState === "finished")) {
        setCurrentQuestion(0);
        setPlayerLane(1);
        setObstaclePosition(800);
        setGameState("running");
        setSelected({});
        hasScoredRef.current = false;
        setUserScore(payload?.user?.score ?? 0);
        setWeekScore(payload?.user?.week_score ?? 0);
      }
    };
    
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, playerLane, qs, currentQuestion, payload]);

  // Tự động chuyển câu hỏi khi va chạm sau 2 giây
  useEffect(() => {
    if (gameState === "crashed") {
      const timer = setTimeout(() => {
        if (currentQuestion < qs.length - 1) {
          setCurrentQuestion(prev => prev + 1);
          setObstaclePosition(800);
          setGameState("running");
          setPlayerLane(1);
          hasScoredRef.current = false;
        } else {
          setGameState("finished");
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState, currentQuestion, qs.length]);

  if (!qs.length) {
    return <div style={{ padding: 20, textAlign: "center", fontSize: 18 }}>Không có câu hỏi nào</div>;
  }

  const currentQ = qs[currentQuestion];
  const laneHeight = 90;

  return (
    <div style={{ width: "100%", height: "100vh", background: "linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)", overflow: "hidden", position: "relative", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Score bar */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10, background: "rgba(255,255,255,0.95)", padding: "12px 20px", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>Câu {currentQuestion + 1}/{qs.length}</div>
        <div style={{ fontSize: 20, fontWeight: "bold", color: "#2c3e50" }}>
          🏆 {userScore} điểm | 📅 {weekScore}
        </div>
      </div>

      {/* Question display (removed blue border) */}
      {gameState === "running" && (
        <div style={{ 
          position: "absolute", 
          top: 20, 
          right: 20,
          background: "rgba(255,255,255,0.98)",
          padding: "20px 32px",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          maxWidth: 400,
          textAlign: "center",
          zIndex: 10
        }}>
          <div style={{ fontSize: 14, color: "#3b82f6", fontWeight: "bold", marginBottom: 8 }}>CÂU HỎI</div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: "#2c3e50", lineHeight: 1.4 }}>
            {currentQ.question_text}
          </div>
          {currentQ.question_image && (
            <img src={currentQ.question_image} alt="" style={{ maxWidth: "100%", maxHeight: 150, display: "block", margin: "16px auto 0", borderRadius: 8 }} />
          )}
        </div>
      )}

      {/* Game canvas */}
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        
        {/* Road background - SOLID COLOR */}
        <div style={{ position: "absolute", width: "100%", height: laneHeight * 4, background: "#2d3748", top: "50%", transform: "translateY(-50%)" }} />
        
        {/* Road container */}
        <div style={{ position: "relative", width: 800, height: laneHeight * 4, overflow: "visible" }}>
          
          {/* Lane dividers - SOLID WHITE LINES */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{ position: "absolute", top: i * laneHeight, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.6)", zIndex: 1 }} />
          ))}

          {/* Lane labels (removed blue highlight) */}
          {currentQ.answers.map((ans, idx) => (
            <div
              key={`label-${idx}`}
              onClick={() => moveLane(idx)}
              style={{
                position: "absolute",
                left: 20,
                top: idx * laneHeight + 10,
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: "bold",
                cursor: gameState === "running" ? "pointer" : "default",
                zIndex: 4,
                border: "2px solid rgba(255,255,255,0.3)",
                transition: "all 0.3s ease"
              }}
            >
              {idx + 1}. {ans.text || (ans.image ? <img src={ans.image} alt="" style={{ maxHeight: 30, verticalAlign: "middle" }} /> : "—")}
            </div>
          ))}

          {/* Player character - IMAGE */}
          <div style={{ 
            position: "absolute", 
            left: 140, 
            top: playerLane * laneHeight + 20,
            width: 60, 
            height: 60, 
            transition: "top 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 5,
            transform: isJumping ? "translateY(-40px) scale(1.1)" : "translateY(0) scale(1)",
            filter: isJumping ? "drop-shadow(0 12px 8px rgba(0,0,0,0.4))" : "drop-shadow(0 4px 4px rgba(0,0,0,0.2))",
          }}>
            <img 
              src="/game-images/game4-runner.png"
              alt="Runner" 
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain",
                transform: isJumping ? "rotate(-10deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease"
              }} 
            />
          </div>

          {/* Obstacles - IMAGE */}
          {(gameState === "running" || gameState === "crashed") && currentQ.answers.map((ans, idx) => {
            const isCorrect = ans.correct;
            const isCrashed = gameState === "crashed" && playerLane === idx;
            const distance = obstaclePosition;
            const opacity = Math.min(1, Math.max(0.3, (800 - distance) / 400));
            
            return (
              <div
                key={ans.id || idx}
                style={{
                  position: "absolute",
                  left: obstaclePosition,
                  top: idx * laneHeight,
                  width: 100,
                  height: laneHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 3,
                  opacity: opacity
                }}
              >
                <img 
                  src="/game-images/game4-barrier.png"
                  alt="Barrier" 
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover",
                    filter: isCrashed ? "hue-rotate(300deg) brightness(1.2)" : "none",
                    transition: "filter 0.3s ease"
                  }} 
                />
              </div>
            );
          })}

          {/* Success effect */}
          {isJumping && (
            <div style={{
              position: "absolute",
              left: 140,
              top: playerLane * laneHeight - 20,
              fontSize: 32,
              animation: "successFloat 0.8s ease-out",
              zIndex: 10,
              pointerEvents: "none"
            }}>
              ✨
            </div>
          )}
        </div>
      </div>

      {/* Finish screen */}
      {gameState === "finished" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(34, 197, 94, 0.15)", backdropFilter: "blur(10px)", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 50, borderRadius: 24, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 400 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 36, fontWeight: "bold", color: "#22c55e", marginBottom: 12 }}>Hoàn thành!</div>
            <div style={{ fontSize: 24, color: "#666", marginBottom: 8 }}>Tổng điểm: <span style={{ color: "#2c3e50", fontWeight: "bold" }}>{userScore}</span></div>
            <div style={{ fontSize: 18, color: "#999", marginTop: 20 }}>Nhấn <kbd style={{ background: "#f3f4f6", padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db" }}>R</kbd> để chơi lại</div>
          </div>
        </div>
      )}

      {/* Crash screen */}
      {gameState === "crashed" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(239, 68, 68, 0.15)", backdropFilter: "blur(10px)", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 50, borderRadius: 24, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 400 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💥</div>
            <div style={{ fontSize: 36, fontWeight: "bold", color: "#ef4444", marginBottom: 12 }}>Va chạm!</div>
            <div style={{ fontSize: 18, color: "#666", marginBottom: 8 }}>Bạn chọn sai làn đường</div>
            <div style={{ fontSize: 16, color: "#999", marginTop: 4 }}>
              Đáp án đúng: <span style={{ color: "#22c55e", fontWeight: "bold" }}>
                {currentQ.answers.find(a => a.correct)?.text || "—"}
              </span>
            </div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 16 }}>Tự động chuyển câu tiếp theo trong 2 giây...</div>
          </div>
        </div>
      )}

      {/* Removed bottom instructions as requested */}

      {/* CSS Animation */}
      <style>{`\n        @keyframes successFloat {\n          0% { transform: translateY(0) scale(1); opacity: 1; }\n          100% { transform: translateY(-50px) scale(1.5); opacity: 0; }\n        }\n        kbd {\n          font-family: monospace;\n          font-weight: bold;\n        }\n      `}</style>
    </div>
  );
}
