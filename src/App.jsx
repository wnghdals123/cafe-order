import { useState } from "react";
import { db } from "./firebase";
import { ref, push } from "firebase/database";

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

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600&family=Noto+Sans+KR:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --cream: #fdf6ee; --brown-deep: #3d2b1f; --brown-mid: #7c5c3e; --brown-light: #b08060;
    --warm-gold: #c8912a; --warm-bg: #f5ebe0; --card-bg: #fffdf9; --border: #e8d5be;
    --text-dark: #2d1f10; --text-mid: #6b4c30; --text-light: #a07850; --tag-bg: #f0e0cc;
  }
  body { background: var(--cream); font-family: 'Noto Sans KR', sans-serif; color: var(--text-dark); }
  .app { max-width: 430px; margin: 0 auto; min-height: 100vh; position: relative; }
  .header { background: var(--brown-deep); padding: 20px 20px 16px; text-align: center; position: relative; }
  .header-logo { font-family: 'Noto Serif KR', serif; color: #f5e6c8; font-size: 22px; font-weight: 600; letter-spacing: 2px; }
  .header-sub { color: var(--brown-light); font-size: 11px; letter-spacing: 3px; margin-top: 3px; text-transform: uppercase; }
  .table-badge { position: absolute; top: 18px; right: 18px; background: var(--warm-gold); color: white; font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: 20px; }
  .tabs { background: var(--card-bg); border-bottom: 1px solid var(--border); display: flex; overflow-x: auto; scrollbar-width: none; padding: 0 8px; gap: 4px; position: sticky; top: 0; z-index: 10; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab { flex-shrink: 0; padding: 12px 14px; font-size: 13px; color: var(--text-light); cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; font-weight: 400; transition: all .2s; background: none; border-top: none; border-left: none; border-right: none; font-family: 'Noto Sans KR', sans-serif; }
  .tab.active { color: var(--brown-deep); border-bottom-color: var(--warm-gold); font-weight: 500; }
  .menu-section { padding: 16px 16px 100px; }
  .section-title { font-family: 'Noto Serif KR', serif; font-size: 16px; color: var(--text-mid); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .menu-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; margin-bottom: 12px; display: flex; align-items: center; padding: 14px; gap: 14px; }
  .menu-img { width: 72px; height: 72px; border-radius: 10px; background: var(--warm-bg); display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; }
  .menu-info { flex: 1; min-width: 0; }
  .menu-name { font-size: 14px; font-weight: 500; color: var(--text-dark); margin-bottom: 3px; }
  .menu-desc { font-size: 11px; color: var(--text-light); line-height: 1.5; margin-bottom: 6px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .menu-price { font-size: 14px; font-weight: 500; color: var(--brown-mid); }
  .menu-tags { display: flex; gap: 4px; margin-bottom: 5px; }
  .tag { background: var(--tag-bg); color: var(--text-mid); font-size: 10px; padding: 2px 8px; border-radius: 10px; }
  .add-btn { width: 34px; height: 34px; border-radius: 50%; background: var(--brown-deep); border: none; color: #f5e6c8; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; line-height: 1; }
  .qty-ctrl { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .qty-ctrl span { font-size: 15px; font-weight: 500; min-width: 20px; text-align: center; }
  .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--border); background: var(--card-bg); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; color: var(--text-mid); font-family: 'Noto Sans KR', sans-serif; }
  .cart-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; background: var(--brown-deep); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; z-index: 100; border: none; font-family: 'Noto Sans KR', sans-serif; }
  .cart-count-badge { background: var(--warm-gold); color: white; font-size: 12px; font-weight: 500; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .cart-bar-left { display: flex; align-items: center; gap: 12px; }
  .cart-bar-text { color: #f5e6c8; font-size: 14px; font-weight: 500; }
  .cart-bar-price { color: #f5e6c8; font-size: 15px; font-weight: 600; }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  .sheet { background: var(--cream); border-radius: 20px 20px 0 0; width: 100%; max-width: 430px; max-height: 85vh; overflow-y: auto; }
  .sheet-handle { width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 12px auto 0; }
  .sheet-header { padding: 16px 20px 12px; border-bottom: 1px solid var(--border); }
  .sheet-title { font-family: 'Noto Serif KR', serif; font-size: 17px; font-weight: 600; color: var(--text-dark); }
  .cart-item { display: flex; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--border); gap: 12px; }
  .cart-item-emoji { font-size: 24px; width: 40px; text-align: center; }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
  .cart-item-price { font-size: 12px; color: var(--text-light); }
  .cart-total { margin: 12px 16px; background: var(--warm-bg); padding: 16px; border-radius: 12px; }
  .cart-total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: var(--text-mid); }
  .cart-total-final { display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; padding-top: 8px; border-top: 1px solid var(--border); margin-top: 6px; }
  .order-note { padding: 0 20px 12px; }
  .note-label { font-size: 12px; color: var(--text-light); margin-bottom: 6px; }
  .note-input { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 13px; font-family: 'Noto Sans KR', sans-serif; background: var(--card-bg); color: var(--text-dark); resize: none; outline: none; }
  .sheet-actions { padding: 16px 20px 30px; display: flex; gap: 10px; }
  .btn-back { flex: 0 0 auto; padding: 14px 18px; border: 1.5px solid var(--border); border-radius: 12px; background: var(--card-bg); color: var(--text-mid); font-size: 13px; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
  .btn-order { flex: 1; padding: 14px; border-radius: 12px; background: var(--brown-deep); border: none; color: #f5e6c8; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
  .pay-method-title { padding: 20px 20px 10px; font-family: 'Noto Serif KR', serif; font-size: 16px; color: var(--text-dark); }
  .pay-methods { padding: 0 20px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .pay-method-btn { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1.5px solid var(--border); border-radius: 12px; background: var(--card-bg); cursor: pointer; transition: all .2s; text-align: left; font-family: 'Noto Sans KR', sans-serif; width: 100%; }
  .pay-method-btn.selected { border-color: var(--warm-gold); background: #fffbf3; }
  .pay-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .pay-info strong { font-size: 13px; font-weight: 500; color: var(--text-dark); display: block; }
  .pay-info small { font-size: 11px; color: var(--text-light); }
  .check-mark { margin-left: auto; color: var(--warm-gold); font-size: 18px; }
  .btn-pay { margin: 0 20px 30px; display: block; width: calc(100% - 40px); padding: 16px; border-radius: 14px; background: var(--warm-gold); border: none; color: white; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
  .success-view { text-align: center; padding: 40px 24px 60px; }
  .success-icon { font-size: 60px; margin-bottom: 20px; display: block; }
  .success-title { font-family: 'Noto Serif KR', serif; font-size: 20px; margin-bottom: 8px; }
  .success-sub { font-size: 13px; color: var(--text-light); line-height: 1.7; margin-bottom: 24px; }
  .order-num-box { background: var(--warm-bg); border-radius: 12px; padding: 16px 32px; margin-bottom: 16px; display: inline-block; }
  .order-num-label { font-size: 11px; color: var(--text-light); margin-bottom: 4px; }
  .order-num-value { font-size: 28px; font-weight: 600; color: var(--warm-gold); font-family: 'Noto Serif KR', serif; }
  .order-eta { font-size: 12px; color: var(--text-mid); background: var(--tag-bg); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 28px; }
  .btn-new-order { padding: 12px 32px; border-radius: 12px; background: var(--brown-deep); border: none; color: #f5e6c8; font-size: 13px; cursor: pointer; font-family: 'Noto Sans KR', sans-serif; }
  .empty-cart { text-align: center; padding: 30px; color: var(--text-light); font-size: 13px; }
`;

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

    const { IMP } = window;
    IMP.init("imp08425144");

    const payMethod = selectedPay === "kakao" ? "kakaopay" : selectedPay === "naver" ? "naverpay" : "card";

    IMP.request_pay(
      {
        pg: "tosspayments",
        channel_key: "channel-key-766362a2-6f8e-4d4e-9bc3-10119735dd6a",
        pay_method: payMethod,
        merchant_uid: `order_${num}_${Date.now()}`,
        name: orderItems.map((i) => i.name).join(", "),
        amount: totalPrice,
        buyer_name: "카페 손님",
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
      <style>{styles}</style>
      <div className="app">

        <div className="header">
          <div className="header-logo">☕ Warm Bean Café</div>
          //로고
          <div className="header-sub">Order & Pay</div>
          <div className="table-badge">테이블 7</div>
          //테이블 번호
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
                <button class="btn-new-order" onClick={newOrder}>처음으로 돌아가기</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}