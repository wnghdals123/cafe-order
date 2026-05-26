import { useEffect, useState, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, update, push, remove, set } from "firebase/database";
import "./Admin.css";
import QRCode from "qrcode";

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [editMenu, setEditMenu] = useState(null);
  const [newMenu, setNewMenu] = useState({ cat: "커피", name: "", desc: "", price: "", emoji: "☕", tags: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [editPriceError, setEditPriceError] = useState(false);
  const [tableCount, setTableCount] = useState(10);
  const [qrImages, setQrImages] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderCount = useRef(0);
  const [alarmSound, setAlarmSound] = useState(null);
  const alarmInputRef = useRef(null);

  useEffect(() => {
    const ordersRef = ref(db, "orders");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val })).reverse();
        setOrders(list);
      } else {
        setOrders([]);
      }
    });

    const menusRef = ref(db, "menus");
    onValue(menusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ firebaseId: id, ...val }));
        setMenus(list);
      } else {
        setMenus([]);
      }
    });
  }, []);

  useEffect(() => {
    if (orders.length > prevOrderCount.current && prevOrderCount.current !== 0) {
      if (soundEnabled) playAlarm();
    }
    prevOrderCount.current = orders.length;
  }, [orders]);

  const updateStatus = (id, status) => update(ref(db, `orders/${id}`), { status });

  const deleteMenu = (firebaseId) => {
    if (window.confirm("메뉴를 삭제할까요?")) {
      remove(ref(db, `menus/${firebaseId}`));
    }
  };

  const toggleSoldOut = (firebaseId, current) => {
    update(ref(db, `menus/${firebaseId}`), { soldOut: !current });
  };

  const generateQRCodes = async () => {
    const images = {};
    for (let i = 1; i <= tableCount; i++) {
      const url = `https://cafe-order-omega.vercel.app?table=${i}`;
      images[i] = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: "#3d2b1f", light: "#fdf6ee" },
      });
    }
    setQrImages(images);
  };

  const playAlarm = () => {
    try {
      const src = alarmSound || "/alarm.wav";
      const audio = new Audio(src);
      audio.volume = 1.0;
      audio.play().catch((e) => console.log("소리 재생 실패:", e));
    } catch (e) {
      console.log("소리 재생 실패:", e);
    }
  };

  const handleAlarmFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAlarmSound(url);
    const audio = new Audio(url);
    audio.volume = 1.0;
    audio.play().catch((e) => console.log("미리듣기 실패:", e));
  };

  const handleImageUpload = (e, firebaseId) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      update(ref(db, `menus/${firebaseId}`), { image: base64 })
        .then(() => console.log("이미지 저장 완료"))
        .catch((err) => console.log("이미지 저장 실패:", err));
    };
    reader.readAsDataURL(file);
  };

  const downloadQR = (tableNum) => {
    const link = document.createElement("a");
    link.download = `테이블${tableNum}_QR.png`;
    link.href = qrImages[tableNum];
    link.click();
  };

  const printAllQR = () => {
    const win = window.open("", "_blank");
    win.document.write(`
    <html><head><title>테이블 QR코드</title>
    <style>
      body { font-family: sans-serif; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
      .qr-item { text-align: center; border: 1px solid #e8d5be; border-radius: 12px; padding: 16px; }
      .qr-item img { width: 180px; height: 180px; }
      .qr-label { font-size: 16px; font-weight: 600; margin-top: 8px; color: #3d2b1f; }
      .qr-url { font-size: 10px; color: #a07850; margin-top: 4px; }
    </style></head><body>
    <div class="grid">
      ${Object.entries(qrImages).map(([num, src]) => `
        <div class="qr-item">
          <img src="${src}" />
          <div class="qr-label">테이블 ${num}</div>
          <div class="qr-url">cafe-order-omega.vercel.app?table=${num}</div>
        </div>
      `).join("")}
    </div>
    <script>window.onload = () => window.print();</script>
    </body></html>
  `);
    win.document.close();
  };

  const saveEditMenu = () => {
    const { firebaseId, ...data } = editMenu;
    data.price = Number(data.price);
    data.tags = typeof data.tags === "string" ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : data.tags;
    set(ref(db, `menus/${firebaseId}`), data);
    setEditMenu(null);
  };

  const addMenu = () => {
    if (!newMenu.name && !newMenu.price) return alert("메뉴 이름, 가격을 입력해주세요!");
    if (!newMenu.name) return alert("메뉴 이름을 입력해주세요!");
    if (!newMenu.price) return alert("가격을 입력해주세요!");
    const data = {
      ...newMenu,
      price: Number(newMenu.price),
      tags: newMenu.tags.split(",").map((t) => t.trim()).filter(Boolean),
      id: Date.now(),
    };
    push(ref(db, "menus"), data);
    setNewMenu({ cat: "커피", name: "", desc: "", price: "", emoji: "☕", tags: "" });
    setShowAddForm(false);
  };

  const waitingCount = orders.filter((o) => o.status === "대기중").length;
  const makingCount = orders.filter((o) => o.status === "제조중").length;
  const doneCount = orders.filter((o) => o.status === "완료").length;
  const todayTotal = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);

  return (
    <div className="admin">
      <div className="admin-header">
        <div>
          <div className="admin-title">☕ Warm Bean Café — 사장님 화면</div>
          <div className="admin-sub">주문이 들어오면 실시간으로 표시됩니다</div>
        </div>
        <div className="live-badge">
          <div className="live-dot" />
          실시간
        </div>
        <button
          className={`sound-btn${soundEnabled ? " on" : ""}`}
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? "🔔 알림 ON" : "🔕 알림 OFF"}
        </button>
        <button
          className="sound-btn"
          onClick={() => alarmInputRef.current.click()}
        >
          🎵 {alarmSound ? "알림음 변경" : "알림음 설정"}
        </button>
        <input
          type="file"
          accept="audio/*"
          ref={alarmInputRef}
          style={{ display: "none" }}
          onChange={handleAlarmFile}
        />
      </div>

      {/* 탭 */}
      <div className="admin-tabs">
        <button className={`admin-tab${activeTab === "orders" ? " active" : ""}`} onClick={() => setActiveTab("orders")}>🧾 주문 관리</button>
        <button className={`admin-tab${activeTab === "menus" ? " active" : ""}`} onClick={() => setActiveTab("menus")}>🍽️ 메뉴 관리</button>
        <button className={`admin-tab${activeTab === "qr" ? " active" : ""}`} onClick={() => setActiveTab("qr")}>📱 QR 관리</button>
      </div>

      {/* 주문 관리 탭 */}
      {activeTab === "orders" && (
        <>
          <div className="stats">
            <div className="stat-card"><div className="stat-num">{waitingCount}</div><div className="stat-label">대기중</div></div>
            <div className="stat-card"><div className="stat-num">{makingCount}</div><div className="stat-label">제조중</div></div>
            <div className="stat-card"><div className="stat-num">{doneCount}</div><div className="stat-label">완료</div></div>
            <div className="stat-card"><div className="stat-num">₩{todayTotal.toLocaleString()}</div><div className="stat-label">오늘 매출</div></div>
          </div>

          {orders.length === 0 ? (
            <div className="empty">아직 주문이 없어요 ☕<br />손님을 기다리는 중...</div>
          ) : (
            orders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-top">
                  <div>
                    <div className="order-num">#{order.orderNum} <span className="order-table">테이블 {order.tableNum || "-"}</span></div>
                    <div className="order-time">{order.createdAt}</div>
                    <div className="pay-method">결제: {order.payMethod === "kakao" ? "카카오페이" : order.payMethod === "naver" ? "네이버페이" : "카드"}</div>
                  </div>
                  <div className={`status-badge ${order.status === "대기중" ? "badge-waiting" : order.status === "제조중" ? "badge-making" : "badge-done"}`}>
                    {order.status}
                  </div>
                </div>
                <div className="order-items">
                  {order.items && order.items.map((item) => (
                    <div className="order-item" key={item.name}>
                      <span>{item.name} × {item.qty}</span>
                      <span>₩{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {order.note && <div className="order-note">📝 요청사항: {order.note}</div>}
                <div className="order-bottom">
                  <div className="order-total">합계 ₩{order.totalPrice?.toLocaleString()}</div>
                  <div className="status-btns">
                    <button className="btn-status btn-waiting" onClick={() => updateStatus(order.id, "대기중")}>대기중</button>
                    <button className="btn-status btn-making" onClick={() => updateStatus(order.id, "제조중")}>제조중</button>
                    <button className="btn-status btn-done" onClick={() => updateStatus(order.id, "완료")}>완료</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* 메뉴 관리 탭 */}
      {activeTab === "menus" && (
        <>
          <div className="menu-manage-header">
            <div className="menu-manage-count">총 {menus.length}개 메뉴</div>
            <button className="btn-add-menu" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "✕ 닫기" : "+ 메뉴 추가"}
            </button>
          </div>

          {/* 메뉴 추가 폼 */}
          {showAddForm && (
            <div className="menu-form-card">
              <div className="menu-form-title">새 메뉴 추가</div>
              <div className="menu-form-grid">
                <div className="form-group">
                  <label>카테고리</label>
                  <select value={newMenu.cat} onChange={(e) => setNewMenu({ ...newMenu, cat: e.target.value })}>
                    <option>커피</option>
                    <option>논커피</option>
                    <option>베이커리</option>
                    <option>에이드</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>이모지</label>
                  <input value={newMenu.emoji} onChange={(e) => setNewMenu({ ...newMenu, emoji: e.target.value })} placeholder="☕" />
                </div>
                <div className="form-group">
                  <label>메뉴 이름 *</label>
                  <input value={newMenu.name} onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })} placeholder="아메리카노" />
                </div>
                <div className="form-group">
                  <label>가격 *</label>
                  <input
                    value={newMenu.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/[^0-9]/.test(val)) {
                        setPriceError(true);
                      } else {
                        setPriceError(false);
                        setNewMenu({ ...newMenu, price: val });
                      }
                    }}
                    placeholder="4500"
                  />
                  {priceError && <span style={{ fontSize: "11px", color: "var(--red)" }}>숫자만 입력해주세요</span>}
                </div>
                <div className="form-group full">
                  <label>설명</label>
                  <input value={newMenu.desc} onChange={(e) => setNewMenu({ ...newMenu, desc: e.target.value })} placeholder="메뉴 설명을 입력해주세요" />
                </div>
                <div className="form-group full">
                  <label>태그 (쉼표로 구분)</label>
                  <input value={newMenu.tags} onChange={(e) => setNewMenu({ ...newMenu, tags: e.target.value })} placeholder="베스트, 인기, 시즌" />
                </div>
              </div>
              <button className="btn-save-menu" onClick={addMenu}>추가하기</button>
            </div>
          )}

          {/* 메뉴 목록 */}
          {menus.map((menu) => (
            <div className="menu-manage-card" key={menu.firebaseId}>
              {editMenu?.firebaseId === menu.firebaseId ? (
                <div className="menu-form-card">
                  <div className="menu-form-title">메뉴 수정</div>
                  <div className="menu-form-grid">
                    <div className="form-group">
                      <label>카테고리</label>
                      <select value={editMenu.cat} onChange={(e) => setEditMenu({ ...editMenu, cat: e.target.value })}>
                        <option>커피</option>
                        <option>논커피</option>
                        <option>베이커리</option>
                        <option>에이드</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>이모지</label>
                      <input value={editMenu.emoji} onChange={(e) => setEditMenu({ ...editMenu, emoji: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>메뉴 이름</label>
                      <input value={editMenu.name} onChange={(e) => setEditMenu({ ...editMenu, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>가격</label>
                      <input
                        value={editMenu.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/[^0-9]/.test(val)) {
                            setEditPriceError(true);
                          } else {
                            setEditPriceError(false);
                            setEditMenu({ ...editMenu, price: val });
                          }
                        }}
                      />
                      {editPriceError && <span style={{ fontSize: "11px", color: "var(--red)" }}>숫자만 입력해주세요</span>}
                    </div>
                    <div className="form-group full">
                      <label>설명</label>
                      <input value={editMenu.desc} onChange={(e) => setEditMenu({ ...editMenu, desc: e.target.value })} />
                    </div>
                    <div className="form-group full">
                      <label>태그 (쉼표로 구분)</label>
                      <input value={Array.isArray(editMenu.tags) ? editMenu.tags.join(", ") : editMenu.tags} onChange={(e) => setEditMenu({ ...editMenu, tags: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-save-menu" onClick={saveEditMenu}>저장</button>
                    <button className="btn-cancel-menu" onClick={() => setEditMenu(null)}>취소</button>
                  </div>
                </div>
              ) : (
                <div className="menu-manage-row">
                  <div className="menu-manage-emoji" style={{ position: "relative" }}>
                    {menu.image
                      ? <img src={menu.image} alt={menu.name} style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }} />
                      : menu.emoji
                    }
                    <label style={{ position: "absolute", bottom: "-4px", right: "-4px", background: "var(--warm-gold)", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "10px", color: "white" }}>
                      +
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageUpload(e, menu.firebaseId)} />
                    </label>
                  </div>
                  <div className="menu-manage-info">
                    <div className="menu-manage-name">{menu.name}
                      <span className="menu-manage-cat">{menu.cat}</span>
                    </div>
                    <div className="menu-manage-desc">{menu.desc}</div>
                    <div className="menu-manage-price">₩{Number(menu.price).toLocaleString()}</div>
                  </div>
                  <div className="menu-manage-btns">
                    <button
                      className={`btn-soldout${menu.soldOut ? " on" : ""}`}
                      onClick={() => toggleSoldOut(menu.firebaseId, menu.soldOut)}
                    >
                      {menu.soldOut ? "품절해제" : "품절"}
                    </button>
                    <button className="btn-edit" onClick={() => setEditMenu({ ...menu, tags: Array.isArray(menu.tags) ? menu.tags.join(", ") : "" })}>수정</button>
                    <button className="btn-delete" onClick={() => deleteMenu(menu.firebaseId)}>삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* QR 관리 탭 */}
      {activeTab === "qr" && (
        <>
          <div className="qr-settings">
            <div className="qr-settings-title">테이블 수 설정</div>
            <div className="qr-settings-row">
              <input
                type="number"
                min="1"
                max="50"
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value.replace(/[^0-9]/g, "")))}
                className="qr-table-input"
              />
              <span className="qr-table-label">개 테이블</span>
              <button className="btn-generate-qr" onClick={generateQRCodes}>QR 생성</button>
              {Object.keys(qrImages).length > 0 && (
                <button className="btn-print-qr" onClick={printAllQR}>전체 인쇄</button>
              )}
            </div>
          </div>

          {Object.keys(qrImages).length === 0 ? (
            <div className="empty">QR 생성 버튼을 눌러주세요 📱</div>
          ) : (
            <div className="qr-grid">
              {Object.entries(qrImages).map(([num, src]) => (
                <div className="qr-card" key={num}>
                  <img src={src} alt={`테이블 ${num}`} />
                  <div className="qr-card-label">테이블 {num}</div>
                  <div className="qr-card-url">?table={num}</div>
                  <button className="btn-download-qr" onClick={() => downloadQR(num)}>다운로드</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}