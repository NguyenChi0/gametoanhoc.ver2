// home.js
import React, { useEffect, useState } from "react";

/**
 * Home component
 * - Fetch /api/grades on mount
 * - Khi chọn grade -> fetch /api/types/:grade_id
 * - Khi chọn type  -> fetch /api/operations/:type_id
 * - Khi chọn op    -> fetch /api/questions?grade_id=&type_id=&operation_id=
 *
 * Assumes backend API at http://localhost:5000
 */

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Home() {
  const [grades, setGrades] = useState([]);
  const [types, setTypes] = useState([]);
  const [operations, setOperations] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingOps, setLoadingOps] = useState(false);
  const [error, setError] = useState(null);

  // load grades on mount
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

  // when grade changes -> load types, reset downstream selections
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
        // reset downstream
        setSelectedType("");
        setOperations([]);
        setSelectedOperation("");
        setQuestions([]);
      });

    return () => (mounted = false);
  }, [selectedGrade]);

  // when type changes -> load operations
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

  // when operation changes -> load questions
  useEffect(() => {
    if (!selectedOperation) {
      setQuestions([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    // call questions endpoint; include grade & type for extra safety
    const url = new URL(`${API_BASE}/api/questions`);
    url.searchParams.append("operation_id", selectedOperation);
    if (selectedGrade) url.searchParams.append("grade_id", selectedGrade);
    if (selectedType) url.searchParams.append("type_id", selectedType);
    // optional: get random sample e.g. random=1
    // url.searchParams.append("random", "1");

    fetch(url.toString())
      .then((r) => {
        if (!r.ok) throw new Error("Lỗi khi lấy câu hỏi");
        return r.json();
      })
      .then((payload) => {
        if (!mounted) return;
        // payload expected: { count, data: [ {id, question_text, question_image, answers: [{text,image}, ...]} ] }
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

  // UI helpers
  function onSelectGrade(e) {
    setSelectedGrade(e.target.value || "");
  }
  function onSelectType(e) {
    setSelectedType(e.target.value || "");
  }
  function onSelectOperation(e) {
    setSelectedOperation(e.target.value || "");
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
              // reload grades as fallback
              setLoadingGrades(true);
              fetch(`${API_BASE}/api/grades`)
                .then((r) => r.json())
                .then((d) => setGrades(d))
                .catch((e) => setError(e.message))
                .finally(() => setLoadingGrades(false));
            }}
            style={{ marginLeft: 8 }}
          >
            Thử lại
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Chọn lớp</label>
          <select value={selectedGrade} onChange={onSelectGrade} style={{ width: "100%", padding: 8 }}>
            <option value="">-- Chọn lớp --</option>
            {loadingGrades ? (
              <option>Đang tải...</option>
            ) : (
              grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Chọn dạng bài</label>
          <select
            value={selectedType}
            onChange={onSelectType}
            disabled={!selectedGrade || loadingTypes}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Chọn dạng bài --</option>
            {loadingTypes ? (
              <option>Đang tải...</option>
            ) : (
              types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Chọn phép toán</label>
          <select
            value={selectedOperation}
            onChange={onSelectOperation}
            disabled={!selectedType || loadingOps}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">-- Chọn phép toán --</option>
            {loadingOps ? (
              <option>Đang tải...</option>
            ) : (
              operations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => {
            // manual reload questions (for example if user wants random)
            if (!selectedOperation) {
              setError("Chưa chọn phép toán");
              return;
            }
            // toggle random param by re-setting selectedOperation (simple way: append ?random=1)
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
        >
          Lấy câu hỏi (random)
        </button>
      </div>

      <section>
        <h3 style={{ marginBottom: 10 }}>
          Kết quả {loading ? "(Đang tải...)" : questions.length ? `(${questions.length})` : ""}
        </h3>

        {!selectedOperation && <div style={{ color: "#666" }}>Chọn đủ 3 bước để hiển thị câu hỏi.</div>}

        {questions.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {questions.map((q) => (
              <article
                key={q.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 12,
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  #{q.id} — {q.question_text}
                </div>

                {q.question_image && (
                  <div style={{ marginBottom: 8 }}>
                    <img src={q.question_image} alt="question" style={{ maxWidth: "100%", height: "auto" }} />
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Array.isArray(q.answers) && q.answers.length ? (
                    q.answers.map((a, idx) => (
                      <div
                        key={idx}
                        style={{
                          minWidth: 90,
                          padding: 8,
                          borderRadius: 6,
                          border: "1px solid #eee",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                        }}
                      >
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

        {!loading && selectedOperation && questions.length === 0 && (
          <div style={{ marginTop: 12, color: "#666" }}>Không tìm thấy câu hỏi cho lựa chọn này.</div>
        )}
      </section>
    </div>
  );
}
