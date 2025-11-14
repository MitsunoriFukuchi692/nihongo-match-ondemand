const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// ミドルウェア
app.use(cors());
app.use(express.json());

// ポート設定
const PORT = process.env.PORT || 5000;

// ===== データ管理 =====
// 教師のオンライン状態
const onlineTeachers = new Map(); // { teacherId: { name, email, proficiency, ... } }

// 待機中の学習者キュー
const waitingStudents = []; // [ { studentId, studentName, wantedLevel, ... } ]

// アクティブなレッスン
const activeLessons = new Map(); // { lessonId: { teacherId, studentId, startTime, ... } }

// ===== Socket.io イベントハンドラー =====

io.on('connection', (socket) => {
  console.log(`✅ クライアント接続: ${socket.id}`);

// 接続時に現在のオンライン講師一覧を送信
  socket.emit('teachers_list_updated', Array.from(onlineTeachers.values()));

  // ===== 教師関連 =====

  // 教師がオンラインになった
  socket.on('teacher_online', (teacherData) => {
    console.log(`📚 教師がオンラインになりました: ${teacherData.name}`);
    
    const teacherId = socket.id;
    onlineTeachers.set(teacherId, {
      ...teacherData,
      socketId: socket.id,
      onlineAt: new Date(),
    });

    // すべてのクライアントに教師一覧を更新
    io.emit('teachers_list_updated', Array.from(onlineTeachers.values()));

    // 教師に待機キュー内の学習者を通知
    const queueForThisTeacher = waitingStudents.filter(
      (s) => s.wantedTeacherId === teacherId
    );

    if (queueForThisTeacher.length > 0) {
      console.log(`📊 教師 ${teacherData.name} に待機中の学習者 ${queueForThisTeacher.length}名を通知`);
      queueForThisTeacher.forEach((student, index) => {
        socket.emit('student_matched', {
          lessonId: `queued_${student.studentId}`,
          studentName: student.studentName,
          studentLevel: student.studentLevel,
          lessonTopic: student.lessonTopic || '待機中',
          isQueued: true,
          queuePosition: index + 1,
        });
      });
    }
  });

  // 教師がオフラインになった
  socket.on('teacher_offline', () => {
    console.log(`🚪 教師がオフラインになりました: ${socket.id}`);
    onlineTeachers.delete(socket.id);

    // すべてのクライアントに教師一覧を更新
    io.emit('teachers_list_updated', Array.from(onlineTeachers.values()));
  });

  // ===== 学習者関連 =====

  // 学習者が「今すぐ開始」をリクエスト
  socket.on('request_lesson', (studentData) => {
    console.log(`🎓 学習者がレッスンをリクエストしました: ${studentData.name}`);

// ⬇️ ここにデバッグ情報を追加
    console.log(`📍 選択された講師ID: ${studentData.selectedTeacherId}`);
    console.log(`📍 オンライン講師一覧: ${Array.from(onlineTeachers.keys()).join(', ')}`);

    const teacherId = studentData.selectedTeacherId;
    const teacher = onlineTeachers.get(teacherId);

    if (!teacher) {
      socket.emit('error', { message: '申し訳ありません。その教師は現在オフラインです。' });
      return;
    }

    // 教師が空いているか確認
    const hasActiveLesson = Array.from(activeLessons.values()).some(
      (lesson) => lesson.teacherId === teacherId
    );

    if (hasActiveLesson) {
      // 教師が忙しい場合は待機キューに追加
      console.log(`⏳ 教師は忙しいです。学習者をキューに追加します。`);
      
      const newQueuedStudent = {
        studentId: socket.id,
        studentName: studentData.name,
        studentLevel: studentData.proficiencyLevel,
        lessonTopic: studentData.lessonTopic,
        wantedTeacherId: teacherId,
        requestedAt: new Date(),
      };

      waitingStudents.push(newQueuedStudent);

      socket.emit('queued', {
        message: '申し訳ありません。この教師は現在レッスン中です。',
        queuePosition: waitingStudents.length,
        estimatedWaitTime: '15分程度',
      });

      // 学習者に待機状態を通知
      io.emit('queue_status_updated', {
        totalWaiting: waitingStudents.length,
      });

      // 教師に新しい待機学習者を通知
      io.to(teacherId).emit('student_matched', {
        lessonId: `queued_${socket.id}`,
        studentName: studentData.name,
        studentLevel: studentData.proficiencyLevel,
        lessonTopic: studentData.lessonTopic || '待機中',
        isQueued: true,
        queuePosition: waitingStudents.length,
      });

      return;
    }

    // マッチング成功！
    const lessonId = `lesson_${Date.now()}`;
    const lesson = {
      lessonId,
      teacherId,
      studentId: socket.id,
      studentName: studentData.name,
      teacherName: teacher.name,
      studentLevel: studentData.proficiencyLevel,
      lessonTopic: studentData.lessonTopic,
      startTime: new Date(),
      duration: 15, // 分
    };

    activeLessons.set(lessonId, lesson);

    console.log(`✅ マッチング成功！レッスン開始: ${lessonId}`);
    console.log(`   📊 詳細情報:`, lesson);

    // 学習者に通知
    socket.emit('lesson_matched', {
      lessonId,
      teacherName: teacher.name,
      message: 'マッチングしました！レッスンを開始します。',
    });

    // 教師に通知
    io.to(teacherId).emit('student_matched', {
      lessonId,
      studentName: studentData.name,
      studentLevel: studentData.proficiencyLevel,
      lessonTopic: studentData.lessonTopic,
    });

    // 両方にレッスンデータを送信（Socket ID交換用）
    console.log('📤 lesson_data送信:', { lessonId, teacherId, studentId: socket.id });
    socket.emit('lesson_data', {
      lessonId,
      teacherId,
      studentId: socket.id,
    });

    io.to(teacherId).emit('lesson_data', {
      lessonId,
      teacherId,
      studentId: socket.id,
    });

    // すべてのクライアントに統計情報を更新
    broadcastStats();
  });

  // ===== WebRTC シグナリング =====

  // オファーを受け取る
  socket.on('offer', (data) => {
    console.log('📞 offer を受け取りました');
    io.to(data.to).emit('receive_offer', {
      from: socket.id,
      signalData: data.signalData
    });
  });

  // アンサーを受け取る
  socket.on('answer', (data) => {
    console.log('📞 answer を受け取りました');
    io.to(data.to).emit('receive_answer', {
      from: socket.id,
      signalData: data.signalData
    });
  });

  // ICE Candidate を受け取る
  socket.on('ice_candidate', (data) => {
    console.log('🧊 ice_candidate を受け取りました');
    io.to(data.to).emit('receive_ice_candidate', {
      from: socket.id,
      candidate: data.candidate
    });
  });

  // 通話拒否
  socket.on('reject_call', (data) => {
    console.log('❌ 通話拒否');
    io.to(data.to).emit('call_rejected', {
      from: socket.id
    });
  });

  // 通話終了
  socket.on('end_call', (data) => {
    console.log('🛑 通話終了');
    io.to(data.to).emit('call_ended', {
      from: socket.id
    });
  });

  // 講師が学習者リクエストを承認
  socket.on('accept_request', (data) => {
    console.log(`✅ 講師がリクエストを承認しました:`, data);
    const { studentId, lessonId } = data;

    // 待機キューから削除
    const queueIndex = waitingStudents.findIndex((s) => s.studentId === studentId);
    if (queueIndex !== -1) {
      waitingStudents.splice(queueIndex, 1);
    }

    // 学習者にマッチング成功を通知
    io.to(studentId).emit('lesson_matched', {
      lessonId,
      teacherName: onlineTeachers.get(socket.id)?.name || '講師',
      message: 'マッチングしました！レッスンを開始します。',
    });
  });

  // ===== チャット関連 =====

  // メッセージ送信
  socket.on('send_message', (messageData) => {
    console.log(`\n💬 ========== メッセージ受信 ==========`);
    console.log(`📤 送信者: ${messageData.sender}`);
    console.log(`📝 内容: ${messageData.text}`);
    console.log(`🔌 Socket ID: ${socket.id}`);
    
    // アクティブなレッスンを検索
    console.log(`\n🔍 アクティブなレッスンを検索中...`);
    console.log(`   現在のアクティブレッスン数: ${activeLessons.size}`);
    
    let foundLesson = null;
    for (const [lessonId, lesson] of activeLessons.entries()) {
      console.log(`   📌 レッスンID: ${lessonId}`);
      console.log(`      教師ID: ${lesson.teacherId}`);
      console.log(`      学習者ID: ${lesson.studentId}`);
      
      if (lesson.studentId === socket.id || lesson.teacherId === socket.id) {
        foundLesson = lesson;
        console.log(`      ✅ マッチ！`);
        break;
      }
    }

    if (!foundLesson) {
      console.log(`❌ アクティブなレッスンが見つかりません`);
      console.log(`   このクライアント(${socket.id})に対応するレッスンがありません\n`);
      return;
    }

    console.log(`\n✅ レッスン見つかった:`);
    console.log(`   レッスンID: ${foundLesson.lessonId}`);
    console.log(`   教師ID: ${foundLesson.teacherId}`);
    console.log(`   学習者ID: ${foundLesson.studentId}`);

    // メッセージを相手側に送信
    if (foundLesson.studentId === socket.id) {
      // 学習者が送信 → 講師に送信
      console.log(`\n📬 学習者からのメッセージなので、講師に送信します`);
      console.log(`   講師への送信先: ${foundLesson.teacherId}`);
      io.to(foundLesson.teacherId).emit('receive_message', messageData);
      console.log(`✅ 講師に送信完了\n`);
    } else if (foundLesson.teacherId === socket.id) {
      // 講師が送信 → 学習者に送信
      console.log(`\n📬 講師からのメッセージなので、学習者に送信します`);
      console.log(`   学習者への送信先: ${foundLesson.studentId}`);
      io.to(foundLesson.studentId).emit('receive_message', messageData);
      console.log(`✅ 学習者に送信完了\n`);
    } else {
      console.log(`❌ エラー: どちらでもありません\n`);
    }
  });

  // ===== 音声通話関連（WebRTC シグナリング） =====

  // WebRTC シグナルデータをリレー
  socket.on('voice_signal', (data) => {
    console.log(`\n🎙️ ========== 音声シグナル受信 ==========`);
    console.log(`📤 送信元: ${data.from}`);
    console.log(`📍 送信先: ${data.to}`);
    console.log(`📡 シグナル種類: ${data.data.type}`);

    // アクティブなレッスンをチェック
    let foundLesson = null;
    for (const [lessonId, lesson] of activeLessons.entries()) {
      if (
        (lesson.teacherId === data.from && lesson.studentId === data.to) ||
        (lesson.studentId === data.from && lesson.teacherId === data.to)
      ) {
        foundLesson = lesson;
        break;
      }
    }

    if (!foundLesson) {
      console.log(`❌ アクティブなレッスンが見つかりません\n`);
      return;
    }

    console.log(`✅ レッスンが見つかりました。シグナルをリレーします`);
    console.log(`   レッスンID: ${foundLesson.lessonId}\n`);

    // シグナルを相手側に送信
    io.to(data.to).emit('voice_signal', data.data);
  });

  // ===== レッスン関連 =====

  // レッスン終了
  socket.on('lesson_ended', (data) => {
    console.log(`🏁 レッスン終了要求:`, data);
    
    // アクティブなレッスンをクリア
    for (const [lessonId, lesson] of activeLessons.entries()) {
      if (lesson.studentId === socket.id || lesson.teacherId === socket.id) {
        console.log(`✅ レッスン完了: ${lessonId}`);
        activeLessons.delete(lessonId);

        // 待機キューをチェック
        const nextStudent = waitingStudents.find(
          (s) => s.wantedTeacherId === lesson.teacherId
        );

        if (nextStudent) {
          console.log(`⏳ 次の学習者を処理します`);
          waitingStudents.splice(waitingStudents.indexOf(nextStudent), 1);

          const newLessonId = `lesson_${Date.now()}`;
          const newLesson = {
            lessonId: newLessonId,
            teacherId: lesson.teacherId,
            studentId: nextStudent.studentId,
            studentName: nextStudent.studentName,
            teacherName: lesson.teacherName,
            studentLevel: nextStudent.studentLevel,
            lessonTopic: nextStudent.lessonTopic,
            startTime: new Date(),
            duration: 15,
          };

          activeLessons.set(newLessonId, newLesson);

          // 次の学習者に通知
          io.to(nextStudent.studentId).emit('lesson_matched', {
            lessonId: newLessonId,
            teacherName: lesson.teacherName,
            message: 'マッチングしました！レッスンを開始します。',
          });

          // 教師に通知
          io.to(lesson.teacherId).emit('student_matched', {
            lessonId: newLessonId,
            studentName: nextStudent.studentName,
            studentLevel: nextStudent.studentLevel,
            lessonTopic: nextStudent.lessonTopic,
          });
        }

        break;
      }
    }

    // すべてのクライアントに統計情報を更新
    broadcastStats();
  });

  // キャンセルリクエスト
  socket.on('cancel_request', (data) => {
    console.log(`❌ キャンセルリクエスト: ${socket.id}`);
    
    // 待機キューから削除
    const index = waitingStudents.findIndex((s) => s.studentId === socket.id);
    if (index !== -1) {
      waitingStudents.splice(index, 1);
    }

    broadcastStats();
  });

  // ===== 接続切断 =====

  socket.on('disconnect', () => {
    console.log(`❌ クライアント切断: ${socket.id}`);

    // 教師の場合
    if (onlineTeachers.has(socket.id)) {
      onlineTeachers.delete(socket.id);
      io.emit('teachers_list_updated', Array.from(onlineTeachers.values()));
    }

    // アクティブなレッスンをクリア
    for (const [lessonId, lesson] of activeLessons.entries()) {
      if (lesson.teacherId === socket.id || lesson.studentId === socket.id) {
        activeLessons.delete(lessonId);
      }
    }

    // 待機キューからクリア
    const index = waitingStudents.findIndex((s) => s.studentId === socket.id);
    if (index !== -1) {
      waitingStudents.splice(index, 1);
    }

    broadcastStats();
  });
});

// ===== 統計情報を配信 =====
function broadcastStats() {
  const stats = {
    onlineTeachers: onlineTeachers.size,
    activeLessons: activeLessons.size,
    waitingStudents: waitingStudents.length,
  };
  io.emit('stats_updated', stats);
}

// ===== REST API エンドポイント =====

// 教師一覧を取得
app.get('/api/teachers', (req, res) => {
  const teachers = Array.from(onlineTeachers.values()).map((teacher) => ({
    teacherId: teacher.socketId,
    name: teacher.name,
    email: teacher.email,
    proficiency: teacher.proficiencyLevel,
    timeSlots: teacher.timeSlots,
  }));

  res.json(teachers);
});

// 統計情報を取得
app.get('/api/stats', (req, res) => {
  const stats = {
    onlineTeachers: onlineTeachers.size,
    activeLessons: activeLessons.size,
    waitingStudents: waitingStudents.length,
  };
  res.json(stats);
});

// ===== サーバー起動 =====

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 日本語オンデマンドシステム        ║
║                                        ║
║  サーバー起動成功！                    ║
║  ポート: ${PORT}                         ║
║  環境: ${process.env.NODE_ENV || 'development'}                ║
║                                        ║
║  http://localhost:${PORT}                 ║
╚════════════════════════════════════════╝
  `);
});

// エラーハンドリング
process.on('unhandledRejection', (err) => {
  console.error('❌ エラーが発生しました:', err);
});
