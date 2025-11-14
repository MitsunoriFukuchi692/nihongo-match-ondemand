import React, { useState } from 'react';

function TeacherRegistration({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    availableTime: 'morning',
    level: 'beginner'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      onSubmit(formData);
      setFormData({
        name: '',
        email: '',
        availableTime: 'morning',
        level: 'beginner'
      });
    } else {
      alert('すべてのフィールドを入力してください');
    }
  };

  return (
    <div className="registration-form">
      <h2>講師登録</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>名前</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="名前を入力"
          />
        </div>

        <div className="form-group">
          <label>メールアドレス</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="メールアドレスを入力"
          />
        </div>

        <div className="form-group">
          <label>利用可能時間帯</label>
          <select name="availableTime" value={formData.availableTime} onChange={handleChange}>
            <option value="morning">朝（6:00-12:00）</option>
            <option value="afternoon">昼（12:00-18:00）</option>
            <option value="evening">夜（18:00-24:00）</option>
          </select>
        </div>

        <div className="form-group">
          <label>教える日本語レベル</label>
          <select name="level" value={formData.level} onChange={handleChange}>
            <option value="beginner">初級</option>
            <option value="intermediate">中級</option>
            <option value="advanced">上級</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">登録</button>
      </form>
    </div>
  );
}

export default TeacherRegistration;