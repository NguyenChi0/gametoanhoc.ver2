// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const pool = require('./db'); // Import cấu hình database

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// ==========================
//  API: ĐĂNG KÝ
// ==========================
app.post('/api/register', async (req, res) => {
  const { username, password, fullname } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu username hoặc password' });
  }

  try {
    const hashed = bcrypt.hashSync(password, 8);
    const sql = 'INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)';
    const [result] = await pool.execute(sql, [username, hashed, fullname || null]);

    res.json({ message: 'Đăng ký thành công', userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username đã tồn tại' });
    }
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==========================
//  API: ĐĂNG NHẬP
// ==========================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu username hoặc password' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Sai username hoặc password' });
    }

    const user = rows[0];
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Sai username hoặc password' });
    }

    res.json({ message: 'Đăng nhập thành công', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Helper: build answers array from question row (DB columns: answercorrect_*, answer2_*, ...)
function buildAnswers(row) {
  const answers = [];

  if (row.answercorrect_text || row.answercorrect_image) {
    answers.push({
      id: 'correct',
      text: row.answercorrect_text || null,
      image: row.answercorrect_image || null,
      correct: true
    });
  }

  if (row.answer2_text || row.answer2_image) {
    answers.push({ id: 'a2', text: row.answer2_text || null, image: row.answer2_image || null, correct: false });
  }
  if (row.answer3_text || row.answer3_image) {
    answers.push({ id: 'a3', text: row.answer3_text || null, image: row.answer3_image || null, correct: false });
  }
  if (row.answer4_text || row.answer4_image) {
    answers.push({ id: 'a4', text: row.answer4_text || null, image: row.answer4_image || null, correct: false });
  }

  return answers;
}


// ====== Endpoints ======

// 1) Lấy danh sách lớp (grades)
app.get('/api/grades', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM grades ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy grades', error: err.message });
  }
});

// 2) Lấy danh sách types theo grade_id
app.get('/api/types/:grade_id', async (req, res) => {
  const grade_id = Number(req.params.grade_id);
  if (!grade_id) return res.status(400).json({ message: 'grade_id không hợp lệ' });

  try {
    const [rows] = await pool.query(
      'SELECT id, grade_id, name, description FROM types WHERE grade_id = ? ORDER BY id',
      [grade_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy types', error: err.message });
  }
});

// 3) Lấy danh sách operations theo type_id
app.get('/api/operations/:type_id', async (req, res) => {
  const type_id = Number(req.params.type_id);
  if (!type_id) return res.status(400).json({ message: 'type_id không hợp lệ' });

  try {
    const [rows] = await pool.query(
      'SELECT id, type_id, name FROM operations WHERE type_id = ? ORDER BY id',
      [type_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy operations', error: err.message });
  }
});

// 4) Lấy câu hỏi theo bộ lọc: grade_id, type_id, operation_id
//    - Frontend có thể gọi /api/questions?grade_id=1&type_id=1&operation_id=1
//    - operation_id đủ để lấy đúng nhóm phép toán; nhưng endpoint hỗ trợ mọi kết hợp
app.get('/api/questions', async (req, res) => {
  try {
    const { grade_id, type_id, operation_id, limit = 100, offset = 0, random = '0' } = req.query;

    const where = [];
    const params = [];

    if (grade_id) {
      where.push('q.grade_id = ?');
      params.push(Number(grade_id));
    }
    if (type_id) {
      where.push('q.type_id = ?');
      params.push(Number(type_id));
    }
    if (operation_id) {
      where.push('q.operation_id = ?');
      params.push(Number(operation_id));
    }

    let sql = `
  SELECT q.id, q.grade_id, q.type_id, q.operation_id,
         q.question_text, q.question_image,
         q.answercorrect_text, q.answer2_text, q.answer3_text, q.answer4_text,
         q.answercorrect_image, q.answer2_image, q.answer3_image, q.answer4_image
  FROM questions q
`;

    if (where.length) sql += ' WHERE ' + where.join(' AND ');

    // random option
    if (random === '1') {
      sql += ' ORDER BY RAND()';
    } else {
      sql += ' ORDER BY q.id';
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit));
    params.push(Number(offset));

    const [rows] = await pool.query(sql, params);

    // map answers to array for easier frontend use
    const mapped = rows.map(r => ({
      id: r.id,
      grade_id: r.grade_id,
      type_id: r.type_id,
      operation_id: r.operation_id,
      question_text: r.question_text,
      question_image: r.question_image,
      answers: buildAnswers(r)
    }));

    res.json({ count: mapped.length, data: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy questions', error: err.message });
  }
});

// 5) Lấy một câu hỏi chi tiết theo id
app.get('/api/questions/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'id không hợp lệ' });

  try {
    const [rows] = await pool.query(
      `SELECT * FROM questions WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy question' });

    const r = rows[0];
    res.json({
      id: r.id,
      grade_id: r.grade_id,
      type_id: r.type_id,
      operation_id: r.operation_id,
      question_text: r.question_text,
      question_image: r.question_image,
      answers: buildAnswers(r)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy question theo id', error: err.message });
  }
});



//=========Lưu điểm=========================
app.post('/api/score/increment', async (req, res) => {
  try {
    const { userId, delta = 1 } = req.body;
    if (!userId || typeof userId !== 'number') {
      return res.status(400).json({ success: false, message: 'userId (number) required' });
    }

    // UPDATE atomic: tăng score
    await pool.query('UPDATE users SET score = score + ? WHERE id = ?', [delta, userId]);

    // Lấy lại score hiện tại
    const [rows] = await pool.query('SELECT score FROM users WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, score: rows[0].score });
  } catch (err) {
    console.error('Error /api/score/increment', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});






// ==========================
//  KHỞI ĐỘNG SERVER
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));
