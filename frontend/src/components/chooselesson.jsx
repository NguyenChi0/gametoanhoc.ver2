// src/components/chooselesson.jsx
import React, { useState, useEffect } from "react";
import { getGrades, getTypes, getOperations, getQuestions } from "../api";

export default function ChooseLessonTree({ onStartGame }) {
  const [grades, setGrades] = useState([]);
  const [expandedGrades, setExpandedGrades] = useState({});
  const [expandedTypes, setExpandedTypes] = useState({});
  const [expandedOperations, setExpandedOperations] = useState({});
  const [cache, setCache] = useState({ types: {}, operations: {}, questions: {} });
  const [selectedGameInterface, setSelectedGameInterface] = useState("game1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gameOptions = [
    { id: "game1", label: "Ai là triệu phú" },
    { id: "game2", label: "Diệt ruồi" },
    { id: "game3", label: "Phi tiêu" },
    { id: "game4", label: "Vượt chướng ngại vật" },
    { id: "game5", label: "Tìm người nói thật" },
    { id: "game6", label: "Chém hoa quả" },
    { id: "game7", label: "Nhà thám hiểm tài ba" },
    { id: "game8", label: "Làm bài giúp Nobita" },
    { id: "game9", label: "Dẫn thỏ về hang" },
    { id: "game10", label: "Test" },
  ];

  useEffect(() => {
    getGrades()
      .then(setGrades)
      .catch((err) => setError(err.message));
  }, []);

  const toggleGrade = async (gradeId) => {
    setExpandedGrades((prev) => ({ ...prev, [gradeId]: !prev[gradeId] }));
    if (!cache.types[gradeId]) {
      const types = await getTypes(gradeId);
      setCache((prev) => ({ ...prev, types: { ...prev.types, [gradeId]: types } }));
    }
  };

  const toggleType = async (typeId, gradeId) => {
    setExpandedTypes((prev) => ({ ...prev, [typeId]: !prev[typeId] }));
    if (!cache.operations[typeId]) {
      const operations = await getOperations(typeId);
      setCache((prev) => ({ ...prev, operations: { ...prev.operations, [typeId]: operations } }));
    }
  };

  const toggleOperation = async (operationId, typeId, gradeId) => {
    setExpandedOperations((prev) => ({
      ...prev,
      [operationId]: !prev[operationId],
    }));

    if (!cache.questions[operationId]) {
      setLoading(true);
      try {
        const res = await getQuestions({
          grade_id: gradeId,
          type_id: typeId,
          operation_id: operationId,
        });
        setCache((prev) => ({
          ...prev,
          questions: { ...prev.questions, [operationId]: res.data || res },
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartGame = (grade, type, operation, questions) => {
    const rawUser = localStorage.getItem("user");
    const currentUser = rawUser ? JSON.parse(rawUser) : null;

    onStartGame(selectedGameInterface, {
      grade: { id: grade },
      type: { id: type },
      operation: { id: operation },
      questions,
      user: currentUser,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>📚 Chọn bài học</h2>

      {error && (
        <div style={{ color: "red" }}>
          Lỗi: {error}
          <button onClick={() => setError(null)}>OK</button>
        </div>
      )}
      {loading && <div>Đang tải dữ liệu...</div>}

      {/* Chọn giao diện game */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: "bold" }}>🎮 Chọn giao diện game:</label>
        <select
          value={selectedGameInterface}
          onChange={(e) => setSelectedGameInterface(e.target.value)}
          style={{
            marginLeft: 8,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        >
          {gameOptions.map((game) => (
            <option key={game.id} value={game.id}>
              {game.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cấu trúc cây */}
<div>
  {grades.map((g) => (
    <div key={g.id} style={{ marginBottom: 12 }}>
      <div
        style={{
          cursor: "pointer",
          fontWeight: "bold",
          background: "#f0f0f0",
          padding: "8px 12px",
          borderRadius: 6,
        }}
        onClick={() => toggleGrade(g.id)}
      >
        📁 {g.name}
      </div>

      {expandedGrades[g.id] &&
        cache.types[g.id]?.map((t) => (
          <div key={t.id} style={{ marginLeft: 20 }}>
            <div
              style={{
                cursor: "pointer",
                background: "#fafafa",
                padding: "6px 10px",
                borderRadius: 4,
                marginTop: 6,
              }}
              onClick={() => toggleType(t.id, g.id)}
            >
              📗 {t.name}
            </div>

            {expandedTypes[t.id] &&
              cache.operations[t.id]?.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginLeft: "30px",
                    marginTop: "6px",
                  }}
                >
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleOperation(o.id, t.id, g.id)}
                  >
                    🧮 {o.name}
                  </span>

                  <button
                    onClick={async () => {
                      let questions = cache.questions[o.id];
                      if (!questions) {
                        setLoading(true);
                        try {
                          const res = await getQuestions({
                            grade_id: g.id,
                            type_id: t.id,
                            operation_id: o.id,
                          });
                          questions = res.data || res;
                          setCache((prev) => ({
                            ...prev,
                            questions: { ...prev.questions, [o.id]: questions },
                          }));
                        } catch (err) {
                          setError(err.message);
                        } finally {
                          setLoading(false);
                        }
                      }
                      handleStartGame(g.id, t.id, o.id, questions);
                    }}
                    style={{
                      background: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    ▶ Chơi
                  </button>
                </div>
              ))}
          </div>
        ))}
    </div>
  ))}
</div>

   

    </div>
  );
}
