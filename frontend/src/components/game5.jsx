// src/components/games/game5.jsx
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

  // Shuffle câu trả lời cho câu hiện tại (không setState trong useMemo)
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
    return { ...q, answers };
  }, [questions, currentQuestionIndex]);

  // index của đáp án đúng trong currentQuestion (derived, không state)
  const correctAnswerIndex = useMemo(() => {
    if (!currentQuestion) return null;
    return currentQuestion.answers.findIndex((ans) => ans.correct);
  }, [currentQuestion]);

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
      if (resp.data?.question) {
        setQuestions((prev) => [...prev, resp.data.question]);
      }
    } catch (e) {
      console.warn("Lỗi fetch câu hỏi tiếp theo:", e);
    } finally {
      setIsLoading(false);
    }
  }

  function choose(qId, ansIdx) {
    // lock once chosen
    if (selected[qId] !== undefined) return;

    // set selected ngay để lock UI
    setSelected((prev) => ({ ...prev, [qId]: ansIdx }));

    // **DÙNG currentQuestion.answers (đã shuffle)** để kiểm tra chính xác
    const a = currentQuestion?.answers?.[ansIdx];

    if (a && a.correct) {
      const userId =
        payload?.user?.id ||
        (localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).id);

      if (!userId) {
        console.warn("Người dùng chưa login — không thể cộng điểm trên server.");
        // vẫn giữ selected nhưng không cộng điểm
        setShowCorrectAnswer(true);
        // chuyển câu tiếp theo sau 2s
        setTimeout(() => {
          setShowCorrectAnswer(false);
          setCurrentQuestionIndex((prev) => {
            const next = prev + 1;
            if (next >= questions.length - 2) fetchNextQuestion();
            return next;
          });
        }, 2000);
        return;
      }

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

      // chuyển câu sau 2s, dùng functional update để tránh stale index
      setTimeout(() => {
        setShowCorrectAnswer(false);
        setCurrentQuestionIndex((prev) => {
          const next = prev + 1;
          if (next >= questions.length - 2) fetchNextQuestion();
          return next;
        });
      }, 2000);
    } else {
      // trả lời sai: chuyển câu sau 1.5s (giữ selected để hiển thị trạng thái)
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => {
          const next = prev + 1;
          if (next >= questions.length - 2) fetchNextQuestion();
          return next;
        });
      }, 1500);
    }
  }

  // Fetch câu hỏi đầu tiên nếu chưa có
  useEffect(() => {
    if (questions.length === 0) {
      fetchNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // giữ [] để chỉ chạy 1 lần giống behavior cũ

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
      <h2 style={{ textAlign: "center", marginBottom: 10 }}>Hãy giúp chú cảnh sát tìm ra người không phải thủ phạm</h2>
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
            backgroundImage: `url(${process.env.PUBLIC_URL}/game-images/game5-police.png)`,
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
            let backgroundColor = "#ff4d4d";
            let border = "3px solid #a30000";
            let backgroundImage = `url(${process.env.PUBLIC_URL}/game-images/game5-crime.png)`;

            if (showCorrectAnswer && correctAnswerIndex === ai) {
              backgroundImage = `url(${process.env.PUBLIC_URL}/game-images/game5-notcrime.png)`;
              backgroundColor = "rgba(76, 175, 80, 0.7)";
              border = "3px solid #2e7d32";
            } else if (sel !== undefined) {
              const chosen = sel === ai;
              if (chosen && a.correct) {
                backgroundColor = "rgba(76, 175, 80, 0.7)";
                border = "3px solid #2e7d32";
              } else if (chosen && !a.correct) {
                backgroundColor = "rgba(229, 115, 115, 0.7)";
                border = "3px solid #c62828";
              } else if (!chosen && a.correct) {
                backgroundColor = "rgba(76, 175, 80, 0.7)";
                border = "3px solid #2e7d32";
              } else {
                backgroundColor = "rgba(255, 136, 136, 0.7)";
              }
            } else {
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
