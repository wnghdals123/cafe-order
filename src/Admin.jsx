import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue, update } from "firebase/database";
import "./Admin.css";

export default function Admin() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const ordersRef = ref(db, "orders");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .reverse();
        setOrders(list);
      } else {
        setOrders([]);
      }
    });
  }, []);

  const updateStatus = (id, status) => {
    update(ref(db, `orders/${id}`), { status });
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

      <div className="stats">
        <div className="stat-card">
          <div className="stat-num">{waitingCount}</div>
          <div className="stat-label">대기중</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{makingCount}</div>
          <div className="stat-label">제조중</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{doneCount}</div>
          <div className="stat-label">완료</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">₩{todayTotal.toLocaleString()}</div>
          <div className="stat-label">오늘 매출</div>
        </div>
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
              {order.items && order.items.map((item, i) => (
                <div className="order-item" key={i}>
                  <span>{item.name} × {item.qty}</span>
                  <span>₩{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {order.note && (
              <div className="order-note">📝 요청사항: {order.note}</div>
            )}

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
    </div>

  );
}