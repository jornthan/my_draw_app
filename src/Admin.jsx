import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function Admin() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 데이터 상태 관리
  const [newKey, setNewKey] = useState('');
  const [keyList, setKeyList] = useState([]);
  const [products, setProducts] = useState([]);
  
  // 상품 등록 관련 상태
  const [productTitle, setProductTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // 로그인 성공 시 데이터 로드
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
    if (password === '화평부뽀에버') { // 실제 비밀번호로 수정하세요
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  // --- [핵심] 파일 업로드 및 상품 등록 ---
  const handleAddProduct = async () => {
    if (!productTitle || !imageFile) return alert('상품명과 이미지를 모두 선택해주세요!');
    
    setIsUploading(true);
    try {
      // 1. 파일명 정제: 공백/한글 에러 방지를 위해 숫자로 변환
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // 2. Storage 업로드 (버킷 이름: product_image)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product_image')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // 3. Public URL 추출
      const { data: { publicUrl } } = supabase.storage
        .from('product_image')
        .getPublicUrl(fileName);

      // 4. DB 저장
      const { error: dbError } = await supabase
        .from('products')
        .insert([{ title: productTitle, image_url: publicUrl }]);

      if (dbError) throw dbError;

      alert('상품이 성공적으로 등록되었습니다!');
      setProductTitle('');
      setImageFile(null);
      fetchProducts();
    } catch (error) {
      console.error('Registration Error:', error);
      alert(`등록 실패: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteKey = async (id) => {
    await supabase.from('access_keys').delete().eq('id', id);
    fetchKeys();
  };

  const deleteProduct = async (id) => {
    if(!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  // 로그인 화면
  if (!isLoggedIn) {
    return (
      <div style={loginContainerStyle}>
        <h2>관리자 로그인</h2>
        <input 
          type="text" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="비밀번호 입력"
          style={inputStyle}
        />
        <button onClick={handleLogin} style={btnStyle}>로그인</button>
      </div>
    );
  }

  // 관리자 대시보드 화면
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>🛠 관리자 대시보드</h1>
      
      <div style={flexContainerStyle}>
        {/* 암호키 관리 섹션 */}
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
              if(!newKey) return;
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

        {/* 상품 등록 섹션 */}
        <div style={sectionStyle}>
          <h2>🎁 추첨 상품 등록</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
            <input 
              style={inputStyle} 
              value={productTitle} 
              onChange={(e) => setProductTitle(e.target.value)} 
              placeholder="상품명 입력"
            />
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ fontSize: '14px', padding: '10px', border: '1px dashed #ccc' }}
            />
            <button 
              onClick={handleAddProduct} 
              disabled={isUploading}
              style={{ ...btnStyle, backgroundColor: isUploading ? '#ccc' : '#4CAF50' }}
            >
              {isUploading ? '업로드 중...' : '상품 등록하기'}
            </button>
          </div>
          
          <div style={gridStyle}>
            {products.map(p => (
              <div key={p.id} style={productCardStyle}>
                <img src={p.image_url} alt={p.title} style={productImgStyle} />
                <p style={{ fontWeight: 'bold', fontSize: '13px', margin: '5px 0' }}>{p.title}</p>
                <button onClick={() => deleteProduct(p.id)} style={deleteBtnStyle}>삭제</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 스타일 설정
const flexContainerStyle = { display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' };
const sectionStyle = { flex: '1 1 400px', minWidth: '300px', padding: '25px', borderRadius: '15px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', boxSizing: 'border-box' };
const loginContainerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '15px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' };
const btnStyle = { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const listStyle = { listStyle: 'none', padding: 0 };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center' };
const deleteBtnStyle = { backgroundColor: '#ff4757', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px' };
const productCardStyle = { textAlign: 'center', border: '1px solid #eee', padding: '10px', borderRadius: '10px', backgroundColor: '#fff' };
const productImgStyle = { width: '100%', height: '90px', objectFit: 'cover', borderRadius: '5px' };

export default Admin;