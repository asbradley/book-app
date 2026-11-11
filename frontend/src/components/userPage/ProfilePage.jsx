// components/ProfilePage.jsx
import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import BookList from './BookList';
import Recommendations from './Recommendations';
import ReviewList from './ReviewList';

export default function ProfilePage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('Books');

  if (!user) {
    return <p>Loading user profile...</p>
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <ProfileHeader user={user} onLogout={onLogout}/>
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'Books' && <BookList userId={user.id}/>}
        {activeTab === 'Reviews' && <ReviewList userId={user.id} />}
        {activeTab === 'Recommendations' && <Recommendations userId={user.id} />}
      </div>
    </div>
  );
}

