import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, push } from "firebase/database";
import "./App.css";

const CATS_ORDER = ["전체", "커피", "논커피", "베이커리", "에이드"];

const PAY_METHODS = [
  { id: "kakao", name: "카카오페이", sub: "카카오 계정으로 빠른 결제", emoji: "💛", bg: "#FEE500" },
  { id: "naver", name: "네이버페이", sub: "네이버 계정으로 빠른 결제", emoji: "💚", bg: "#03C75A" },
  { id: "card", name: "신용/체크카드", sub: "VISA, Mastercard, 국내카드", emoji: "💳", bg: "#e8d5be" },
];

export default function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [activeCat, setActiveCat] = useState("전체");
  const [sheet, setSheet] = useState(null);
  const [selectedPay, setSelectedPay] = useState("kakao");
  const [orderNote, setOrderNote] = useState("");
  const [orderNum, setOrderNum] = useState(0);
  const [orderEta, setOrderEta] = useState(0);
  const tableNum = new URLSearchParams(window.location.search).get("table") || "1";

  useEffect(() => {
    const menusRef = ref(db, "menus");
    onValue(menusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ firebaseId: id, ...val }));
        setMenu(list);
      } else {
        setMenu([]);
      }
    });
  }, []);

  const cats = ["전체", ...new Set(
    CATS_ORDER.filter((c) => c !== "전체" && menu.some((m) => m.cat === c))
      .concat(menu.map((m) => m.cat).filter((c) => !CATS_ORDER.includes(c)))
  )];

  const filteredMenu = activeCat === "전체" ? menu : menu.filter((m) => m.cat === activeCat);
  const grouped = filteredMenu.reduce((acc, m) => {
    if (!acc[m.cat]) acc[m.cat] = [];
    acc[m.cat].push(m);
    return acc;
  }, {});

  const totalCount = Object.values(cart).reduce((s, v) => s + v, 0);
  const totalPrice = menu.filter((m) => cart[m.firebaseId]).reduce((s, m) => s + cart[m.firebaseId] * m.price, 0);

  const addItem = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const changeQty = (id, d) => {
    setCart((c) => {
      const next = { ...c, [id]: (c[id] || 0) + d };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  };

  const doPayment = async () => {
    const num = Math.floor(1000 + Math.random() * 8999);
    const eta = [5, 7, 8, 10][Math.floor(Math.random() * 4)];

    const orderItems = menu.filter((m) => cart[m.firebaseId]).map((m) => ({
      name: m.name,
      qty: cart[m.firebaseId],
      price: m.price,
    }));

    const saveOrder = async () => {
      await push(ref(db, "orders"), {
        orderNum: num,
        items: orderItems,
        totalPrice: totalPrice,
        note: orderNote,
        payMethod: selectedPay,
        status: "대기중",
        createdAt: new Date().toLocaleString("ko-KR"),
        tableNum: tableNum,
      });
      setOrderNum(num);
      setOrderEta(eta);
      setSheet("success");
    };

    if (selectedPay === "card") {
      await saveOrder();
      return;
    }

    const { IMP } = window;
    IMP.init("imp08425144");

    IMP.request_pay(
      {
        pg: "tosspayments",
        pay_method: selectedPay === "kakao" ? "kakaopay" : "naverpay",
        merchant_uid: `order_${num}_${Date.now()}`,
        name: orderItems.map((i) => i.name).join(", "),
        amount: totalPrice,
        buyer_name: "카페 손님",
        buyer_tel: "010-0000-0000",
      },
      async (rsp) => {
        if (rsp.success) {
          await push(ref(db, "orders"), {
            orderNum: num,
            items: orderItems,
            totalPrice: totalPrice,
            note: orderNote,
            payMethod: selectedPay,
            status: "대기중",
            createdAt: new Date().toLocaleString("ko-KR"),
            tableNum: tableNum,
            impUid: rsp.imp_uid,
          });
          setOrderNum(num);
          setOrderEta(eta);
          setSheet("success");
        } else {
          alert("결제에 실패했어요: " + rsp.error_msg);
        }
      }
    );
  };

  const newOrder = () => {
    setCart({});
    setOrderNote("");
    setSheet(null);
  };

  return (
    <>
      <div className="app">
        <div className="header">
          <div className="header-logo">☕ Warm Bean Café</div>
          <div className="header-sub">Order & Pay</div>
          <div className="table-badge">테이블 {tableNum}</div>
        </div>

        <div className="tabs">
          {cats.map((c) => (
            <button key={c} className={`tab${c === activeCat ? " active" : ""}`} onClick={() => setActiveCat(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="menu-section">
          {menu.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-light)", fontSize: "14px" }}>
              메뉴를 불러오는 중... ☕
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="section-title">{cat}</div>
                {items.map((m) => (
                  <div className={`menu-card${m.soldOut ? " sold-out" : ""}`} key={m.firebaseId}>
                    <div className="menu-img">
                      {m.image
                        ? <img src={m.image} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                        : m.emoji
                      }
                    </div>
                    <div className="menu-info">
                      {m.soldOut && <div className="menu-tags"><span className="tag soldout-tag">품절</span></div>}
                      {!m.soldOut && m.tags?.length > 0 && (
                        <div className="menu-tags">
                          {m.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                        </div>
                      )}
                      <div className="menu-name">{m.name}</div>
                      <div className="menu-desc">{m.desc}</div>
                      <div className="menu-price">₩{Number(m.price).toLocaleString()}</div>
                    </div>
                    {m.soldOut ? (
                      <button className="add-btn soldout-btn" disabled>-</button>
                    ) : cart[m.firebaseId] ? (
                      <div className="qty-ctrl">
                        <button className="qty-btn" onClick={() => changeQty(m.firebaseId, -1)}>−</button>
                        <span>{cart[m.firebaseId]}</span>
                        <button className="qty-btn" onClick={() => changeQty(m.firebaseId, 1)}>+</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => addItem(m.firebaseId)}>+</button>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {totalCount > 0 && (
          <button className="cart-bar" onClick={() => setSheet("cart")}>
            <div className="cart-bar-left">
              <div className="cart-count-badge">{totalCount}</div>
              <div className="cart-bar-text">장바구니 보기</div>
            </div>
            <div className="cart-bar-price">₩{totalPrice.toLocaleString()}</div>
          </button>
        )}

        {sheet === "cart" && (
          <div className="overlay" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
            <div className="sheet">
              <div className="sheet-handle" />
              <div className="sheet-header"><div className="sheet-title">🛒 장바구니</div></div>
              {menu.filter((m) => cart[m.firebaseId]).length === 0 ? (
                <div className="empty-cart">장바구니가 비어있어요 ☕</div>
              ) : (
                menu.filter((m) => cart[m.firebaseId]).map((m) => (
                  <div className="cart-item" key={m.firebaseId}>
                    <div className="cart-item-emoji">{m.emoji}</div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{m.name}</div>
                      <div className="cart-item-price">₩{Number(m.price).toLocaleString()} × {cart[m.firebaseId]}</div>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => changeQty(m.firebaseId, -1)}>−</button>
                      <span>{cart[m.firebaseId]}</span>
                      <button className="qty-btn" onClick={() => changeQty(m.firebaseId, 1)}>+</button>
                    </div>
                  </div>
                ))
              )}
              <div className="order-note">
                <div className="note-label">요청사항 (선택)</div>
                <textarea className="note-input" rows="2" placeholder="예: 얼음 적게, 시럽 추가 등..."
                  value={orderNote} onChange={(e) => setOrderNote(e.target.value)} />
              </div>
              <div className="cart-total">
                <div className="cart-total-row"><span>소계</span><span>₩{totalPrice.toLocaleString()}</span></div>
                <div className="cart-total-row"><span>서비스 요금 (0%)</span><span>₩0</span></div>
                <div className="cart-total-final"><span>합계</span><span>₩{totalPrice.toLocaleString()}</span></div>
              </div>
              <div className="sheet-actions">
                <button className="btn-back" onClick={() => setSheet(null)}>← 메뉴</button>
                <button className="btn-order" onClick={() => setSheet("pay")}>결제하기</button>
              </div>
            </div>
          </div>
        )}

        {sheet === "pay" && (
          <div className="overlay" onClick={(e) => e.target === e.currentTarget && setSheet("cart")}>
            <div className="sheet">
              <div className="sheet-handle" />
              <div className="sheet-header"><div className="sheet-title">💳 결제 방법 선택</div></div>
              <div className="pay-method-title">간편결제</div>
              <div className="pay-methods">
                {PAY_METHODS.map((p) => (
                  <button key={p.id} className={`pay-method-btn${p.id === selectedPay ? " selected" : ""}`}
                    onClick={() => setSelectedPay(p.id)}>
                    <div className="pay-icon" style={{ background: p.bg }}>{p.emoji}</div>
                    <div className="pay-info">
                      <strong>{p.name}</strong>
                      <small>{p.sub}</small>
                    </div>
                    {p.id === selectedPay && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
              <div className="cart-total" style={{ margin: "0 16px 16px" }}>
                <div className="cart-total-final"><span>최종 결제 금액</span><span>₩{totalPrice.toLocaleString()}</span></div>
              </div>
              <button className="btn-pay" onClick={doPayment}>₩{totalPrice.toLocaleString()} 결제하기</button>
            </div>
          </div>
        )}

        {sheet === "success" && (
          <div className="overlay">
            <div className="sheet">
              <div className="sheet-handle" />
              <div className="success-view">
                <span className="success-icon">🎉</span>
                <div className="success-title">주문이 완료되었습니다!</div>
                <div className="success-sub">음료가 준비되면 테이블 번호로<br />안내해 드릴게요.</div>
                <div className="order-num-box">
                  <div className="order-num-label">주문 번호</div>
                  <div className="order-num-value">#{orderNum}</div>
                </div>
                <br />
                <div className="order-eta">예상 대기 시간: 약 {orderEta}분</div>
                <br /><br />
                <button className="btn-new-order" onClick={newOrder}>처음으로 돌아가기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}