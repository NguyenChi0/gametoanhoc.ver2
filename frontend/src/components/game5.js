// src/components/games/Game1.jsx
import React, { useMemo, useState, useEffect } from "react";
import api from "../api";

export default function Game1({ payload }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState(payload?.questions || []);
  const [selected, setSelected] = useState({});
  const [userScore, setUserScore] = useState(payload?.user?.score ?? null);
  const [weekScore, setWeekScore] = useState(payload?.user?.week_score ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);

  // Shuffle câu trả lời cho câu hiện tại
  const currentQuestion = useMemo(() => {
    if (!questions[currentQuestionIndex]) return null;
    
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const q = questions[currentQuestionIndex];
    const answers = Array.isArray(q.answers) ? shuffle(q.answers) : [];
    
    // Tìm index của câu trả lời đúng
    const correctIndex = answers.findIndex(answer => answer.correct);
    setCorrectAnswerIndex(correctIndex);
    
    return { ...q, answers };
  }, [questions, currentQuestionIndex]);

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

  // Fetch câu hỏi tiếp theo
  async function fetchNextQuestion() {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const resp = await api.get(`/game/next-question?current=${currentQuestionIndex + 1}`);
      if (resp.data.question) {
        setQuestions(prev => [...prev, resp.data.question]);
      }
    } catch (e) {
      console.warn("Lỗi fetch câu hỏi tiếp theo:", e);
    } finally {
      setIsLoading(false);
    }
  }

  function choose(qId, ansIdx) {
    if (selected[qId] !== undefined) return; // lock once chosen
    setSelected((prev) => ({ ...prev, [qId]: ansIdx }));

    const q = questions.find((x) => x.id === qId);
    const a = q?.answers?.[ansIdx];
    
    if (a && a.correct) {
      const userId =
        payload?.user?.id ||
        (localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).id);

      if (!userId) {
        console.warn("Người dùng chưa login — không thể cộng điểm trên server.");
        return;
      }

      // Hiển thị ảnh đúng trong 2 giây
      setShowCorrectAnswer(true);

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

      // Chuyển sang câu tiếp theo sau 2 giây
      setTimeout(() => {
        setShowCorrectAnswer(false);
        setCurrentQuestionIndex(prev => prev + 1);
        // Fetch câu hỏi tiếp theo nếu sắp hết
        if (currentQuestionIndex >= questions.length - 2) {
          fetchNextQuestion();
        }
      }, 2000);
    } else {
      // Nếu trả lời sai, chuyển câu sau 1.5 giây
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        // Fetch câu hỏi tiếp theo nếu sắp hết
        if (currentQuestionIndex >= questions.length - 2) {
          fetchNextQuestion();
        }
      }, 1500);
    }
  }

  // Fetch câu hỏi đầu tiên nếu chưa có
  useEffect(() => {
    if (questions.length === 0) {
      fetchNextQuestion();
    }
  }, []);

  if (!currentQuestion) {
    return (
      <div style={{ 
        background: "#f0f2f5", 
        minHeight: "100vh", 
        padding: 20, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2>🎉 Hoàn thành!</h2>
          <p>Bạn đã trả lời hết tất cả câu hỏi.</p>
          {userScore !== null && (
            <p>Điểm tổng: <b>{userScore}</b> | Điểm tuần: <b>{weekScore}</b></p>
          )}
        </div>
      </div>
    );
  }

  const sel = selected[currentQuestion.id];

  return (
    <div
      style={{
        background: "#f0f2f5",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 10 }}>🎯 Trò chơi: Ai nói thật?</h2>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        Câu {currentQuestionIndex + 1}{" "}
        {userScore !== null && (
          <span>
            — Điểm tổng: <b>{userScore}</b> | Điểm tuần: <b>{weekScore}</b>
          </span>
        )}
      </div>

      <div
        style={{
          margin: "30px auto",
          maxWidth: 800,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Cảnh sát */}
        <div
          style={{
            backgroundColor: "#1e90ff",
            backgroundImage: "url('/game-images/game5-police.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            color: "white",
            padding: "20px 30px",
            borderRadius: 12,
            marginBottom: 25,
            width: "520px",
            height: "200px",
            textAlign: "center",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            fontWeight: "bold",
            fontSize: 18,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "10px 20px",
            borderRadius: "8px",
            marginTop: "10px"
          }}>
            👮‍♂️ Cảnh sát hỏi: {currentQuestion.question_text}
          </div>
          {currentQuestion.question_image && (
            <img
              src={currentQuestion.question_image}
              alt=""
              style={{
                display: "block",
                margin: "10px auto 0",
                maxWidth: 200,
                borderRadius: 8,
              }}
            />
          )}
        </div>

        {/* Tên cướp */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 25,
            justifyContent: "center",
          }}
        >
          {currentQuestion.answers.map((a, ai) => {
            // Xác định màu nền và ảnh nền
            let backgroundColor = "#ff4d4d";
            let border = "3px solid #a30000";
            let backgroundImage = "url('/game-images/game5-crime.png')";

            // Nếu đang hiển thị câu trả lời đúng và đây là câu đúng
            if (showCorrectAnswer && correctAnswerIndex === ai) {
              backgroundImage = "url('/game-images/game5-notcrime.png')";
              backgroundColor = "rgba(76, 175, 80, 0.7)"; // Xanh với độ trong suốt
              border = "3px solid #2e7d32";
            } else if (sel !== undefined) {
              const chosen = sel === ai;
              if (chosen && a.correct) {
                backgroundColor = "rgba(76, 175, 80, 0.7)"; // Xanh với độ trong suốt
                border = "3px solid #2e7d32";
              } else if (chosen && !a.correct) {
                backgroundColor = "rgba(229, 115, 115, 0.7)"; // Đỏ nhạt với độ trong suốt
                border = "3px solid #c62828";
              } else if (!chosen && a.correct) {
                backgroundColor = "rgba(76, 175, 80, 0.7)"; // Xanh với độ trong suốt
                border = "3px solid #2e7d32";
              } else {
                backgroundColor = "rgba(255, 136, 136, 0.7)"; // Đỏ nhạt hơn với độ trong suốt
              }
            } else {
              // Trạng thái mặc định - chỉ hiển thị ảnh crime
              backgroundColor = "transparent";
            }

            return (
              <button
                key={a.id || ai}
                onClick={() => choose(currentQuestion.id, ai)}
                disabled={sel !== undefined || showCorrectAnswer}
                style={{
                  width: 125,
                  height: 155,
                  backgroundColor,
                  backgroundImage,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  border,
                  color: "white",
                  borderRadius: 8,
                  cursor: (sel === undefined && !showCorrectAnswer) ? "pointer" : "default",
                  fontWeight: "bold",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  if (sel === undefined && !showCorrectAnswer) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 6px 8px rgba(0,0,0,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (sel === undefined && !showCorrectAnswer) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";
                  }
                }}
              >
                <div style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  textAlign: "center",
                  width: "100%"
                }}>
                  {a.text ||
                    (a.image ? (
                      <img
                        src={a.image}
                        alt=""
                        style={{ maxWidth: 80, borderRadius: 6 }}
                      />
                    ) : (
                      "—"
                    ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p>Đang tải câu tiếp theo...</p>
        </div>
      )}
    </div>
  );
}