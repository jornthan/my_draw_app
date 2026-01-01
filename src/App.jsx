import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MainPage from './MainPage'; // Home 대신 MainPage를 불러옵니다
import Admin from './Admin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <nav className="navbar" style={{display: 'flex', justifyContent: 'flex-end', padding: '10px'}}>
          <Link to="/admin" className="admin-btn">관리자 모드</Link>
        </nav>

        <Routes>
          <Route path="/" element={<MainPage />} /> 
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;