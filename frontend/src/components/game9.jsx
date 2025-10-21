// src/components/games/game9.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import api from "../api";

export default function Game1({ payload }) {
  const questions = payload?.questions || [];

  const [selected, setSelected] = useState({});
  const [userScore, setUserScore] = useState(payload?.user?.score ?? null);
  const [weekScore, setWeekScore] = useState(payload?.user?.week_score ?? 0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

  function handleAnswerSelected(qId, isCorrect) {
    if (selected[qId] !== undefined) return;

    setSelected((prev) => ({ ...prev, [qId]: isCorrect }));

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

    // Chuyển câu hỏi sau 2 giây
    setTimeout(() => {
      if (currentQuestionIndex < qs.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 2000);
  }

  if (!currentQuestion) {
    return <div>Đang tải câu hỏi...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      padding: '20px', 
      gap: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Phần câu hỏi - 1/3 layout */}
      <div style={{ 
        flex: 1, 
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>Game Đưa Thỏ Về Hang</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>
            Câu hỏi {currentQuestionIndex + 1}/{qs.length}
          </div>
          {userScore !== null && (
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Điểm tổng: <b style={{ color: '#4CAF50' }}>{userScore}</b> | 
              Điểm tuần: <b style={{ color: '#2196F3' }}>{weekScore}</b>
            </div>
          )}
        </div>
        
        <div style={{ 
          flex: 1,
          background: "#f8f9fa", 
          padding: "20px", 
          borderRadius: "8px", 
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: "18px", color: '#333' }}>
            {currentQuestion.question_text}
          </div>
          {currentQuestion.question_image && (
            <img
              src={currentQuestion.question_image}
              alt="Câu hỏi"
              style={{ 
                maxWidth: "100%", 
                maxHeight: "100%", 
                display: "block", 
                marginBottom: 16,
                borderRadius: "6px",
                border: '1px solid #ddd'
              }}
            />
          )}
        </div>
      </div>

      {/* Phần game - 2/3 layout */}
      <div style={{ 
        flex: 2, 
        background: 'white', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <RabbitGame 
          key={currentQuestion.id} // Thêm key để reset component khi câu hỏi thay đổi
          question={currentQuestion}
          onAnswerSelected={(isCorrect) => handleAnswerSelected(currentQuestion.id, isCorrect)}
          isAnswered={selected[currentQuestion.id] !== undefined}
          isCorrect={selected[currentQuestion.id]}
        />
      </div>
    </div>
  );
}

// Component game đưa thỏ về hang
function RabbitGame({ question, onAnswerSelected, isAnswered, isCorrect }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState([]);
  const [rabbitPosition, setRabbitPosition] = useState({ x: 200, y: 400 });
  const [isMoving, setIsMoving] = useState(false);
  const animationRef = useRef(null);

  // Load images
  const [rabbitImage, setRabbitImage] = useState(null);
  const [houseImage, setHouseImage] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
  // Load images
  const rabbitImg = new Image();
  rabbitImg.src = `${process.env.PUBLIC_URL}/game-images/game9-rabbit.png`;
  rabbitImg.onload = () => setRabbitImage(rabbitImg);

  const houseImg = new Image();
  houseImg.src = `${process.env.PUBLIC_URL}/game-images/game9-hang.png`;
  houseImg.onload = () => setHouseImage(houseImg);

  const bgImg = new Image();
  bgImg.src = `${process.env.PUBLIC_URL}/game-images/game9-background.png`;
  bgImg.onload = () => setBackgroundImage(bgImg);
}, []);

  const houses = [
    { id: 0, x: 100, y: 100, answer: question.answers[0] },
    { id: 1, x: 300, y: 100, answer: question.answers[1] },
    { id: 2, x: 100, y: 300, answer: question.answers[2] },
    { id: 3, x: 300, y: 300, answer: question.answers[3] }
  ];

  // Kích thước
  const rabbitSize = 60;
  const houseSize = 80;

  // Reset game khi câu hỏi thay đổi
  useEffect(() => {
    resetGame();
  }, [question]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ background nếu đã load
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    
    // Vẽ đường đi
    if (path.length > 1) {
      ctx.strokeStyle = '#52c0f7ff';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }

    // Vẽ các ngôi nhà
    houses.forEach((house) => {
      if (houseImage) {
        ctx.drawImage(houseImage, house.x - houseSize/2, house.y - houseSize/2, houseSize, houseSize);
      } else {
        // Fallback nếu ảnh chưa load
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(house.x - houseSize/2, house.y - houseSize/2, houseSize, houseSize);
      }
      
      // Hiển thị nội dung đáp án
      ctx.fillStyle = '#ffffffff';
      ctx.font = 'bold 25px Arial';
      ctx.textAlign = 'center';
      
      if (house.answer.text) {
        const text = house.answer.text.length > 15 ? 
          house.answer.text.substring(0, 15) + '...' : house.answer.text;
        ctx.fillText(text, house.x, house.y + houseSize/2 + 15);
      } else if (house.answer.image) {
        ctx.fillStyle = '#ddd';
        ctx.fillRect(house.x - 30, house.y + houseSize/2 + 5, 60, 30);
        ctx.fillStyle = '#666';
        ctx.fillText('[Hình ảnh]', house.x, house.y + houseSize/2 + 25);
      }
    });

    // Vẽ con thỏ
    if (rabbitImage) {
      ctx.drawImage(rabbitImage, rabbitPosition.x - rabbitSize/2, rabbitPosition.y - rabbitSize/2, rabbitSize, rabbitSize);
    } else {
      // Fallback nếu ảnh chưa load
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(rabbitPosition.x, rabbitPosition.y, rabbitSize/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🐰', rabbitPosition.x, rabbitPosition.y + 5);
    }

  }, [path, rabbitPosition, houses, rabbitImage, houseImage, backgroundImage]);

  const handleMouseDown = (e) => {
    if (isAnswered || isMoving) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Kiểm tra nếu bắt đầu từ con thỏ
    const distance = Math.sqrt((x - rabbitPosition.x) ** 2 + (y - rabbitPosition.y) ** 2);
    if (distance <= rabbitSize / 2) {
      setIsDrawing(true);
      setPath([{ x: rabbitPosition.x, y: rabbitPosition.y }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || isAnswered || isMoving) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPath(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || isAnswered || isMoving) return;
    setIsDrawing(false);
    
    if (path.length > 10) { // Đảm bảo đường đủ dài
      moveRabbitAlongPath();
    } else {
      setPath([]);
    }
  };

  const moveRabbitAlongPath = () => {
    setIsMoving(true);
    let currentIndex = 0;
    const totalPoints = path.length;

    const move = () => {
      if (currentIndex < totalPoints) {
        setRabbitPosition(path[currentIndex]);
        currentIndex++;
        
        // Kiểm tra va chạm với các ngôi nhà
        const currentPos = path[currentIndex];
        if (currentPos) {
          const currentHouse = houses.find(house => {
            const distance = Math.sqrt(
              (currentPos.x - house.x) ** 2 + 
              (currentPos.y - house.y) ** 2
            );
            return distance < (rabbitSize/2 + houseSize/2);
          });

          if (currentHouse) {
            // Thỏ về nhà
            setRabbitPosition({ x: currentHouse.x, y: currentHouse.y });
            onAnswerSelected(currentHouse.answer.correct);
            cancelAnimationFrame(animationRef.current);
            setIsMoving(false);
            return;
          }
        }

        animationRef.current = requestAnimationFrame(move);
      } else {
        setIsMoving(false);
        setPath([]);
      }
    };

    animationRef.current = requestAnimationFrame(move);
  };

  const resetGame = () => {
    setPath([]);
    setRabbitPosition({ x: 200, y: 400 });
    setIsMoving(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          style={{
            borderRadius: '8px',
            cursor: isDrawing ? 'crosshair' : 'pointer'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {isAnswered && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {isCorrect ? '🎉 Chính xác! +1 điểm' : '❌ Sai rồi!'}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <button 
          onClick={resetGame}
          disabled={isMoving || isAnswered}
          style={{
            padding: '8px 16px',
            background: '#41d0f8ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isMoving || isAnswered ? 'not-allowed' : 'pointer'
          }}
        >
          Vẽ Lại Đường
        </button>
        
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          📝 Hướng dẫn: Vẽ đường từ con thỏ đến một trong các ngôi nhà chứa đáp án đúng
        </div>
      </div>
    </div>
  );
}