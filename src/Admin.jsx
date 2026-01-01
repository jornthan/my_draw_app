import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function Admin() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [keyList, setKeyList] = useState([]);
  const [products, setProducts] = useState([]);
  const [newKey, setNewKey] = useState('');
  
  // 상품 등록 상태 (파일 객체 추가)
  const [productTitle, setProductTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchKeys();
      fetchProducts();
    }
  }, [isLoggedIn]);

  async function fetchKeys() {
    const { data } = await supabase.from('access_keys').select('*');
    setKeyList(data || []);
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
  }

  const handleLogin = () => {
    if (password === '1234') { // 실제 비밀번호로 변경
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  // --- [핵심] 파일 업로드 및 상품 등록 로직 ---
  const handleAddProduct = async () => {
    if (!productTitle || !imageFile) return alert('상품명과 이미지를 모두 등록해주세요!');
    
    setIsUploading(true);
    try {
      // 1. 파일 이름 생성 (중복 방지를 위해 타임스탬프 추가)
      const fileName = `${Date.now()}_${imageFile.name}`;
      
      // 2. Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product_image')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // 3. 업로드된 파일의 Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('product_image')
        .getPublicUrl(fileName);

      // 4. DB(products 테이블)에 상품 정보 저장
      const { error: dbError } = await supabase
        .from('products')
        .insert([{ title: productTitle, image_url: publicUrl }]);

      if (dbError) throw dbError;

      alert('상품 등록 완료!');
      setProductTitle('');
      setImageFile(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteKey = async (id) => {
    await supabase.from('access_keys').delete().eq('id', id);
    fetchKeys();
  };

  const deleteProduct = async (id, imageUrl) => {
    // DB 삭제
    await supabase.from('products').delete().eq('id', id);
    // 선택 사항: Storage에서도 삭제하고 싶다면 추가 로직 필요
    fetchProducts();
  };

  if (!isLoggedIn) {
    return (
      <div style={loginContainerStyle}>
        <h2>관리자 로그인</h2>
        <input 
          type="text" // 암호를 텍스트로 표시
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="비밀번호 입력"
          style={inputStyle}
        />
        <button onClick={handleLogin} style={btnStyle}>로그인</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>🛠 관리자 대시보드</h1>
      
      <div style={flexContainerStyle}>
        {/* 암호키 관리 */}
        <div style={sectionStyle}>
          <h2>🔐 암호키 발급</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              style={{ ...inputStyle, flex: 1 }} 
              value={newKey} 
              onChange={(e) => setNewKey(e.target.value)} 
              placeholder="새 암호키 입력"
            />
            <button onClick={async () => {
              await supabase.from('access_keys').insert([{ code: newKey }]);
              setNewKey('');
              fetchKeys();
            }} style={btnStyle}>추가</button>
          </div>
          <ul style={listStyle}>
            {keyList.map(k => (
              <li key={k.id} style={listItemStyle}>
                {k.code}
                <button onClick={() => deleteKey(k.id)} style={deleteBtnStyle}>삭제</button>
              </li>
            ))}
          </ul>
        </div>

        {/* 상품 등록 (파일 업로드 방식) */}
        <div style={sectionStyle}>
          <h2>🎁 추첨 상품 등록</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
            <input 
              style={inputStyle} 
              value={productTitle} 
              onChange={(e) => setProductTitle(e.target.value)} 
              placeholder="상품명 입력"
            />
            {/* 파일 선택 버튼 */}
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ fontSize: '14px' }}
            />
            <button 
              onClick={handleAddProduct} 
              disabled={isUploading}
              style={{ ...btnStyle, backgroundColor: isUploading ? '#ccc' : '#4CAF50' }}
            >
              {isUploading ? '업로드 중...' : '상품 및 이미지 등록'}
            </button>
          </div>
          
          <div style={gridStyle}>
            {products.map(p => (
              <div key={p.id} style={productCardStyle}>
                <img src={p.image_url} alt={p.title} style={productImgStyle} />
                <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.title}</p>
                <button onClick={() => deleteProduct(p.id, p.image_url)} style={deleteBtnStyle}>삭제</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 스타일 (이전과 동일하지만 모바일 대응 포함)
const flexContainerStyle = { display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' };
const sectionStyle = { flex: '1 1 400px', minWidth: '300px', padding: '25px', borderRadius: '15px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', boxSizing: 'border-box' };
const loginContainerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '15px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' };
const btnStyle = { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const listStyle = { listStyle: 'none', padding: 0 };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' };
const deleteBtnStyle = { backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' };
const productCardStyle = { textAlign: 'center', border: '1px solid #eee', padding: '10px', borderRadius: '10px' };
const productImgStyle = { width: '100%', height: '80px', objectFit: 'cover', borderRadius: '5px' };

export default Admin;