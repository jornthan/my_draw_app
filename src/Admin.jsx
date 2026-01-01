import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function Admin() {
  // --- 1. 관리자 인증 상태 ---
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  // 💡 여기에 원하는 관리자 비밀번호를 설정하세요!
  const MASTER_ADMIN_KEY = "화평부뽀에버"; 

  // --- 2. 데이터 관리 상태 ---
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [products, setProducts] = useState([]);
  const [keys, setKeys] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [newKey, setNewKey] = useState('');

  // 인증이 완료된 후에만 데이터를 불러옵니다.
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchProducts();
      fetchKeys();
    }
  }, [isAdminAuthenticated]);

  async function fetchProducts() {
    // created_at 컬럼이 없을 경우를 대비해 기본 조회만 수행합니다.
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
  }

  async function fetchKeys() {
    const { data } = await supabase.from('access_keys').select('*');
    setKeys(data || []);
  }

  // 관리자 로그인 함수
  const handleAdminLogin = () => {
    if (adminPassword === MASTER_ADMIN_KEY) {
      setIsAdminAuthenticated(true);
    } else {
      alert("관리자 암호가 틀렸습니다!");
      setAdminPassword('');
    }
  };

  // --- 기능 함수들 ---
  async function addProduct() {
    if (!title || !file) return alert('사진과 제목을 모두 입력해주세요!');
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product_image').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product_image').getPublicUrl(fileName);
      await supabase.from('products').insert([{ title, image_url: publicUrl }]);
      setTitle(''); setFile(null); fetchProducts();
      alert('상품이 등록되었습니다!');
    } catch (e) { alert(e.message); } finally { setUploading(false); }
  }

  async function addKey() {
    if (!newKey) return;
    const { error } = await supabase.from('access_keys').insert([{ code: newKey }]);
    if (error) {
        alert('추가 실패: ' + error.message);
    } else {
        setNewKey(''); fetchKeys();
    }
  }

  async function deleteProduct(id) {
    if (window.confirm('상품을 삭제하시겠습니까?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  }

  async function deleteKey(id) {
    await supabase.from('access_keys').delete().eq('id', id);
    fetchKeys();
  }

  // --- [로그인 화면] 비밀번호가 가시적으로 보이는 설정 ---
  if (!isAdminAuthenticated) {
    return (
      <div style={loginOverlayStyle}>
        <div style={loginBoxStyle}>
          <h2 style={{ marginBottom: '10px' }}>🔐 관리자 모드</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>비밀번호를 입력하세요.</p>
          <input 
            type="text" // 비밀번호를 보이게 하기 위해 text 타입 사용
            placeholder="관리자 비밀번호" 
            value={adminPassword} 
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            style={adminInputStyle}
          />
          <button onClick={handleAdminLogin} style={adminBtnStyle}>입장하기</button>
        </div>
      </div>
    );
  }

  // --- [로그인 후] 관리자 대시보드 화면 ---
  return (
    <div className="container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>관리자 대시보드 ⚙️</h1>
        <button onClick={() => setIsAdminAuthenticated(false)} style={logoutBtnStyle}>로그아웃</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* 암호키 관리 섹션 */}
        <div style={cardStyle}>
          <h3>🔑 암호키 생성/목록</h3>
          <p style={{ fontSize: '13px', color: '#888' }}>추첨 시 한 번 사용된 키는 목록에서 자동 삭제됩니다.</p>
          <div style={{ display: 'flex', gap: '5px', margin: '15px 0' }}>
            <input 
              value={newKey} 
              onChange={(e) => setNewKey(e.target.value)} 
              placeholder="새로운 암호 입력" 
              style={miniInputStyle} 
            />
            <button onClick={addKey} style={miniBtnStyle}>추가</button>
          </div>
          <div style={listContainerStyle}>
            {keys.length === 0 ? <p style={{ textAlign: 'center', color: '#ccc' }}>등록된 암호가 없습니다.</p> : null}
            {keys.map(k => (
              <div key={k.id} style={listItemStyle}>
                <span style={{ fontWeight: 'bold' }}>{k.code}</span>
                <button onClick={() => deleteKey(k.id)} style={delBtnStyle}>삭제</button>
              </div>
            ))}
          </div>
        </div>

        {/* 상품 등록 섹션 */}
        <div style={cardStyle}>
          <h3>🎁 추첨 상품 등록</h3>
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '5px' }}>상품 사진 업로드:</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ marginBottom: '15px', width: '100%' }} />
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="상품 이름 입력 (예: 문화상품권 1만원)" 
              style={{ ...miniInputStyle, marginBottom: '10px', display: 'block', width: '100%', boxSizing: 'border-box' }} 
            />
            <button 
              onClick={addProduct} 
              disabled={uploading} 
              style={{ ...miniBtnStyle, width: '100%', backgroundColor: '#ff4757', padding: '12px' }}
            >
              {uploading ? '업로드 중...' : '상품 데이터 저장'}
            </button>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: '50px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>전체 상품 목록 ({products.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {products.map(p => (
          <div key={p.id} style={itemBoxStyle}>
            <img src={p.image_url} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} alt={p.title} />
            <p style={{ margin: '10px 0', fontWeight: 'bold' }}>{p.title}</p>
            <button onClick={() => deleteProduct(p.id)} style={{ ...delBtnStyle, color: '#ff4757', border: '1px solid #ff4757', padding: '3px 8px', borderRadius: '4px' }}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 스타일 정의 ---
const loginOverlayStyle = { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' };
const loginBoxStyle = { padding: '40px', background: '#fff', borderRadius: '15px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', textAlign: 'center', width: '320px' };
const adminInputStyle = { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '8px', border: '2px solid #ddd', boxSizing: 'border-box', textAlign: 'center', fontSize: '18px' };
const adminBtnStyle = { width: '100%', padding: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };
const logoutBtnStyle = { padding: '8px 15px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px' };
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const miniInputStyle = { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' };
const miniBtnStyle = { padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const listContainerStyle = { maxHeight: '300px', overflowY: 'auto', borderTop: '1px solid #f0f0f0', marginTop: '10px' };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px 5px', borderBottom: '1px solid #f9f9f9', alignItems: 'center' };
const delBtnStyle = { color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' };
const itemBoxStyle = { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #f0f0f0' };

export default Admin;