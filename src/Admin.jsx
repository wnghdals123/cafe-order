import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue, update, push, remove, set } from "firebase/database";
import "./Admin.css";

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [editMenu, setEditMenu] = useState(null);
  const [newMenu, setNewMenu] = useState({ cat: "커피", name: "", desc: "", price: "", emoji: "☕", tags: "" });
  const [showAddForm, setShowAddForm] = useState(false);

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

  const updateStatus = (id, status) => update(ref(db, `orders/${id}`), { status });

  const deleteMenu = (firebaseId) => {
    if (window.confirm("메뉴를 삭제할까요?")) {
      remove(ref(db, `menus/${firebaseId}`));
    }
  };

  const saveEditMenu = () => {
    const { firebaseId, ...data } = editMenu;
    data.price = Number(data.price);
    data.tags = typeof data.tags === "string" ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : data.tags;
    set(ref(db, `menus/${firebaseId}`), data);
    setEditMenu(null);
  };

  const addMenu = () => {
    if (!newMenu.name || !newMenu.price) return alert("이름과 가격을 입력해주세요!");
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
      </div>

      {/* 탭 */}
      <div className="admin-tabs">
        <button className={`admin-tab${activeTab === "orders" ? " active" : ""}`} onClick={() => setActiveTab("orders")}>🧾 주문 관리</button>
        <button className={`admin-tab${activeTab === "menus" ? " active" : ""}`} onClick={() => setActiveTab("menus")}>🍽️ 메뉴 관리</button>
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
                    <div className="order-num">#{order.orderNum}</div>
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
                  <input type="number" value={newMenu.price} onChange={(e) => setNewMenu({ ...newMenu, price: e.target.value })} placeholder="4500" />
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
                      <input type="number" value={editMenu.price} onChange={(e) => setEditMenu({ ...editMenu, price: e.target.value })} />
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
                  <div className="menu-manage-emoji">{menu.emoji}</div>
                  <div className="menu-manage-info">
                    <div className="menu-manage-name">{menu.name}
                      <span className="menu-manage-cat">{menu.cat}</span>
                    </div>
                    <div className="menu-manage-desc">{menu.desc}</div>
                    <div className="menu-manage-price">₩{Number(menu.price).toLocaleString()}</div>
                  </div>
                  <div className="menu-manage-btns">
                    <button className="btn-edit" onClick={() => setEditMenu({ ...menu, tags: Array.isArray(menu.tags) ? menu.tags.join(", ") : "" })}>수정</button>
                    <button className="btn-delete" onClick={() => deleteMenu(menu.firebaseId)}>삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}