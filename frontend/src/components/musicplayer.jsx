import React, { useEffect, useState, useRef } from "react";

export default function MusicPlayer() {
  const [musicList, setMusicList] = useState([]);
  const [current, setCurrent] = useState(null);
  const audioRef = useRef(null);

  // Lấy danh sách nhạc
  useEffect(() => {
    fetch("http://localhost:5000/api/music")
      .then((res) => res.json())
      .then((data) => setMusicList(data))
      .catch((err) => console.error("Lỗi lấy danh sách nhạc:", err));
  }, []);

  // Chọn bài và phát
  const handleSelect = (music) => {
    setCurrent(music);
    if (audioRef.current) {
      audioRef.current.src = `http://localhost:3000${music.link}`;
      audioRef.current.play();
    }
  };

  // Auto phát lại khi kết thúc
  const handleEnded = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play(); // phát lại cùng bài
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Dropdown chọn nhạc */}
      <select
        onChange={(e) =>
          handleSelect(musicList.find((m) => m.id === Number(e.target.value)))
        }
        value={current?.id || ""}
        style={{
          padding: "4px 2px",
          borderRadius: 4,
          border: "1px solid #ccc",
          background: "#fff",
        }}
      >
        <option value="">🎶</option>
        {musicList.map((music) => (
          <option key={music.id} value={music.id}>
            {music.name}
          </option>
        ))}
      </select>

      {/* Audio player nhỏ */}
      <audio
        ref={audioRef}
        controls
        onEnded={handleEnded} // 👈 thêm dòng này
        style={{ height: 30, width: 100 }}
      ></audio>
    </div>
  );
}
