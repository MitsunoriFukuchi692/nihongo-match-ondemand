import React, { useState, useEffect, useRef } from 'react';
import VoiceChat from './VoiceChat';
import EvaluationForm from './EvaluationForm';

const LessonRoom = ({ socket, isConnected, teacher, student, lessonData }) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15分をセコンドで
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLessonActive, setIsLessonActive] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userRole, setUserRole] = useState('student'); // 'teacher' or 'student'
  const [currentUserName, setCurrentUserName] = useState('');
  const [otherUserSocketId, setOtherUserSocketId] = useState(null);
  const [otherUserName, setOtherUserName] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false); // ✅ 評価フォーム表示フラグ
  const socketRef = useRef(socket);

  // socketRefを常に最新に保つ
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // ✅ ユーザーロール判定（lesson_dataのSocket ID比較で確実に判定）
  useEffect(() => {
    if (lessonData && socketRef.current) {
      const mySocketId = socketRef.current.id;
      console.log('🔍 ========== Socket ID 比較 ==========');
      console.log('   自分のSocket ID:', mySocketId);
      console.log('   lesson_data.teacherId:', lessonData.teacherId);
      console.log('   lesson_data.studentId:', lessonData.studentId);
      
      if (mySocketId === lessonData.teacherId) {
        // 自分は講師
        setUserRole('teacher');
        setCurrentUserName(teacher?.teacherName || '講師');
        setOtherUserSocketId(lessonData.studentId);
        setOtherUserName(lessonData.studentName || '学習者');
        console.log('🤖 ユーザーロール: 講師 ✅');
        console.log('👤 相手: 学習者 -', lessonData.studentId);
      } else if (mySocketId === lessonData.studentId) {
        // 自分は学習者
        setUserRole('student');
        setCurrentUserName(student?.name || '学習者');
        setOtherUserSocketId(lessonData.teacherId);
        setOtherUserName(lessonData.teacherName || '講師');
        console.log('🤖 ユーザーロール: 学習者 ✅');
        console.log('👤 相手: 講師 -', lessonData.teacherId);
      }
      console.log('');
    }
  }, [lessonData, teacher, student]);

  // 15分タイマー
  useEffect(() => {
    if (!isLessonActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsLessonActive(false);
          setMessage('✅ レッスン時間が終了しました');
          setMessageType('success');
          socketRef.current?.emit('lesson_ended', {});
          console.log('⏰ レッスン時間が終了しました');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLessonActive]);

  // Socket.io チャットリスナー
  useEffect(() => {
    if (!socketRef.current) {
      console.log('❌ ソケットが初期化されていません');
      return;
    }

    console.log('🔌 チャットリスナーを登録します');

    const handleReceiveMessage = (data) => {
      console.log('📨 メッセージ受け取り:', data);
      
      setMessages((prev) => {
        console.log('📝 メッセージ追加前:', prev.length);
        const newMessages = [...prev, { ...data, isSent: false }];
        console.log('📝 メッセージ追加後:', newMessages.length);
        return newMessages;
      });
    };

    const handleLessonEndedByOther = (data) => {
      setIsLessonActive(false);
      setMessage('❌ 相手がレッスンを終了しました');
      setMessageType('info');
    };

    socketRef.current.on('receive_message', handleReceiveMessage);
    socketRef.current.on('lesson_ended_by_other', handleLessonEndedByOther);

    // クリーンアップ
    return () => {
      console.log('🔌 チャットリスナーを削除します');
      socketRef.current?.off('receive_message', handleReceiveMessage);
      socketRef.current?.off('lesson_ended_by_other', handleLessonEndedByOther);
    };
  }, []);

  // メッセージ送信
  const handleSendMessage = () => {
  if (!inputMessage.trim()) return;

  const messageData = {
    sender: currentUserName,
    text: inputMessage,
    timestamp: new Date().toLocaleTimeString('ja-JP')
  };

  console.log('📤 メッセージ送信:', messageData);

  // ソケットで送信（サーバー経由で相手に送信される）
  socketRef.current?.emit('send_message', messageData);

  setInputMessage('');
};

  // レッスン終了
  const handleEndLesson = () => {
    setIsLessonActive(false);
    setMessage('✅ レッスンを終了しました');
    setMessageType('success');
    socketRef.current?.emit('lesson_ended', {});
  };

  // ✅ 評価送信完了時の処理
  const handleEvaluationSubmitted = () => {
    console.log('🎉 評価が送信されました');
    setMessage('✅ 評価ありがとうございました。3秒後にホームに戻ります...');
    setMessageType('success');
    
    // 3秒後にホームに戻す
    setTimeout(() => {
      console.log('🏠 ホームに戻ります...');
      // React Router で戻す場合は navigate を使用
      // navigate('/');
      
      // または URL リダイレクト
      window.location.href = '/';
    }, 3000);
  };

  // 時間フォーマット
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="lesson-room">
      <h2>🎓 レッスン実施中</h2>

      {/* メッセージ表示 */}
      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      {/* ✅ レッスン終了後に評価フォームを表示 */}
      {!isLessonActive && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #4CAF50'
        }}>
          <EvaluationForm
            socket={socketRef.current}
            userRole={userRole}
            currentUserName={currentUserName}
            otherUserSocketId={otherUserSocketId}
            otherUserName={otherUserName}
            onSubmit={handleEvaluationSubmitted}
          />
        </div>
      )}

      {/* デバッグ情報 */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px', 
        marginBottom: '10px',
        fontSize: '12px',
        color: '#666'
      }}>
        <p>🔧 デバッグ情報:</p>
        <p>ユーザーロール: {userRole}</p>
        <p>接続状態: {isConnected ? '✅' : '❌'}</p>
        <p>相手のSocket ID: {otherUserSocketId || '⏳ 待機中...'}</p>
        <p>相手の名前: {otherUserName || '不明'}</p>
        <p>レッスン状態: {isLessonActive ? '実施中' : '終了'}</p>
      </div>

      <div className="lesson-container">
        {/* 左側：講師情報 + タイマー + 音声通話 */}
        <div className="lesson-left">
          <div className="teacher-info">
            <h3>👨‍🏫 講師情報</h3>
            {teacher ? (
              <div className="info-card">
                <p>
                  <strong>名前:</strong> {teacher.teacherName}
                </p>
                <p>
                  <strong>レベル:</strong> {teacher.proficiency || 'beginner'}
                </p>
                <p>
                  <strong>時間帯:</strong> {teacher.timeSlots || 'morning'}
                </p>
              </div>
            ) : (
              <p>講師情報なし</p>
            )}
          </div>

          {/* タイマー */}
          <div className="timer-section">
            <h3>⏱️ 残り時間</h3>
            <div className={`timer ${timeLeft < 300 ? 'warning' : ''}`}>
              {formatTime(timeLeft)}
            </div>
            <p className="timer-note">
              {isLessonActive ? '会話中...' : 'レッスン終了'}
            </p>
          </div>

          {/* 音声通話コンポーネント（レッスン中のみ表示） */}
          {isLessonActive && (
            <VoiceChat
              socket={socketRef.current}
              isConnected={isConnected}
              userRole={userRole}
              otherUserSocketId={otherUserSocketId}
            />
          )}

          {/* レッスン終了ボタン（レッスン中のみ表示） */}
          {isLessonActive && (
            <button
              className="btn btn-danger"
              onClick={handleEndLesson}
            >
              🛑 レッスンを終了
            </button>
          )}
        </div>

        {/* 右側：チャット */}
        <div className="lesson-right">
          <div className="chat-container">
            <h3>💬 チャット</h3>

            {/* メッセージ表示エリア */}
            <div className="messages-area">
              {messages.length === 0 ? (
                <p className="empty-message">
                  メッセージはまだありません
                </p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message-item ${
                      msg.isSent ? 'sent' : 'received'
                    }`}
                  >
                    <div className="message-content">
                      <p className="message-sender">
                        {msg.sender}
                      </p>
                      <p className="message-text">{msg.text}</p>
                      <p className="message-time">
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* メッセージ入力エリア（レッスン中のみ表示） */}
            {isLessonActive && (
              <div className="message-input-area">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  placeholder="メッセージを入力..."
                  disabled={!isConnected}
                />
                <button
                  className="btn btn-send"
                  onClick={handleSendMessage}
                  disabled={!isConnected || !inputMessage.trim()}
                >
                  📤 送信
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonRoom;
