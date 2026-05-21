import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue, update } from "firebase/database";

const adminStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --cream: #fdf6ee; --brown-deep: #3d2b1f; --brown-mid: #7c5c3e;
    --warm-gold: #c8912a; --warm-bg: #f5ebe0; --card-bg: #fffdf9;
    --border: #e8d5be; --text-dark: #2d1f10; --text-mid: #6b4c30; --text-light: #a07850;
    --green: #4a7c59; --red: #c0392b;
  }
  body { background: var(--cream); font-family: 'Noto Sans KR', sans-serif; }
  .admin { max-width: 800px; margin: 0 auto; padding: 20px; }
  .admin-header { background: var(--brown-deep); padding: 16px 20px; border-radius: 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
  .admin-title { color: #f5e6c8; font-size: 18px; font-weight: 500; }
  .admin-sub { color: var(--brown-mid); font-size: 12px; }
  .live-badge { background: var(--green); color: white; font-size: 11px; padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px; }
  .live-dot { width: 7px; height: 7px; background: white; border-radius: 50%; animation: blink 1s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; }
  .stat-num { font-size: 28px; font-weight: 600; color: var(--warm-gold); }
  .stat-label { font-size: 12px; color: var(--text-light); margin-top: 4px; }
  .order-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 12px; }
  .order-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .order-num { font-size: 18px; font-weight: 600; color: var(--brown-deep); }
  .order-time { font-size: 11px; color: var(--text-light); }
  .order-items { background: var(--warm-bg); border-radius: 10px; padding: 12px; margin-bottom: 12px; }
  .order-item { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-mid); padding: 3px 0; }
  .order-note { font-size: 12px; color: var(--text-light); background: #fff8f0; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
  .order-bottom { display: flex; align-items: center; justify-content: space-between; }
  .order-total { font-size: 15px; font-weight: 600; color: var(--text-dark); }
  .status-btns { display: flex; gap: 8px; }
  .btn-status { padding: 8px 14px; border-radius: 8px; border: none; font-size: 12px; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; font-weight: 500; }
  .btn-waiting { background: #fff3cd; color: #856404; }
  .btn-making { background: #cfe2ff; color: #084298; }
  .btn-done { background: #d1e7dd; color: #0a3622; }
  .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .badge-waiting { background: #fff3cd; color: #856404; }
  .badge-making { background: #cfe2ff; color: #084298; }
  .badge-done { background: #d1e7dd; color: #0a3622; }
  .empty { text-align: center; padding: 60px; color: var(--text-light); font-size: 14px; }
  .pay-method { font-size: 11px; color: var(--text-light); margin-top: 4px; }
`;

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
    <>
      <style>{adminStyles}</style>
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
    </>
  );
}