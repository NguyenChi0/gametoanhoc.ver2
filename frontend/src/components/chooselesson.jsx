// src/components/ChooseLesson.jsx
import React, { useState, useEffect } from "react";
import {
  getGrades,
  getTypes,
  getOperations,
  getQuestions,
} from "../api"; // 👈 import file api.js

export default function ChooseLesson({ onStartGame }) {
  const [grades, setGrades] = useState([]);
  const [types, setTypes] = useState([]);
  const [operations, setOperations] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("");
  const [selectedGameInterface, setSelectedGameInterface] = useState("game1");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- LẤY DANH SÁCH LỚP ---
  useEffect(() => {
    getGrades()
      .then(setGrades)
      .catch((err) => setError(err.message));
  }, []);

  // --- LẤY DẠNG BÀI ---
  useEffect(() => {
    if (!selectedGrade) {
      setTypes([]);
      setOperations([]);
      setQuestions([]);
      return;
    }
    getTypes(selectedGrade)
      .then(setTypes)
      .catch((err) => setError(err.message));
  }, [selectedGrade]);

  // --- LẤY PHÉP TOÁN ---
  useEffect(() => {
    if (!selectedType) {
      setOperations([]);
      setQuestions([]);
      return;
    }
    getOperations(selectedType)
      .then(setOperations)
      .catch((err) => setError(err.message));
  }, [selectedType]);

  // --- LẤY CÂU HỎI ---
  useEffect(() => {
    if (!selectedOperation) return;
    setLoading(true);
    getQuestions({
      grade_id: selectedGrade,
      type_id: selectedType,
      operation_id: selectedOperation,
    })
      .then((res) => setQuestions(res.data || res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedOperation]);

  // --- BẮT ĐẦU CHƠI ---
  const handleStart = () => {
    if (!selectedGrade || !selectedType || !selectedOperation) {
      setError("Vui lòng chọn đủ lớp → dạng bài → phép toán trước khi chơi.");
      return;
    }

    const rawUser = localStorage.getItem("user");
    const currentUser = rawUser ? JSON.parse(rawUser) : null;

    const payload = {
      grade: { id: selectedGrade },
      type: { id: selectedType },
      operation: { id: selectedOperation },
      questions,
      user: currentUser,
    };

    onStartGame(selectedGameInterface, payload);
  };

  // --- JSX ---
  return (
    <div style={{ marginBottom: 24 }}>
      {error && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          Lỗi: {error}{" "}
          <button onClick={() => setError(null)} style={{ marginLeft: 8 }}>
            OK
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <label>Chọn lớp</label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Chọn lớp --</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label>Chọn dạng bài</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={!selectedGrade}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Chọn dạng bài --</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label>Chọn phép toán</label>
          <select
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value)}
            disabled={!selectedType}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Chọn phép toán --</option>
            {operations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div style={{ flex: 1 }}>
          <label>Chọn giao diện game</label>
          <select
            value={selectedGameInterface}
            onChange={(e) => setSelectedGameInterface(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={`game${i + 1}`}>
                Game {i + 1}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleStart} style={{ padding: "10px 14px" }}>
          Bắt đầu chơi
        </button>
      </div>
    </div>
  );
}
