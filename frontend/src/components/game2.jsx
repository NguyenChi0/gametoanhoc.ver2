// src/components/games/game2.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import api from "../api";

export default function Game1({ payload }) {
  const questions = payload?.questions || [];

  const [selected, setSelected] = useState({});
  const [userScore, setUserScore] = useState(payload?.user?.score ?? null);
  const [weekScore, setWeekScore] = useState(payload?.user?.week_score ?? 0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(50);
  const [flies, setFlies] = useState([]);
  const gameAreaRef = useRef(null);

  const getImageSrc = (imgPath) => {
  if (!imgPath) return null;
  if (/^https?:\/\//i.test(imgPath)) return imgPath;
  if (imgPath.startsWith("/")) return imgPath;
  if (imgPath.startsWith("game-images/")) return `${process.env.PUBLIC_URL}/${imgPath}`;
  return `${process.env.PUBLIC_URL}/game-images/${imgPath}`;
};



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

  // Khởi tạo vị trí và hướng di chuyển cho các con ruồi
  useEffect(() => {
    if (!gameStarted || !currentQuestion) return;

    const initialFlies = currentQuestion.answers.map((answer, idx) => ({
      id: answer.id || idx,
      answer: answer,
      answerIndex: idx,
      x: Math.random() * 80 + 10, // 10% to 90%
      y: Math.random() * 80 + 10,
      dx: (Math.random() - 0.5) * 1.5, // Tốc độ chậm hơn
      dy: (Math.random() - 0.5) * 1.5,
      size: 80,
    }));

    setFlies(initialFlies);
  }, [currentQuestionIndex, gameStarted, currentQuestion]);

  // Di chuyển các con ruồi
  useEffect(() => {
    if (!gameStarted || selected[currentQuestion?.id] !== undefined) return;

    const interval = setInterval(() => {
      setFlies((prevFlies) =>
        prevFlies.map((fly) => {
          let newX = fly.x + fly.dx;
          let newY = fly.y + fly.dy;
          let newDx = fly.dx;
          let newDy = fly.dy;

          // Bounce off walls - tính toán chính xác với size của ruồi
          const margin = 5; // Buffer để không chèn ra ngoài
          if (newX <= margin || newX >= (100 - margin)) {
            newDx = -fly.dx;
            newX = newX <= margin ? margin : (100 - margin);
          }
          if (newY <= margin || newY >= (100 - margin)) {
            newDy = -fly.dy;
            newY = newY <= margin ? margin : (100 - margin);
          }

          return {
            ...fly,
            x: newX,
            y: newY,
            dx: newDx,
            dy: newDy,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted, selected, currentQuestion]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (!gameStarted || selected[currentQuestion?.id] !== undefined) return;

    if (timeLeft <= 0) {
      // Hết giờ, tự động chuyển câu tiếp theo
      setTimeout(() => {
        if (currentQuestionIndex < qs.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setTimeLeft(50);
        } else {
          setGameStarted(false);
        }
      }, 1000);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameStarted, selected, currentQuestion, currentQuestionIndex, qs.length]);

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

  function hitFly(fly) {
    const qId = currentQuestion.id;
    if (selected[qId] !== undefined) return; // already answered

    setSelected((prev) => ({ ...prev, [qId]: fly.answerIndex }));

    const isCorrect = fly.answer.correct;

    if (isCorrect) {
      // Lấy userId
      const userId =
        payload?.user?.id ||
        (localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).id);

      if (!userId) {
        console.warn("Người dùng chưa login — không thể cộng điểm trên server.");
      } else {
        // Cộng điểm
        incrementScoreOnServer(userId, 1).then((data) => {
          if (data && data.success) {
            setUserScore(data.score);
            setWeekScore(data.week_score ?? 0);

            // Cập nhật lại localStorage
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

    // Chuyển câu hỏi sau 1.5s
    setTimeout(() => {
      if (currentQuestionIndex < qs.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeLeft(50);
      } else {
        setGameStarted(false);
      }
    }, 1500);
  }

  function startGame() {
    setGameStarted(true);
    setSelected({});
    setCurrentQuestionIndex(0);
    setTimeLeft(50);
  }

  function restartGame() {
    setGameStarted(true);
    setSelected({});
    setCurrentQuestionIndex(0);
    setTimeLeft(50);
  }

  if (!gameStarted) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h2 style={{ fontSize: 32, marginBottom: 20, color: "#2c3e50" }}>
          🪰 Game Đập Ruồi 🪰
        </h2>
        
        <div style={{ marginBottom: 20, fontSize: 18 }}>
          {userScore !== null && (
            <div>
              <span style={{ marginRight: 20 }}>
                Điểm tổng: <b style={{ color: "#e74c3c" }}>{userScore}</b>
              </span>
              <span>
                Điểm tuần: <b style={{ color: "#3498db" }}>{weekScore}</b>
              </span>
            </div>
          )}
        </div>

        <div style={{ 
          background: "#ecf0f1", 
          padding: 20, 
          borderRadius: 12, 
          maxWidth: 500, 
          margin: "0 auto 20px",
          textAlign: "left"
        }}>
          <h3 style={{ marginTop: 0, color: "#34495e" }}>📜 Cách chơi:</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>Đọc câu hỏi ở bên trái màn hình</li>
            <li>Đập vào con ruồi có câu trả lời đúng ở bên phải</li>
            <li>Mỗi câu có <b>50 giây</b> để trả lời</li>
            <li>Đập đúng = cộng điểm, đập sai = không cộng điểm</li>
            <li>Có tổng cộng <b>{qs.length}</b> câu hỏi</li>
          </ul>
        </div>

        <button
          onClick={currentQuestionIndex === 0 ? startGame : restartGame}
          style={{
            padding: "15px 40px",
            fontSize: 20,
            fontWeight: 700,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 50,
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
        >
          {currentQuestionIndex === 0 ? "🎮 Bắt đầu chơi" : "🔄 Chơi lại"}
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div style={{ padding: 20 }}>Không có câu hỏi nào!</div>;
  }

  const isAnswered = selected[currentQuestion.id] !== undefined;
  const selectedAnswer = isAnswered ? currentQuestion.answers[selected[currentQuestion.id]] : null;

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 20,
        padding: 15,
        background: "#34495e",
        borderRadius: 10,
        color: "white"
      }}>
        <div>
          Câu {currentQuestionIndex + 1}/{qs.length}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          ⏱️ {timeLeft}s
        </div>
        <div>
          {userScore !== null && (
            <span>
              Điểm: <b>{userScore}</b> | Tuần: <b>{weekScore}</b>
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        {/* Ô câu hỏi bên trái */}
        <div style={{
  position: "relative",
  flex: "0 0 300px",
  height: 400,
  borderRadius: 10,
  overflow: "hidden",
  border: "3px solid #3498db",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
}}>
  <img
    src={getImageSrc("game2-backgroundiamgescauhoi.png")}
    alt="background câu hỏi"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 0,
      filter: "brightness(1)"
    }}
  />
  <div style={{
    position: "relative",
    zIndex: 1,
    padding: 25,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
    color: "#310808ff",
  }}>
    <div style={{ fontSize: 30, fontWeight: 600 }}>
      {currentQuestion.question_text}
    </div>
    {currentQuestion.question_image && (
      <img
        src={getImageSrc(currentQuestion.question_image)}
        alt=""
        style={{ maxWidth: "100%", marginTop: 10, borderRadius: 8 }}
      />
    )}
  </div>
</div>


        {/* Ô chứa các con ruồi bên phải */}
        <div
          ref={gameAreaRef}
          style={{
            position: "relative",
            flex: 1,
            height: 400,
            background: "linear-gradient(180deg, #87ceeb 0%, #e0f6ff 100%)",
            borderRadius: 15,
            border: "4px solid #2c3e50",
            overflow: "hidden",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)",
          }}
        >
          {flies.map((fly) => (
            <div
              key={fly.id}
              onClick={() => !isAnswered && hitFly(fly)}
              style={{
                position: "absolute",
                left: `${fly.x}%`,
                top: `${fly.y}%`,
                width: fly.size,
                height: fly.size,
                cursor: isAnswered ? "default" : "pointer",
                transform: "translate(-50%, -50%)",
                transition: "transform 0.1s",
                opacity: isAnswered ? 0.6 : 1,
                pointerEvents: isAnswered ? "none" : "auto",
              }}
              onMouseOver={(e) => {
                if (!isAnswered) e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
              }}
            >
              <div style={{
                position: "relative",
                width: "100%",
                height: "100%",
              }}>
                {/* Con ruồi */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: 50,
                  filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))",
                }}>
                  🪰
                </div>
                
                {/* Câu trả lời */}
                <div style={{
                  position: "absolute",
                  bottom: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "white",
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "2px solid #2c3e50",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  maxWidth: 150,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                }}>
                  {fly.answer.text || (fly.answer.image ? "🖼️" : "—")}
                </div>
              </div>
            </div>
          ))}

          {isAnswered && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: selectedAnswer?.correct 
                ? "rgba(46, 204, 113, 0.95)" 
                : "rgba(231, 76, 60, 0.95)",
              color: "white",
              padding: "30px 50px",
              borderRadius: 20,
              fontSize: 32,
              fontWeight: 700,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              zIndex: 1000,
              textAlign: "center",
            }}>
              {selectedAnswer?.correct ? "✅ Chính xác!" : "❌ Sai rồi!"}
              <div style={{ fontSize: 16, marginTop: 10, fontWeight: 400 }}>
                {selectedAnswer?.correct 
                  ? "Bạn đã đập đúng con ruồi!" 
                  : `Đáp án đúng: ${currentQuestion.answers.find(a => a.correct)?.text || "..."}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}