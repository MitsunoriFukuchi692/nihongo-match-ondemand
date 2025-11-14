import React, { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';

const VoiceChat = ({ socket, isConnected, userRole, otherUserSocketId }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('待機中');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const peerRef = useRef(null);
  const callTimerRef = useRef(null);
  const localStreamRef = useRef(null);
  const recognitionRef = useRef(null);

  // 通話時間のカウント
  useEffect(() => {
    if (!isCallActive) return;

    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isCallActive]);

  // Web Speech API の初期化
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ja-JP';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          transcript += transcriptSegment;
        }
        if (transcript) {
          setAudioTranscript((prev) => {
            const lines = prev.split('\n');
            if (lines.length > 10) {
              lines.shift(); // 古い行を削除
            }
            return [...lines, `[${userRole === 'teacher' ? '講師' : '学習者'}] ${transcript}`].join('\n');
          });
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('🎤 Speech Recognition Error:', event.error);
      };
    }
  }, [userRole]);

  // Socket.io リスナーの登録
  useEffect(() => {
    if (!socket) {
      console.log('❌ ソケットが初期化されていません');
      return;
    }

    console.log('🔌 WebRTC シグナリングリスナーを登録します');

    // オファーを受け取る
    const handleReceiveOffer = async (data) => {
      console.log('📞 オファーを受け取りました:', data);
      try {
        // ローカルストリームを取得
        if (!localStreamRef.current) {
          localStreamRef.current = await getUserMedia();
        }

        // 新しい Peer を作成（answerer）
        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          },
          stream: localStreamRef.current
        });

        peerRef.current = peer;

        peer.on('signal', (signalData) => {
          console.log('📤 アンサーを送信します');
          socket.emit('answer', {
            to: data.from,
            signalData: signalData
          });
        });

        peer.on('stream', (remoteStream) => {
          console.log('✅ リモートストリームを受け取りました');
          // リモートオーディオを自動再生（ブラウザの音量コントロールで聞こえます）
          const audioElement = new Audio();
          audioElement.srcObject = remoteStream;
          audioElement.play().catch((err) => {
            console.error('❌ オーディオ再生エラー:', err);
          });
        });

        peer.on('connect', () => {
          console.log('✅ P2P 接続が確立しました（answerer）');
          setIsCallActive(true);
          setCallStatus('通話中');
          setCallDuration(0);
          setIsMuted(false);
          
          // 音声認識を開始
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        });

        peer.on('error', (err) => {
          console.error('❌ P2P エラー:', err);
          setCallStatus(`エラー: ${err.message}`);
        });

        peer.on('close', () => {
          console.log('❌ P2P 接続が切断されました');
          setIsCallActive(false);
          setCallStatus('切断されました');
          cleanupPeer();
        });

        // オファーをシグナル
        peer.signal(data.signalData);
      } catch (error) {
        console.error('❌ オファー処理エラー:', error);
        setCallStatus('マイクアクセス失敗');
      }
    };

    // アンサーを受け取る
    const handleReceiveAnswer = (data) => {
      console.log('📞 アンサーを受け取りました:', data);
      if (peerRef.current) {
        peerRef.current.signal(data.signalData);
        console.log('✅ アンサーをシグナルしました');
      }
    };

    // ICE Candidate を受け取る
    const handleReceiveIceCandidate = (data) => {
      console.log('🧊 ICE Candidate を受け取りました');
      if (peerRef.current && data.candidate) {
        peerRef.current.addIceCandidate(data.candidate).catch((err) => {
          console.error('❌ ICE Candidate 追加エラー:', err);
        });
      }
    };

    // 通話キャンセル
    const handleCallRejected = () => {
      console.log('❌ 相手が通話を拒否しました');
      cleanupPeer();
      setIsCallActive(false);
      setCallStatus('通話が拒否されました');
    };

    // 相手が切った
    const handleCallEnded = () => {
      console.log('❌ 相手が通話を終了しました');
      cleanupPeer();
      setIsCallActive(false);
      setCallStatus('相手が切断しました');
    };

    socket.on('receive_offer', handleReceiveOffer);
    socket.on('receive_answer', handleReceiveAnswer);
    socket.on('receive_ice_candidate', handleReceiveIceCandidate);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);

    return () => {
      console.log('🔌 WebRTC シグナリングリスナーを削除します');
      socket.off('receive_offer', handleReceiveOffer);
      socket.off('receive_answer', handleReceiveAnswer);
      socket.off('receive_ice_candidate', handleReceiveIceCandidate);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, userRole]);

  // ユーザーメディアを取得
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      console.log('✅ マイクアクセス許可されました');
      console.log('🔊 オーディオトラック:', stream.getAudioTracks());
      return stream;
    } catch (error) {
      console.error('❌ マイクアクセス拒否:', error);
      setCallStatus('マイクアクセスが拒否されました');
      throw error;
    }
  };

  // ミュート機能
  const handleMuteToggle = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      console.log(`🔇 ミュート ${!isMuted ? '有効' : '無効'}`);
    }
  };

  // Peer をクリーンアップ（destroy は呼ばない）
  const cleanupPeer = () => {
    console.log('🧹 Peer と ストリームをクリーンアップ中...');
    
    // 音声認識を停止
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('音声認識停止エラー:', e);
      }
    }

    // ローカルストリームのトラックを停止
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track) => {
          console.log('⏹️ トラック停止:', track.kind, track.label);
          try {
            track.stop();
          } catch (trackError) {
            console.log('トラック停止エラー:', trackError);
          }
        });
      } catch (error) {
        console.log('トラック処理エラー:', error);
      }
      localStreamRef.current = null;
    }

    // Peer は destroy せず、参照をクリアするだけ（ブラウザのGCに任せる）
    peerRef.current = null;

    // タイマーをクリア
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    console.log('✅ クリーンアップ完了');
  };

  // 通話開始
  const handleStartCall = async () => {
    if (!otherUserSocketId) {
      console.log('❌ 相手のSocket ID がありません');
      setCallStatus('相手が見つかりません');
      return;
    }

    try {
      setCallStatus('接続中...');
      
      // ローカルストリームを取得
      if (!localStreamRef.current) {
        localStreamRef.current = await getUserMedia();
      }

      // 新しい Peer を作成（initiator）
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        },
        stream: localStreamRef.current
      });

      peerRef.current = peer;

      peer.on('signal', (signalData) => {
        console.log('📤 オファーを送信します:', otherUserSocketId);
        socket.emit('offer', {
          to: otherUserSocketId,
          signalData: signalData
        });
      });

      peer.on('stream', (remoteStream) => {
        console.log('✅ リモートストリームを受け取りました');
        // リモートオーディオを自動再生
        const audioElement = new Audio();
        audioElement.srcObject = remoteStream;
        audioElement.play().catch((err) => {
          console.error('❌ オーディオ再生エラー:', err);
        });
      });

      peer.on('connect', () => {
        console.log('✅ P2P 接続が確立しました（initiator）');
        setIsCallActive(true);
        setCallStatus('通話中');
        setCallDuration(0);
        setIsMuted(false);
        
        // 音声認識を開始
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      });

      peer.on('error', (err) => {
        console.error('❌ P2P エラー:', err);
        setCallStatus(`エラー: ${err.message}`);
        setIsCallActive(false);
        cleanupPeer();
      });

      peer.on('close', () => {
        console.log('❌ P2P 接続が切断されました');
        setIsCallActive(false);
        setCallStatus('切断されました');
        cleanupPeer();
      });

      // ICE Candidate を送信
      peer.on('icecandidate', (candidate) => {
        console.log('🧊 ICE Candidate を送信します');
        socket.emit('ice_candidate', {
          to: otherUserSocketId,
          candidate: candidate
        });
      });

    } catch (error) {
      console.error('❌ 通話開始エラー:', error);
      setCallStatus('通話開始失敗');
      setIsCallActive(false);
    }
  };

  // 通話拒否
  const handleRejectCall = () => {
    console.log('📞 通話を拒否します');
    socket.emit('reject_call', { to: otherUserSocketId });
    cleanupPeer();
    setIsCallActive(false);
    setCallStatus('通話を拒否しました');
  };

  // 通話終了
  const handleEndCall = () => {
    console.log('📞 通話を終了します');
    try {
      socket.emit('end_call', { to: otherUserSocketId });
      cleanupPeer();
      setIsCallActive(false);
      setCallStatus('通話を終了しました');
      setCallDuration(0);
      setAudioTranscript('');
      setIsMuted(false);
    } catch (error) {
      console.error('❌ 通話終了エラー:', error);
      setCallStatus('終了処理でエラー');
    }
  };

  // 時間フォーマット
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-chat-container" style={{
      border: '1px solid #ddd',
      padding: '15px',
      borderRadius: '8px',
      marginTop: '15px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🎤 音声通話</h3>

      {/* ステータス表示 */}
      <div style={{
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: isCallActive ? '#d4edda' : '#fff3cd',
        border: `1px solid ${isCallActive ? '#c3e6cb' : '#ffeaa7'}`,
        borderRadius: '5px',
        fontSize: '14px',
        color: isCallActive ? '#155724' : '#856404'
      }}>
        <p><strong>ステータス:</strong> {callStatus} {isMuted && '🔇 (ミュート中)'}</p>
        {isCallActive && (
          <p><strong>通話時間:</strong> {formatDuration(callDuration)}</p>
        )}
      </div>

      {/* デバッグ情報 */}
      <div style={{
        padding: '8px',
        marginBottom: '10px',
        backgroundColor: '#e7e7e7',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#333'
      }}>
        <p>📡 Socket 接続: {isConnected ? '✅' : '❌'}</p>
        <p>🎯 相手 ID: {otherUserSocketId ? '✅' : '❌'}</p>
        <p>🎤 通話状態: {isCallActive ? `通話中 ✅ ${isMuted ? '(ミュート)' : ''}` : '待機中'}</p>
      </div>

      {/* ボタングループ */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {!isCallActive ? (
          <>
            <button
              onClick={handleStartCall}
              disabled={!otherUserSocketId || !isConnected}
              style={{
                padding: '10px 15px',
                backgroundColor: otherUserSocketId && isConnected ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: otherUserSocketId && isConnected ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              📞 通話開始
            </button>
            <button
              onClick={handleRejectCall}
              disabled={!otherUserSocketId}
              style={{
                padding: '10px 15px',
                backgroundColor: otherUserSocketId ? '#dc3545' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: otherUserSocketId ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ❌ 拒否
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleMuteToggle}
              style={{
                padding: '10px 15px',
                backgroundColor: isMuted ? '#ff9800' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isMuted ? '🔇 ミュート中' : '🔊 ミュート'}
            </button>
            <button
              onClick={handleEndCall}
              style={{
                padding: '10px 15px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🛑 通話終了
            </button>
          </>
        )}
      </div>

      {/* 音声認識結果の表示 */}
      {isCallActive && audioTranscript && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f0f8ff',
          border: '1px solid #87ceeb',
          borderRadius: '5px',
          marginBottom: '10px',
          maxHeight: '150px',
          overflowY: 'auto',
          fontSize: '12px',
          color: '#333',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          <strong>🗣️ 通話内容：</strong>
          <p style={{ margin: '5px 0 0 0' }}>{audioTranscript}</p>
        </div>
      )}

      {/* 注意事項 */}
      <div style={{
        marginTop: '10px',
        padding: '8px',
        backgroundColor: '#e3f2fd',
        borderLeft: '4px solid #2196F3',
        fontSize: '12px',
        color: '#1565c0'
      }}>
        <p>📌 <strong>注意:</strong> ブラウザの許可で「マイクへのアクセスを許可」を選んでください</p>
        <p>🔇 <strong>ミュート機能:</strong> 通話中は「🔊 ミュート」ボタンで自分の音声をON/OFF切り替えできます</p>
        <p>🗣️ <strong>音声認識:</strong> 通話中は自動で会話内容が字幕として表示されます（日本語のみ）</p>
      </div>
    </div>
  );
};

export default VoiceChat;
