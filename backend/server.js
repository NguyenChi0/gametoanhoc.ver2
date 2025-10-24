// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const pool = require('./db'); // Import cấu hình database
const path = require('path');


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());// serve file nhạc tĩnh (ví dụ public/music/nhac1.mp3)
app.use('/music', express.static(path.join(__dirname, 'public', 'music')));


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
    const { grade_id, type_id, operation_id, limit = 200, offset = 0, random = '0' } = req.query;

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

    // Tăng cả score và week_score cùng lúc (nếu week_score là NULL thì set về 0 trước khi cộng)
    await pool.query(
      'UPDATE users SET score = score + ?, week_score = COALESCE(week_score, 0) + ? WHERE id = ?',
      [delta, delta, userId]
    );

    // Lấy lại score & week_score hiện tại
    const [rows] = await pool.query('SELECT score, week_score FROM users WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      score: rows[0].score,
      week_score: rows[0].week_score,
    });
  } catch (err) {
    console.error('Error /api/score/increment', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ==========================
//  API: LẤY THÔNG TIN NGƯỜI DÙNG
// ==========================
app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Lấy thông tin người dùng
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    let user = rows[0];

    // --- 1) Tính thứ hạng tuần (week rank) ---
    const userWeekScore = Number(user.week_score) || 0;
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM users WHERE week_score > ?',
      [userWeekScore]
    );
    const rank = (countRows[0] && Number(countRows[0].cnt) !== NaN)
      ? (Number(countRows[0].cnt) + 1)
      : null;

    // --- 2) Cập nhật achievements nếu cần ---
    let newAchievementId = null;
    if (rank && userWeekScore > 0 && rank >= 1 && rank <= 5) {
      newAchievementId = rank; // map top1..5
    }
    const currentAchievement = user.achievements;
    if (newAchievementId !== null && newAchievementId !== currentAchievement) {
      await pool.execute('UPDATE users SET achievements = ? WHERE id = ?', [newAchievementId, user.id]);
      user.achievements = newAchievementId;
    }

    // --- 3) Lấy chi tiết achievement ---
    let achievement = null;
    if (user.achievements) {
      const [achRows] = await pool.execute(
        'SELECT id, name, description, link FROM achievements WHERE id = ?',
        [user.achievements]
      );
      achievement = achRows[0] || null;
    }
    user.achievement = achievement;

    // --- 4) Lấy danh sách vật phẩm đã mua ---
    const [itemRows] = await pool.execute(
      `SELECT i.id, i.name, i.description, i.link, i.require_score, ui.purchased_at
       FROM user_items ui
       JOIN items i ON ui.item_id = i.id
       WHERE ui.user_id = ?`,
      [user.id]
    );
    user.itemsOwned = itemRows; // thêm mảng items vào user object

    // --- 5) Trả về kết quả ---
    user.week_rank = rank;
    return res.json(user);

  } catch (err) {
    console.error('Lỗi khi lấy user:', err);
    return res.status(500).json({ message: 'Lỗi server khi lấy thông tin người dùng' });
  }
});


// ==========================
// API: LEADERBOARD
// ==========================
app.get("/api/leaderboard/all", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT username, fullname, score FROM users ORDER BY score DESC LIMIT 10"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi leaderboard all:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/api/leaderboard/week", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT username, fullname, week_score FROM users ORDER BY week_score DESC LIMIT 10"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi leaderboard week:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});


// GET /api/items
app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/buy
app.post('/api/buy', async (req, res) => {
  const { userId, itemId } = req.body;

  try {
    // Lấy thông tin vật phẩm
    const [itemRows] = await pool.query('SELECT require_score FROM items WHERE id = ?', [itemId]);
    if (itemRows.length === 0) return res.status(404).json({ error: 'Item not found' });

    const requireScore = itemRows[0].require_score;

    // Lấy điểm hiện tại của user
    const [userRows] = await pool.query('SELECT score FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

    const currentScore = userRows[0].score;

    if (currentScore < requireScore) {
      return res.status(400).json({ error: 'Không đủ điểm để mua vật phẩm này' });
    }

    // Trừ điểm
    await pool.query('UPDATE users SET score = score - ? WHERE id = ?', [requireScore, userId]);

    // Ghi vào bảng user_items
    await pool.query('INSERT INTO user_items (user_id, item_id) VALUES (?, ?)', [userId, itemId]);

    res.json({ success: true, message: 'Mua vật phẩm thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/my-items/:userId
app.get('/api/my-items/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT items.* FROM items
       JOIN user_items ON items.id = user_items.item_id
       WHERE user_items.user_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================
//  API: LẤY DANH SÁCH NHẠC
// ==========================
app.get('/api/music', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, link FROM music ORDER BY id ASC');
    // Nếu link trong DB dạng '/music/nhac1.mp3' thì client có thể dùng trực tiếp
    res.json(rows);
  } catch (err) {
    console.error('Error fetching music list:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhạc' });
  }
});

// ==========================
//  API: LẤY CHI TIẾT MỘT ĐOẠN NHẠC
// ==========================
app.get('/api/music/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT id, name, link FROM music WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy nhạc' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching music by id:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});



// ==========================
//  KHỞI ĐỘNG SERVER
// ==========================
const PORT = process.env.PORT || 5050;
const HOST = '0.0.0.0'; // Cho phép truy cập từ mọi địa chỉ IP (LAN, Internet)

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server đang chạy tại http://${HOST}:${PORT}`);
});
