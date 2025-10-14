import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const SESSION_KEY = "game_play_state_v1";

export default function Home() {
  const navigate = useNavigate();

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

  useEffect(() => {
    let mounted = true;
    setLoadingGrades(true);
    fetch(`${API_BASE}/api/grades`)
      .then((r) => {
        if (!r.ok) throw new Error("Không thể lấy grades");
        return r.json();
      })
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
      setSelectedType("");
      setOperations([]);
      setSelectedOperation("");
      setQuestions([]);
      return;
    }
    let mounted = true;
    setLoadingTypes(true);
    setError(null);
    fetch(`${API_BASE}/api/types/${selectedGrade}`)
      .then((r) => {
        if (!r.ok) throw new Error("Lỗi khi lấy dạng bài (types)");
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        setTypes(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setTypes([]);
      })
      .finally(() => {
        if (mounted) setLoadingTypes(false);
        setSelectedType("");
        setOperations([]);
        setSelectedOperation("");
        setQuestions([]);
      });
    return () => (mounted = false);
  }, [selectedGrade]);

  useEffect(() => {
    if (!selectedType) {
      setOperations([]);
      setSelectedOperation("");
      setQuestions([]);
      return;
    }
    let mounted = true;
    setLoadingOps(true);
    setError(null);
    fetch(`${API_BASE}/api/operations/${selectedType}`)
      .then((r) => {
        if (!r.ok) throw new Error("Lỗi khi lấy phép toán (operations)");
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        setOperations(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setOperations([]);
      })
      .finally(() => {
        if (mounted) setLoadingOps(false);
        setSelectedOperation("");
        setQuestions([]);
      });
    return () => (mounted = false);
  }, [selectedType]);

  useEffect(() => {
    if (!selectedOperation) {
      setQuestions([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);

    const url = new URL(`${API_BASE}/api/questions`);
    url.searchParams.append("operation_id", selectedOperation);
    if (selectedGrade) url.searchParams.append("grade_id", selectedGrade);
    if (selectedType) url.searchParams.append("type_id", selectedType);

    fetch(url.toString())
      .then((r) => {
        if (!r.ok) throw new Error("Lỗi khi lấy câu hỏi");
        return r.json();
      })
      .then((payload) => {
        if (!mounted) return;
        const data = payload.data || payload;
        setQuestions(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setQuestions([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => (mounted = false);
  }, [selectedOperation, selectedType, selectedGrade]);

  function onSelectGrade(e) {
    setSelectedGrade(e.target.value || "");
  }
  function onSelectType(e) {
    setSelectedType(e.target.value || "");
  }
  function onSelectOperation(e) {
    setSelectedOperation(e.target.value || "");
  }

  // Lưu trạng thái chơi vào sessionStorage (để GamePage fallback khi reload)
  function persistPlayState(gameId, payload) {
    try {
      const saved = {
        gameId,
        payload,
        ts: Date.now(),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));
    } catch (e) {
      console.warn("Không lưu được state chơi:", e);
    }
  }

  // Khi bấm bắt đầu chơi
  async function startGame() {
    setError(null);
    if (!selectedGrade || !selectedType || !selectedOperation) {
      setError("Vui lòng chọn đủ lớp → dạng bài → phép toán trước khi chơi.");
      return;
    }

    // nếu chưa có questions (ví dụ user muốn tải ngẫu nhiên trước chơi) thì fetch 1 lần nữa
    let qs = questions;
    if (!qs || qs.length === 0) {
      setLoading(true);
      try {
        const url = new URL(`${API_BASE}/api/questions`);
        url.searchParams.append("operation_id", selectedOperation);
        url.searchParams.append("grade_id", selectedGrade);
        url.searchParams.append("type_id", selectedType);
        // optional: random
        url.searchParams.append("random", "1");
        const r = await fetch(url.toString());
        if (!r.ok) throw new Error("Lỗi khi lấy câu hỏi (trước khi vào game)");
        const p = await r.json();
        qs = p.data || p;
        setQuestions(qs);
      } catch (e) {
        setError(e.message);
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    // LẤY user từ localStorage (nếu có)
const rawUser = localStorage.getItem("user");
const currentUser = rawUser ? JSON.parse(rawUser) : null;

const payload = {
  grade: { id: selectedGrade },
  type: { id: selectedType },
  operation: { id: selectedOperation },
  questions: qs,
  user: currentUser, // <-- truyền user vào GamePage
};


    // Lưu sessionStorage & navigate với state
    persistPlayState(selectedGameInterface, payload);
    navigate(`/game/${selectedGameInterface}`, { state: payload });
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Chọn lớp → dạng bài → phép toán</h2>

      {error && (
        <div style={{ marginBottom: 12, color: "crimson" }}>
          Lỗi: {error}{" "}
          <button
            onClick={() => {
              setError(null);
            }}
            style={{ marginLeft: 8 }}
          >
            OK
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Chọn lớp</label>
          <select value={selectedGrade} onChange={onSelectGrade} style={{ width: "100%", padding: 8 }}>
            <option value="">-- Chọn lớp --</option>
            {loadingGrades ? <option>Đang tải...</option> : grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Chọn dạng bài</label>
          <select value={selectedType} onChange={onSelectType} disabled={!selectedGrade || loadingTypes} style={{ width: "100%", padding: 8 }}>
            <option value="">-- Chọn dạng bài --</option>
            {loadingTypes ? <option>Đang tải...</option> : types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Chọn phép toán</label>
          <select value={selectedOperation} onChange={onSelectOperation} disabled={!selectedType || loadingOps} style={{ width: "100%", padding: 8 }}>
            <option value="">-- Chọn phép toán --</option>
            {loadingOps ? <option>Đang tải...</option> : operations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Chọn giao diện game</label>
          <select value={selectedGameInterface} onChange={(e) => setSelectedGameInterface(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="game1">Game 1 (giao diện 1)</option>
            <option value="game2">Game 2 (giao diện 2)</option>
            <option value="game3">Game 3 (giao diện 3)</option>
            <option value="game4">Game 4 (giao diện 4)</option>
            <option value="game5">Game 5 (giao diện 5)</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={startGame} style={{ padding: "10px 14px" }}>
            Bắt đầu chơi
          </button>
          <button
            onClick={() => {
              // tải lại questions random nhanh
              if (!selectedOperation) {
                setError("Chưa chọn phép toán");
                return;
              }
              setLoading(true);
              setError(null);
              const url = new URL(`${API_BASE}/api/questions`);
              url.searchParams.append("operation_id", selectedOperation);
              if (selectedGrade) url.searchParams.append("grade_id", selectedGrade);
              if (selectedType) url.searchParams.append("type_id", selectedType);
              url.searchParams.append("random", "1");
              fetch(url.toString())
                .then((r) => r.json())
                .then((p) => setQuestions(p.data || p))
                .catch((e) => setError(e.message))
                .finally(() => setLoading(false));
            }}
            style={{ padding: "10px 14px" }}
          >
            Lấy câu hỏi (random)
          </button>
        </div>
      </div>

      <section>
        <h3 style={{ marginBottom: 10 }}>
          Kết quả {loading ? "(Đang tải...)" : questions.length ? `(${questions.length})` : ""}
        </h3>

        {!selectedOperation && <div style={{ color: "#666" }}>Chọn đủ 3 bước để hiển thị câu hỏi.</div>}

        {questions.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {questions.map((q) => (
              <article key={q.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, background: "#fff" }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>#{q.id} — {q.question_text}</div>
                {q.question_image && <div style={{ marginBottom: 8 }}><img src={q.question_image} alt="q" style={{ maxWidth: "100%" }} /></div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Array.isArray(q.answers) && q.answers.length ? (
                    q.answers.map((a, idx) => (
                      <div key={idx} style={{ minWidth: 90, padding: 8, borderRadius: 6, border: "1px solid #eee" }}>
                        <div style={{ fontSize: 14 }}>{a.text || ""}</div>
                        {a.image && <img src={a.image} alt={`ans-${idx}`} style={{ maxWidth: 120, marginTop: 6 }} />}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#777" }}>Không có đáp án trong dữ liệu.</div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && selectedOperation && questions.length === 0 && <div style={{ marginTop: 12, color: "#666" }}>Không tìm thấy câu hỏi cho lựa chọn này.</div>}
      </section>
    </div>
  );
}
