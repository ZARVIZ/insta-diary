import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";

function App() {
  const editorRef = useRef(null);
  const pageRefs = useRef([]);

  const [theme, setTheme] = useState("dark");
  const [pages, setPages] = useState([""]);
  const [neonMode, setNeonMode] = useState("white");
  const [darkFont, setDarkFont] = useState("Consolas, monospace");

  // Diary upgrades
  const [diaryInk, setDiaryInk] = useState("#2b1e14");
  const [diaryFont, setDiaryFont] = useState("'Dancing Script', cursive");

const [formatState, setFormatState] = useState({
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  align: "left"
});

const toggleDoubleStrike = () => {
  document.execCommand("strikeThrough", false, null);

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const parent = selection.anchorNode?.parentElement;
  if (!parent) return;

  parent.style.textDecorationStyle = "double";
};

  const PAGE_HEIGHT = 520;

  const themes = {
    dark: {
      outer: "#000",
      page: "radial-gradient(circle at center,#111 0%,#000 70%)",
      fontSize: 24,
      lineHeight: 38,
      neon: {
        white: "#ffffff",
        green: "#00ff88",
        blue: "#00eaff",
        red: "#ff0033",
        pink: "#ff00cc",
        orange: "#ff6600",
        purple: "#bb00ff"
      }
    },

    diary: {
      outer: "#d8cbb4",
      fontSize: 26,
      lineHeight: 44
    },

    scroll: {
      outer: "#c2a878",
      page: "linear-gradient(135deg,#f5deb3,#d2b48c)",
      font: "Georgia, serif",
      fontSize: 24,
      lineHeight: 40,
      color: "#3b2f2f"
    },

    love: {
      outer: "#ffe6ec",
      page: "#fff0f5",
      font: "'Dancing Script', cursive",
      fontSize: 26,
      lineHeight: 42,
      color: "#b3003c"
    }
  };

  /* ---------- FORMAT BUTTON STATE ---------- */

  const updateButtonStates = () => {
  setFormatState(prev => ({
    ...prev,
    bold: document.queryCommandState("bold"),
    italic: document.queryCommandState("italic"),
    underline: document.queryCommandState("underline"),
    strike: document.queryCommandState("strikeThrough")
  }));
};

  useEffect(() => {
    document.addEventListener("selectionchange", updateButtonStates);
    return () =>
      document.removeEventListener("selectionchange", updateButtonStates);
  }, []);

  const toggleFormat = (type, command) => {
    document.execCommand(command, false, null);
    updateButtonStates();
  };
const setAlignment = (command, value) => {
  document.execCommand(command, false, null);

  setFormatState(prev => ({
    ...prev,
    align: value
  }));
};
  /* ---------- PAGE SPLIT ---------- */

  const splitIntoPages = () => {
    const html = editorRef.current?.innerHTML || "";
    const temp = document.createElement("div");

    temp.style.position = "absolute";
    temp.style.visibility = "hidden";
    temp.style.width = "450px";
    temp.style.fontSize = themes[theme].fontSize + "px";
    temp.style.lineHeight = themes[theme].lineHeight + "px";
    temp.style.fontFamily =
      theme === "dark"
        ? darkFont
        : theme === "diary"
        ? diaryFont
        : themes[theme].font;

    temp.innerHTML = html;
    document.body.appendChild(temp);

    let result = [];
    let working = html;

    while (true) {
      temp.innerHTML = working;

      if (temp.scrollHeight <= PAGE_HEIGHT) {
        result.push(working);
        break;
      }

      let cut = working.length - 1;

      while (cut > 0) {
        temp.innerHTML = working.slice(0, cut) + "...";
        if (temp.scrollHeight <= PAGE_HEIGHT) break;
        cut--;
      }

      result.push(working.slice(0, cut) + "...");
      working = "..." + working.slice(cut);
    }

    document.body.removeChild(temp);
    setPages(result);
  };

  useEffect(() => {
    splitIntoPages();
  }, [theme]);

  const handleInput = () => splitIntoPages();

  /* ---------- EXPORT ---------- */

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-GB");
  const formattedTime = now.toLocaleTimeString();

 const exportAll = async () => {

  const now = new Date();
  const date = now.toLocaleDateString("en-GB").replace(/\//g, "-");
  const time = now.toLocaleTimeString().replace(/:/g, "-");

  // SINGLE PAGE
  if (pageRefs.current.length === 1) {

    const canvas = await html2canvas(pageRefs.current[0], {
      scale: 3,
      useCORS: true
    });

    const link = document.createElement("a");

    link.download = `${theme}-${date}-${time}.png`;
    link.href = canvas.toDataURL("image/png");

    link.click();

    return;
  }

  // MULTIPLE PAGES → ZIP
  const zip = new JSZip();

  for (let i = 0; i < pageRefs.current.length; i++) {

    const canvas = await html2canvas(pageRefs.current[i], {
      scale: 3,
      useCORS: true
    });

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve)
    );

    const fileName = `${theme}-${date}-${time}-page-${i + 1}.png`;

    zip.file(fileName, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  saveAs(zipBlob, `insta-diary-${date}-${time}.zip`);
};
  /* ---------- COLORS ---------- */

  const textColor =
    theme === "dark"
      ? themes.dark.neon[neonMode]
      : theme === "diary"
      ? diaryInk
      : themes[theme].color;

  const glow =
    theme === "dark"
      ? `0 0 6px ${textColor}, 0 0 14px ${textColor}`
      : "none";

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Diary Creator</h2>

      <div style={{ marginBottom: 15 }}>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="dark">Dark</option>
          <option value="diary">Diary</option>
          <option value="scroll">Old Scroll</option>
          <option value="love">Love</option>
        </select>

        {/* DARK OPTIONS */}
        {theme === "dark" && (
          <>
            <select
              value={neonMode}
              onChange={(e) => setNeonMode(e.target.value)}
              style={{ marginLeft: 10 }}
            >
              {Object.keys(themes.dark.neon).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={darkFont}
              onChange={(e) => setDarkFont(e.target.value)}
              style={{ marginLeft: 10 }}
            >
              <option value="Consolas, monospace">Consolas</option>
              <option value="'JetBrains Mono', monospace">JetBrains</option>
              <option value="'Fira Code', monospace">Fira Code</option>
              <option value="'Orbitron', sans-serif">Orbitron</option>
              <option value="'Share Tech Mono', monospace">Share Tech</option>
            </select>
          </>
        )}

        {/* DIARY OPTIONS */}
        {theme === "diary" && (
          <>
            <select
              value={diaryInk}
              onChange={(e) => setDiaryInk(e.target.value)}
              style={{ marginLeft: 10 }}
            >
              <option value="#000000">Black</option>
              <option value="#8b0000">Red</option>
              <option value="#0033cc">Blue</option>
              <option value="#006400">Green</option>
            </select>

            <select
              value={diaryFont}
              onChange={(e) => setDiaryFont(e.target.value)}
              style={{ marginLeft: 10 }}
            >
              <option value="'Dancing Script', cursive">Dancing Script</option>
              <option value="'Great Vibes', cursive">Great Vibes</option>
              <option value="'Satisfy', cursive">Satisfy</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Cinzel', serif">Cinzel</option>
              <option value="'Noto Sans Devanagari', sans-serif">Noto Sans</option>
              <option value="'Tiro Devanagari Hindi', serif">Tiro Devanagari</option>
              <option value="'Kalam', cursive">Kalam</option>
            </select>
          </>
        )}

        {/* FORMAT BUTTONS */}
        {["bold","italic","underline","strike"].map((type,i)=>(
          <button
            key={i}
            onClick={() =>
              toggleFormat(type, type==="strike"?"strikeThrough":type)
            }
            style={{
              marginLeft:5,
              padding:"6px 10px",
              background: formatState[type] ? "#00ff88" : "#222",
              color: formatState[type] ? "#000" : "#fff",
              border:"1px solid #555",
              borderRadius:5
            }}
          >
            {type[0].toUpperCase()}
          </button>
        ))}
        <button
  onClick={toggleDoubleStrike}
  style={{
    marginLeft:5,
    padding:"6px 10px",
    background:"#222",
    color:"#fff",
    border:"1px solid #555",
    borderRadius:5
  }}
>
  DS
</button>

<button
  onClick={() => setAlignment("justifyLeft","left")}
  style={{
    marginLeft:5,
    padding:"6px 10px",
    background: formatState.align==="left" ? "#00ff88" : "#222",
    color:"#fff",
    border:"1px solid #555",
    borderRadius:5
  }}
>
  L
</button>

<button
  onClick={() => setAlignment("justifyCenter","center")}
  style={{
    marginLeft:5,
    padding:"6px 10px",
    background: formatState.align==="center" ? "#00ff88" : "#222",
    color:"#fff",
    border:"1px solid #555",
    borderRadius:5
  }}
>
  C
</button>

<button
  onClick={() => setAlignment("justifyRight","right")}
  style={{
    marginLeft:5,
    padding:"6px 10px",
    background: formatState.align==="right" ? "#00ff88" : "#222",
    color:"#fff",
    border:"1px solid #555",
    borderRadius:5
  }}
>
  R
</button>

        <button onClick={exportAll} style={{ marginLeft: 10 }}>
          Download
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        style={{
          border: "1px solid #aaa",
          padding: 15,
          minHeight: 120,
          marginBottom: 20
        }}
      />

      {pages.map((p, i) => (
        <div
          key={i}
          ref={(el) => (pageRefs.current[i] = el)}
          style={{
            marginTop: 30,
            width: 540,
            height: 675,
            borderRadius: 20,
            background: themes[theme].outer,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <div
            style={{
              width: "85%",
              height: "85%",
              padding: 40,
              fontFamily:
                theme === "dark"
                  ? darkFont
                  : theme === "diary"
                  ? diaryFont
                  : themes[theme].font,
              fontSize: themes[theme].fontSize,
              lineHeight: themes[theme].lineHeight + "px",
              color: textColor,
              overflow: "hidden",
              position: "relative",
              textShadow: glow,

              background:
                theme === "diary"
                  ? undefined
                  : themes[theme].page,

              backgroundColor:
  theme === "diary" ? "#d8ccb2" : undefined,

backgroundImage:
  theme === "diary"
    ? "linear-gradient(#3b2a1a 2px, transparent 2px)"
    : undefined,

backgroundSize:
  theme === "diary" ? "100% 44px" : undefined,

            }}
            
          >
            {theme === "love" && (
            <>
              {Array.from({ length: 25 }).map((_, i) => {
                const size = Math.floor(Math.random() * 40) + 20; // 20px–60px
                const top = Math.random() * 100;
                const left = Math.random() * 100;
                const opacity = Math.random() * 0.15 + 0.05;

                return (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      top: `${top}%`,
                      left: `${left}%`,
                      fontSize: `${size}px`,
                      opacity: opacity,
                      pointerEvents: "none",
                      userSelect: "none"
                    }}
                  >
                    {["💗","💖","💘","💞","💕"][Math.floor(Math.random()*5)]}
                  </span>
                );
              })}
            </>
          )}
            <div style={{ position: "absolute", top: 4, left: 20, fontSize: 14 }}>
              {formattedTime}
            </div>
            <div style={{ position: "absolute", top: 4, right: 20, fontSize: 14 }}>
              {formattedDate}
            </div>

            <div dangerouslySetInnerHTML={{ __html: p }} />

            {pages.length > 1 && (
              <div style={{ position: "absolute", bottom: 10, right: 20, fontSize: 14 }}>
                {i + 1} / {pages.length}
              </div>
            )}
            <div
  style={{
    position: "absolute",
    bottom: 12,
    left: 20,
    fontSize: 12,
    opacity: 0.35,
    letterSpacing: "1px",
    fontFamily:
      theme === "dark"
        ? darkFont
        : theme === "diary"
        ? diaryFont
        : themes[theme].font,
    color: textColor,
    pointerEvents: "none",
    userSelect: "none"
  }}
>
  @DailyDiary.exe
</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;