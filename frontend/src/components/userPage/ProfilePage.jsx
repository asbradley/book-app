// components/ProfilePage.jsx
import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import BookList from './BookList';
import Recommendations from './Recommendations';

// You could import ReviewList, ShelfList when you create them

export default function ProfilePage({ user, setIsLoggedin }) {
  const [activeTab, setActiveTab] = useState('Books');

  if (!user) {
    return <p>Loading user profile...</p>
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <ProfileHeader user={user} setIsLoggedin={setIsLoggedin}/>
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'Books' && <BookList userId={user.id}/>}
        {activeTab === 'Reviews' && <div>Reviews coming soon...</div>}
        {activeTab === 'Recommendations' && <Recommendations userId={user.id} />}
      </div>
    </div>
  );
}

