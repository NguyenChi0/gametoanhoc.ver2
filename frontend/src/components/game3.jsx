// src/components/game3.js
import React, { useMemo, useState } from "react";
import api from "../api";

export default function Game3({ payload }) {
  const questions = payload?.questions || [];

  const [selected, setSelected] = useState({});
  const [userScore, setUserScore] = useState(payload?.user?.score ?? null);
  const [weekScore, setWeekScore] = useState(payload?.user?.week_score ?? 0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [dartPosition, setDartPosition] = useState({ x: 0, y: 0, visible: false, segmentIndex: null });

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

  // Tính toán vị trí phi tiêu CHÍNH XÁC dựa trên segment index
  const getDartTargetPosition = (segmentIndex) => {
    // Vị trí trung tâm của từng segment (tính từ tâm bảng)
    const segmentCenters = {
      0: { x: 75, y: 75 },   // Segment 1 - góc phần tư thứ 2 (trên trái)
      1: { x: 225, y: 75 },  // Segment 2 - góc phần tư thứ 1 (trên phải)
      2: { x: 225, y: 225 }, // Segment 3 - dưới trái (đổi vị trí với 3)
    3: { x: 75, y: 225 }   // Segment 4 - dưới phải (đổi vị trí với 2)
    };
    
    return segmentCenters[segmentIndex];
  };

  function handleDartThrow(qId, ansIdx) {
    if (selected[qId] !== undefined || gameOver) return;

    const q = qs.find((x) => x.id === qId);
    const a = q?.answers?.[ansIdx];
    
    setSelected((prev) => ({ ...prev, [qId]: ansIdx }));

    // Tính toán vị trí đích cho phi tiêu
    const targetPosition = getDartTargetPosition(ansIdx);
    
    // Hiệu ứng phi tiêu bay
    setDartPosition({
      x: targetPosition.x,
      y: targetPosition.y,
      visible: true,
      segmentIndex: ansIdx
    });

    if (a && a.correct) {
      const userId = payload?.user?.id ||
        (localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")).id);

      if (!userId) {
        console.warn("Người dùng chưa login — không thể cộng điểm trên server.");
      } else {
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

      setTimeout(() => {
        // Ẩn phi tiêu trước khi chuyển câu
        setDartPosition({ x: 0, y: 0, visible: false, segmentIndex: null });
        
        if (currentQuestionIndex < qs.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelected({});
        } else {
          setGameWon(true);
        }
      }, 1500);
    } else {
      setTimeout(() => {
        // Ẩn phi tiêu trước khi kết thúc game
        setDartPosition({ x: 0, y: 0, visible: false, segmentIndex: null });
        setGameOver(true);
      }, 1500);
    }
  }

  function resetGame() {
    setCurrentQuestionIndex(0);
    setSelected({});
    setGameOver(false);
    setGameWon(false);
    setDartPosition({ x: 0, y: 0, visible: false, segmentIndex: null });
  }

  const dartColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"];

  if (qs.length === 0) {
    return <div>Không có câu hỏi</div>;
  }

  if (gameOver) {
    return (
      <div style={styles.gameOver}>
        <h2>Game Over!</h2>
        <p>Bạn đã trả lời sai. Số câu đúng: {currentQuestionIndex}</p>
        <button onClick={resetGame} style={styles.playAgainBtn}>
          Chơi lại
        </button>
      </div>
    );
  }

  if (gameWon) {
    return (
      <div style={styles.gameWon}>
        <h2>Chúc mừng!</h2>
        <p>Bạn đã hoàn thành tất cả câu hỏi!</p>
        <button onClick={resetGame} style={styles.playAgainBtn}>
          Chơi lại
        </button>
      </div>
    );
  }

  const currentQuestion = qs[currentQuestionIndex];
  const selectedAnswerIndex = selected[currentQuestion.id];

  return (
    <div style={styles.dartGame}>
      <style>{`
        @keyframes dartBoardAppear {
          0% {
            transform: scale(0.8) rotate(-180deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes flyInFromCorner {
          0% {
            transform: translate(-50%, -50%) scale(0.3) rotate(-180deg);
            opacity: 0;
            left: 20px;
            top: 20px;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.1) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .dart-segment-button:hover:not(:disabled) {
          transform: scale(1.05);
          z-index: 10;
          filter: brightness(1.2);
        }
        
        .play-again-btn:hover {
          background: #2980b9;
        }
        
        .dart-segment-button:disabled {
          cursor: not-allowed;
        }
      `}</style>
      
      <h3>Game Ném Phi Tiêu</h3>
      <div style={styles.gameInfo}>
        <div>
          Câu {currentQuestionIndex + 1}/{qs.length}
        </div>
        {userScore !== null && (
          <div style={styles.scoreInfo}>
            Điểm tổng: <b>{userScore}</b> | Điểm tuần: <b>{weekScore}</b>
          </div>
        )}
      </div>

      <div style={styles.questionSection}>
        <div style={styles.questionText}>
          {currentQuestionIndex + 1}. {currentQuestion.question_text}
        </div>
        {currentQuestion.question_image && (
          <img
            src={currentQuestion.question_image}
            alt="Câu hỏi"
            style={styles.questionImage}
          />
        )}
      </div>

      <div style={styles.dartBoardContainer}>
        <div style={styles.dartBoard}>
          {currentQuestion.answers.map((answer, index) => {
            const isSelected = selectedAnswerIndex === index;
            const isCorrect = answer.correct;
            const showResult = selectedAnswerIndex !== undefined;

            let segmentStyle = { ...styles.dartSegment };
            if (showResult) {
              if (isCorrect) {
                segmentStyle = { ...segmentStyle, ...styles.correctSegment };
              } else if (isSelected) {
                segmentStyle = { ...segmentStyle, ...styles.wrongSegment };
              }
            }

            return (
              <div
                key={answer.id || index}
                style={{
                  ...segmentStyle,
                  ...styles[`segment${index + 1}`],
                  backgroundColor: dartColors[index]
                }}
              >
                <button
                  style={styles.dartSegmentButton}
                  onClick={() => handleDartThrow(currentQuestion.id, index)}
                  disabled={selectedAnswerIndex !== undefined}
                >
                  <div style={styles.answerContent}>
                    {answer.text ? (
                      <span style={styles.answerText}>{answer.text}</span>
                    ) : answer.image ? (
                      <img src={answer.image} alt="" style={styles.answerImage} />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
          
          {/* Hiển thị phi tiêu khi bay */}
          {dartPosition.visible && (
            <div
              style={{
                ...styles.dart,
                left: dartPosition.x,
                top: dartPosition.y,
              }}
            >
              <img 
  src={`${process.env.PUBLIC_URL}/game-images/game3-dart.png`} 
  alt="Phi tiêu" 
  style={styles.dartImage}
/>

            </div>
          )}
        </div>
      </div>

      <div style={styles.dartColorsGuide}>
        {currentQuestion.answers.map((answer, index) => (
          <div key={index} style={styles.colorGuideItem}>
            <div
              style={{ ...styles.colorBox, backgroundColor: dartColors[index] }}
            ></div>
            <span>
              {answer.text || `Đáp án ${index + 1}`}
              {selectedAnswerIndex !== undefined && answer.correct && " ✓"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  dartGame: {
    textAlign: "center",
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  gameInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    padding: "10px",
    background: "#f5f5f5",
    borderRadius: "8px",
  },
  scoreInfo: {
    fontSize: "14px",
  },
  questionSection: {
    marginBottom: "30px",
  },
  questionText: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  questionImage: {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "8px",
    marginTop: "10px",
  },
  dartBoardContainer: {
    position: "relative",
    width: "300px",
    height: "300px",
    margin: "0 auto 30px",
  },
  dartBoard: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#2c3e50",
    border: "8px solid #34495e",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
    overflow: "hidden",
    animation: "dartBoardAppear 0.6s ease-out",
  },
  dartSegment: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
    transformOrigin: "100% 100%",
  },
  dartSegmentButton: {
    position: "absolute",
    width: "200%",
    height: "200%",
    border: "none",
    background: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  segment1: {
    top: 0,
    left: 0,
    transform: "rotate(0deg)",
  },
  segment2: {
    top: 0,
    left: 0,
    transform: "rotate(90deg)",
  },
  segment3: {
    top: 0,
    left: 0,
    transform: "rotate(180deg)",
  },
  segment4: {
    top: 0,
    left: 0,
    transform: "rotate(270deg)",
  },
  answerContent: {
    position: "absolute",
    width: "100px",
    height: "100px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    transform: "rotate(45deg)",
    left: "30px",
    top: "30px",
  },
  answerText: {
    fontWeight: "bold",
    color: "white",
    textShadow: "1px 1px 3px rgba(0, 0, 0, 0.8)",
    fontSize: "14px",
    transform: "rotate(-45deg)",
  },
  answerImage: {
    maxWidth: "60px",
    maxHeight: "60px",
    filter: "drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8))",
    transform: "rotate(-45deg)",
  },
  correctSegment: {
    boxShadow: "inset 0 0 0 6px #27ae60, 0 0 25px #27ae60",
  },
  wrongSegment: {
    boxShadow: "inset 0 0 0 6px #e74c3c, 0 0 25px #e74c3c",
  },
  dart: {
    position: "absolute",
    width: "60px",
    height: "60px",
    transform: "translate(-50%, -50%)",
    zIndex: 100,
    animation: "flyInFromCorner 0.8s ease-out forwards",
  },
  dartImage: {
    width: "100%",
    height: "100%",
    filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5))",
  },
  dartColorsGuide: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  colorGuideItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#f8f9fa",
    borderRadius: "6px",
    border: "1px solid #dee2e6",
  },
  colorBox: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "2px solid #fff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  },
  gameOver: {
    textAlign: "center",
    padding: "40px 20px",
  },
  gameWon: {
    textAlign: "center",
    padding: "40px 20px",
  },
  playAgainBtn: {
    background: "#3498db",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "20px",
    transition: "background 0.3s ease",
  },
};

// Responsive adjustments
const updateStylesForMobile = () => {
  if (window.matchMedia("(max-width: 480px)").matches) {
    Object.assign(styles.dartBoardContainer, {
      width: "250px",
      height: "250px",
    });
    Object.assign(styles.answerContent, {
      width: "80px",
      height: "80px",
      left: "25px",
      top: "25px",
    });
    Object.assign(styles.answerText, {
      fontSize: "12px",
    });
    Object.assign(styles.answerImage, {
      maxWidth: "50px",
      maxHeight: "50px",
    });
    Object.assign(styles.dart, {
      width: "50px",
      height: "50px",
    });
    
    // Cập nhật vị trí trung tâm cho mobile
    const segmentCentersMobile = {
      0: { x: 62.5, y: 62.5 },   // Segment 1
      1: { x: 187.5, y: 62.5 },  // Segment 2
      2: { x: 62.5, y: 187.5 },  // Segment 3
      3: { x: 187.5, y: 187.5 }  // Segment 4
    };
    
    // Ghi đè hàm getDartTargetPosition cho mobile
    const originalGetDartTargetPosition = window.getDartTargetPosition;
    window.getDartTargetPosition = (segmentIndex) => segmentCentersMobile[segmentIndex];
  }
};

// Initialize responsive styles
updateStylesForMobile();
window.addEventListener('resize', updateStylesForMobile);