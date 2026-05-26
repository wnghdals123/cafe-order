import { useState } from "react";
import { db } from "./firebase";
import { ref, push } from "firebase/database";
import "./App.css";

const MENU = [
  { id: 1, cat: "커피", name: "아메리카노", desc: "깊고 진한 에스프레소에 뜨거운 물을 더한 클래식", price: 4500, emoji: "☕", tags: ["베스트"] },
  { id: 2, cat: "커피", name: "카페 라떼", desc: "부드러운 우유 거품과 진한 에스프레소의 조화", price: 5000, emoji: "🍵", tags: ["인기"] },
  { id: 3, cat: "커피", name: "카푸치노", desc: "풍성한 우유 폼으로 따뜻하게 즐기는 이탈리안 커피", price: 5000, emoji: "☕", tags: [] },
  { id: 4, cat: "커피", name: "바닐라 라떼", desc: "달콤한 바닐라 시럽이 어우러진 부드러운 라떼", price: 5500, emoji: "🧡", tags: ["달콤"] },
  { id: 5, cat: "논커피", name: "고구마 라떼", desc: "달콤한 국내산 고구마로 만든 따뜻한 계절 음료", price: 5500, emoji: "🍠", tags: ["시즌"] },
  { id: 6, cat: "논커피", name: "밀크티", desc: "실론 홍차와 진한 우유가 만난 부드러운 밀크티", price: 5000, emoji: "🫖", tags: ["인기"] },
  { id: 7, cat: "논커피", name: "초코라떼", desc: "벨기에 다크 초콜릿으로 만든 진한 핫초코", price: 5500, emoji: "🍫", tags: [] },
  { id: 8, cat: "베이커리", name: "크로아상", desc: "겉은 바삭, 속은 촉촉한 프레시 버터 크로아상", price: 3500, emoji: "🥐", tags: ["베스트"] },
  { id: 9, cat: "베이커리", name: "치즈케이크", desc: "뉴욕 스타일 진한 치즈케이크, 하루 한정 제공", price: 6500, emoji: "🍰", tags: ["한정"] },
  { id: 10, cat: "베이커리", name: "마들렌", desc: "버터향 가득한 촉촉한 프랑스식 홈메이드 마들렌", price: 3000, emoji: "🧁", tags: [] },
  { id: 11, cat: "에이드", name: "레몬 에이드", desc: "생레몬을 그대로 짜낸 상큼한 수제 에이드", price: 5500, emoji: "🍋", tags: ["시원"] },
  { id: 12, cat: "에이드", name: "자몽 에이드", desc: "자몽과 허니 시럽의 상큼달콤 조화", price: 5500, emoji: "🍊", tags: ["인기"] },
];

/*
{ 
  id: 1,            // 고유 번호 (건드리지 마세요)
  cat: "커피",      // 카테고리 (탭 이름)
  name: "아메리카노", // 메뉴 이름
  desc: "설명...",  // 메뉴 설명
  price: 4500,      // 가격 (숫자만)
  emoji: "☕",      // 아이콘
  tags: ["베스트"]  // 태그 (없으면 [] 로 비워두기)
}
*/

const CATS = ["전체", ...new Set(MENU.map((m) => m.cat))];

const PAY_METHODS = [
  { id: "kakao", name: "카카오페이", sub: "카카오 계정으로 빠른 결제", emoji: "💛", bg: "#FEE500" },
  { id: "naver", name: "네이버페이", sub: "네이버 계정으로 빠른 결제", emoji: "💚", bg: "#03C75A" },
  { id: "card", name: "신용/체크카드", sub: "VISA, Mastercard, 국내카드", emoji: "💳", bg: "#e8d5be" },
];



export default function App() {
  const [cart, setCart] = useState({});
  const [activeCat, setActiveCat] = useState("전체");
  const [sheet, setSheet] = useState(null);
  const [selectedPay, setSelectedPay] = useState("kakao");
  const [orderNote, setOrderNote] = useState("");
  const [orderNum, setOrderNum] = useState(0);
  const [orderEta, setOrderEta] = useState(0);

  const filteredMenu = activeCat === "전체" ? MENU : MENU.filter((m) => m.cat === activeCat);
  const grouped = filteredMenu.reduce((acc, m) => {
    if (!acc[m.cat]) acc[m.cat] = [];
    acc[m.cat].push(m);
    return acc;
  }, {});

  const totalCount = Object.values(cart).reduce((s, v) => s + v, 0);
  const totalPrice = MENU.filter((m) => cart[m.id]).reduce((s, m) => s + cart[m.id] * m.price, 0);

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

    const orderItems = MENU.filter((m) => cart[m.id]).map((m) => ({
      name: m.name,
      qty: cart[m.id],
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
          {/* 로고 */}
          <div className="header-sub">Order & Pay</div>
          <div className="table-badge">테이블 7</div>
          {/* 테이블 번호 */}
        </div>

        <div className="tabs">
          {CATS.map((c) => (
            <button key={c} className={`tab${c === activeCat ? " active" : ""}`} onClick={() => setActiveCat(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="menu-section">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="section-title">{cat}</div>
              {items.map((m) => (
                <div className="menu-card" key={m.id}>
                  <div className="menu-img">{m.emoji}</div>
                  <div className="menu-info">
                    {m.tags.length > 0 && (
                      <div className="menu-tags">
                        {m.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                      </div>
                    )}
                    <div className="menu-name">{m.name}</div>
                    <div className="menu-desc">{m.desc}</div>
                    <div className="menu-price">₩{m.price.toLocaleString()}</div>
                  </div>
                  {cart[m.id] ? (
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => changeQty(m.id, -1)}>−</button>
                      <span>{cart[m.id]}</span>
                      <button className="qty-btn" onClick={() => changeQty(m.id, 1)}>+</button>
                    </div>
                  ) : (
                    <button className="add-btn" onClick={() => addItem(m.id)}>+</button>
                  )}
                </div>
              ))}
            </div>
          ))}
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
              {MENU.filter((m) => cart[m.id]).length === 0 ? (
                <div className="empty-cart">장바구니가 비어있어요 ☕</div>
              ) : (
                MENU.filter((m) => cart[m.id]).map((m) => (
                  <div className="cart-item" key={m.id}>
                    <div className="cart-item-emoji">{m.emoji}</div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{m.name}</div>
                      <div className="cart-item-price">₩{m.price.toLocaleString()} × {cart[m.id]}</div>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => changeQty(m.id, -1)}>−</button>
                      <span>{cart[m.id]}</span>
                      <button className="qty-btn" onClick={() => changeQty(m.id, 1)}>+</button>
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