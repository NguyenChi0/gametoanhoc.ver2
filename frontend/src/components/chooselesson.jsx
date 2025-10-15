// src/components/ChooseLesson.jsx
import React, { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const SESSION_KEY = "game_play_state_v1";

export default function ChooseLesson({ onStartGame }) {
  const [grades, setGrades] = useState([]);
  const [types, setTypes] = useState([]);
  const [operations, setOperations] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("");
  const [selectedGameInterface, setSelectedGameInterface] = useState("game1");

  const [loading, setLoading] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingOps, setLoadingOps] = useState(false);
  const [error, setError] = useState(null);

  // --- FETCH DỮ LIỆU ---
  useEffect(() => {
    let mounted = true;
    setLoadingGrades(true);
    fetch(`${API_BASE}/api/grades`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setGrades(data);
        setLoadingGrades(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setLoadingGrades(false);
      });
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    if (!selectedGrade) {
      setTypes([]);
      setOperations([]);
      setQuestions([]);
      return;
    }
    let mounted = true;
    setLoadingTypes(true);
    fetch(`${API_BASE}/api/types/${selectedGrade}`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setTypes(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingTypes(false));
    return () => (mounted = false);
  }, [selectedGrade]);

  useEffect(() => {
    if (!selectedType) {
      setOperations([]);
      setQuestions([]);
      return;
    }
    let mounted = true;
    setLoadingOps(true);
    fetch(`${API_BASE}/api/operations/${selectedType}`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setOperations(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOps(false));
    return () => (mounted = false);
  }, [selectedType]);

  useEffect(() => {
    if (!selectedOperation) {
      setQuestions([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    const url = new URL(`${API_BASE}/api/questions`);
    url.searchParams.append("operation_id", selectedOperation);
    if (selectedGrade) url.searchParams.append("grade_id", selectedGrade);
    if (selectedType) url.searchParams.append("type_id", selectedType);
    fetch(url.toString())
      .then((r) => r.json())
      .then((payload) => {
        if (!mounted) return;
        setQuestions(payload.data || payload);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, [selectedOperation]);

  // --- HÀM BẮT ĐẦU CHƠI ---
  async function handleStart() {
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
  }

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
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="">-- Chọn lớp --</option>
            {loadingGrades ? <option>Đang tải...</option> : grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Chọn dạng bài</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} disabled={!selectedGrade || loadingTypes} style={{ width: "100%", padding: 8 }}>
            <option value="">-- Chọn dạng bài --</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Chọn phép toán</label>
          <select value={selectedOperation} onChange={(e) => setSelectedOperation(e.target.value)} disabled={!selectedType || loadingOps} style={{ width: "100%", padding: 8 }}>
            <option value="">-- Chọn phép toán --</option>
            {operations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <label>Chọn giao diện game</label>
          <select value={selectedGameInterface} onChange={(e) => setSelectedGameInterface(e.target.value)} style={{ width: "100%", padding: 8 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={`game${i + 1}`}>
                Game {i + 1} (giao diện {i + 1})
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
