import React, { useState, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';
import TeacherList from './components/TeacherList';
import TeacherRegistration from './components/TeacherRegistration';
import LearnerRegistration from './components/LearnerRegistration';
import TeacherDashboard from './components/TeacherDashboard';
import LessonRoom from './components/LessonRoom';
import TeacherProfile from './components/TeacherProfile';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import Login from './components/Login';
import Register from './components/Register';
import Contact from './components/Contact';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [matchedTeacher, setMatchedTeacher] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authPage, setAuthPage] = useState('login');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      console.log('✅ 保存されたユーザー情報を読み込みました');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setCurrentPage('home');
    console.log('🚪 ログアウトしました');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');

    if (role === 'teacher') {
      setCurrentPage('teacher-dashboard');
      console.log('🔗 URLパラメータから: 講師モードを起動');
    } else if (role === 'student') {
      setCurrentPage('home');
      console.log('🔗 URLパラメータから: ホームページを起動');
    }
  }, []);

  useEffect(() => {
    console.log('📡 Socket.io 接続開始...');
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    const newSocket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ バックエンドに接続しました');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ バックエンドから切断されました');
      setIsConnected(false);
    });

    newSocket.on('teachers_list', (data) => {
      console.log('👨‍🏫 講師リスト:', data);
      setTeachers(data);
    });

    newSocket.on('teachers_list_updated', (data) => {
      console.log('📄 講師リストが更新されました:', data);
      setTeachers(data);
    });

    newSocket.on('lesson_data', (data) => {
      console.log('📋 lesson_data:', data);
      setLessonData(data);
    });

    newSocket.on('lesson_matched', (data) => {
      console.log('✅ レッスンマッチング:', data);
      setMatchedTeacher(data);
    });

    setSocket(newSocket);

    return () => {
      console.log('📡 Socket.io を切断します');
      newSocket.close();
    };
  }, []);

  const addTeacher = (teacher) => {
    const existingTeachers = teachers || [];
    const newTeachers = [...existingTeachers, { ...teacher, id: Date.now() }];
    setTeachers(newTeachers);
    localStorage.setItem('teachers', JSON.stringify(newTeachers));
    console.log('✅ 講師を追加しました:', newTeachers);
    setCurrentPage('home');
  };

  const addLearner = (learner) => {
    console.log('✅ 学習者を登録しました:', learner);
    setTimeout(() => {
      console.log('🏠 ホームページに自動遷移します');
      setCurrentPage('home');
    }, 2000);
  };

  const handleStudentMatched = (matchedData, studentData) => {
    console.log('🎓 学習者がマッチングされました:', matchedData);
    setCurrentPage('lesson-room');
    setMatchedTeacher(matchedData);
    setStudentInfo(studentData);
    setTeacherInfo(null);
    setLessonData(null);
  };

  const handleTeacherMatched = (matchedData, teacher) => {
    console.log('👨‍🏫 講師がマッチングされました:', matchedData);
    setCurrentPage('lesson-room');
    setMatchedTeacher(matchedData);
    setTeacherInfo(teacher);
    setStudentInfo(null);
    setLessonData(null);
  };

  const handleViewTeacherProfile = (teacherId) => {
    console.log('📄 講師詳細ページに遷移:', teacherId);
    setSelectedTeacherId(teacherId);
    setCurrentPage('teacher-profile');
  };

  const handleBackToTeacherList = () => {
    console.log('↑ 講師リストに戻ります');
    setSelectedTeacherId(null);
    setCurrentPage('home');
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🌸 日本語会話マッチング</h1>
        <nav className="nav">
          {currentUser ? (
            <>
              <button 
                className={currentPage === 'home' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('home')}
              >
                ホーム
              </button>
              <button 
                className={currentPage === 'teacher-dashboard' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('teacher-dashboard')}
              >
                講師用
              </button>
              {matchedTeacher && (
                <button 
                  className={currentPage === 'lesson-room' ? 'nav-btn active' : 'nav-btn'}
                  onClick={() => setCurrentPage('lesson-room')}
                >
                  🎓 レッスン中
                </button>
              )}
              <button 
                className={currentPage === 'teacher-register' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('teacher-register')}
              >
                講師登録
              </button>
              <button 
                className={currentPage === 'learner-register' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('learner-register')}
              >
                学習者登録
              </button>
              <button 
                className={currentPage === 'terms' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('terms')}
              >
                📋 利用規約
              </button>
              <button 
                className={currentPage === 'privacy' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('privacy')}
              >
                🔒 プライバシー
              </button>
              <button 
                className={currentPage === 'contact' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setCurrentPage('contact')}
              >
                📧 お問い合わせ
              </button>
            </>
          ) : (
            <>
              {authPage === 'login' && (
                <button 
                  className="nav-btn"
                  onClick={() => setAuthPage('register')}
                >
                  📝 新規登録
                </button>
              )}
              {authPage === 'register' && (
                <button 
                  className="nav-btn"
                  onClick={() => setAuthPage('login')}
                >
                  🔐 ログイン
                </button>
              )}
            </>
          )}
        </nav>

        {currentUser && (
          <div className="user-section">
            <span>👤 {currentUser.name}</span>
            <button 
              className="logout-button"
              onClick={handleLogout}
            >
              🚪 ログアウト
            </button>
          </div>
        )}
      </header>

      <main className="main-content">
        {!currentUser ? (
          <>
            {authPage === 'login' && (
              <Login onLoginSuccess={setCurrentUser} />
            )}
            {authPage === 'register' && (
              <Register onRegisterSuccess={(user) => {
                setCurrentUser(user);
                setAuthPage('login');
              }} />
            )}
          </>
        ) : (
          <>
            {/* ホーム - 講師リスト */}
            {currentPage === 'home' && socket && (
              <TeacherList 
                teachers={teachers} 
                socket={socket} 
                isConnected={isConnected}
                onViewProfile={handleViewTeacherProfile}
                onMatched={handleStudentMatched}
              />
            )}

            {/* 講師詳細ページ */}
            {currentPage === 'teacher-profile' && socket && selectedTeacherId && (
              <TeacherProfile
                socket={socket}
                teacherId={selectedTeacherId}
                onBack={handleBackToTeacherList}
              />
            )}

            {/* 講師ダッシュボード */}
            {currentPage === 'teacher-dashboard' && socket && (
              <TeacherDashboard 
                socket={socket} 
                isConnected={isConnected}
                onMatched={handleTeacherMatched}
              />
            )}

            {/* 講師登録 */}
            {currentPage === 'teacher-register' && (
              <TeacherRegistration onSubmit={addTeacher} />
            )}

            {/* レッスンルーム */}
            {currentPage === 'lesson-room' && socket && matchedTeacher && (
              <LessonRoom 
                socket={socket} 
                isConnected={isConnected}
                teacher={matchedTeacher}
                student={studentInfo || teacherInfo}
                lessonData={lessonData}
              />
            )}

            {/* 学習者登録 */}
            {currentPage === 'learner-register' && (
              <LearnerRegistration onSubmit={addLearner} />
            )}

            {/* 利用規約ページ */}
            {currentPage === 'terms' && (
              <TermsOfService />
            )}

            {/* プライバシーポリシーページ */}
            {currentPage === 'privacy' && (
              <PrivacyPolicy />
            )}

            {/* お問い合わせページ */}
            {currentPage === 'contact' && (
              <Contact />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
