import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import confetti from 'canvas-confetti';

function MainPage() {
  const [userKey, setUserKey] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [winnerProduct, setWinnerProduct] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [displayItem, setDisplayItem] = useState(null);

  // 1. 상품 목록 불러오기
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*');
    setAllProducts(data || []);
  }

  // 2. 이미지 다운로드 처리 함수
  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName; // 다운로드될 파일명
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("다운로드 중 오류 발생:", error);
    }
  };

  // 3. 추첨 로직
  const handleDraw = async () => {
    if (!userKey) return alert('행사 암호키를 입력해주세요!');
    if (isRolling) return;

    // A. 암호 확인
    const { data: keyCheck, error: fetchError } = await supabase
      .from('access_keys')
      .select('*')
      .eq('code', userKey);

    if (fetchError || !keyCheck || keyCheck.length === 0) {
      return alert('유효하지 않거나 이미 사용된 암호입니다!');
    }

    // B. 암호 즉시 삭제 (중복 방지)
    const { data: deletedData, error: deleteError } = await supabase
      .from('access_keys')
      .delete()
      .eq('code', userKey)
      .select();

    if (deleteError || !deletedData || deletedData.length === 0) {
      return alert('암호 처리 중 오류가 발생했습니다.');
    }

    if (allProducts.length === 0) return alert('등록된 상품이 없습니다!');

    // C. 애니메이션 시작
    setIsRolling(true);
    setWinnerProduct(null);

    let count = 0;
    const totalTicks = 30;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allProducts.length);
      setDisplayItem(allProducts[randomIndex]);
      count++;

      if (count >= totalTicks) {
        clearInterval(interval);
        const finalWinner = allProducts[Math.floor(Math.random() * allProducts.length)];
        setWinnerProduct(finalWinner);
        setIsRolling(false);
        
        // 폭죽 효과
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

        // D. [추가] 2초 후 자동 이미지 다운로드
        setTimeout(() => {
          if (finalWinner && finalWinner.image_url) {
            handleDownload(finalWinner.image_url, `${finalWinner.title}_당첨기념.png`);
          }
        }, 2000);
      }
    }, 100);
  };

  return (
    <div className="container" style={{ textAlign: 'center', padding: '50px 20px', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h1 style={{ marginBottom: '40px', fontSize: '2.5rem' }}>🎁 화평부 선물추첨</h1>
      
      <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="행사 암호키를 입력하세요" 
          value={userKey}
          onChange={(e) => setUserKey(e.target.value)}
          disabled={isRolling}
          style={inputStyle} // boxSizing이 적용된 스타일
        />

        <button 
          onClick={handleDraw} 
          disabled={isRolling}
          style={{ 
            ...btnStyle,
            backgroundColor: isRolling ? '#ccc' : '#ff4757',
            cursor: isRolling ? 'default' : 'pointer'
          }}
        >
          {isRolling ? '추첨 중... 🥁' : '선물 추첨 시작!'}
        </button>
      </div>

      {isRolling && displayItem && (
        <div style={{ marginTop: '50px' }}>
          <div style={slotFrameStyle}>
            <img src={displayItem.image_url} alt="rolling" style={imgStyle} />
          </div>
          <h2 style={{ color: '#ffcc00', marginTop: '20px' }}>두구두구두구...</h2>
        </div>
      )}

      {!isRolling && winnerProduct && (
        <div style={resultCardStyle}>
          <h1 style={{ color: '#ff4757', fontSize: '3rem', marginBottom: '10px' }}>🎊 당 첨 🎊</h1>
          <img src={winnerProduct.image_url} alt="winner" style={{ ...imgStyle, borderRadius: '20px' }} />
          <h2 style={{ fontSize: '32px', marginTop: '15px' }}>{winnerProduct.title}</h2>
          <p style={{ fontSize: '16px', color: '#888', marginTop: '10px' }}>당첨 이미지가 곧 자동으로 저장됩니다.</p>
          <button onClick={() => {setWinnerProduct(null); setUserKey('');}} style={resetBtnStyle}>다시하기</button>
        </div>
      )}
    </div>
  );
}

// 스타일 정의
const inputStyle = { 
  width: '100%', 
  padding: '18px', 
  fontSize: '20px', 
  borderRadius: '12px', 
  border: '2px solid #4CAF50', 
  textAlign: 'center', 
  outline: 'none',
  boxSizing: 'border-box' // 삐져나옴 방지 핵심 코드
};

const btnStyle = { 
  width: '100%', 
  padding: '20px', 
  fontSize: '22px', 
  fontWeight: 'bold', 
  color: 'white', 
  border: 'none', 
  borderRadius: '12px',
  boxSizing: 'border-box'
};

const slotFrameStyle = { display: 'inline-block', padding: '10px', background: 'white', borderRadius: '20px', border: '8px solid #ffcc00' };
const imgStyle = { width: '250px', height: '250px', objectFit: 'cover' };
const resultCardStyle = { maxWidth: '400px', margin: '40px auto 0', padding: '40px 20px', backgroundColor: '#fff', borderRadius: '30px', boxShadow: '0 10px 50px rgba(0,0,0,0.15)', border: '5px solid #ff4757', boxSizing: 'border-box' };
const resetBtnStyle = { marginTop: '30px', padding: '12px 25px', borderRadius: '25px', border: 'none', backgroundColor: '#f0f0f0', cursor: 'pointer' };

export default MainPage;