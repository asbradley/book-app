// components/ProfilePage.jsx
import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import BookList from './BookList';

// You could import ReviewList, ShelfList when you create them

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Books');

  return (
    <div className="max-w-3xl mx-auto p-4">
      <ProfileHeader />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'Books' && <BookList />}
        {activeTab === 'Reviews' && <div>Reviews coming soon...</div>}
        {activeTab === 'Shelves' && <div>Shelves coming soon...</div>}
      </div>
    </div>
  );
}

