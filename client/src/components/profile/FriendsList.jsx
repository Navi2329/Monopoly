import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

const FriendsList = ({ friends }) => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Friends</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {friends.map((friend) => (
        <div key={friend.id} className="bg-[#2a2a3e] p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            {friend.avatar ? (
              <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
            ) : (
              <FaExclamationCircle className="w-10 h-10 text-gray-500" />
            )}
            <span className="font-medium">{friend.name}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">Last seen</span><br/>
            <span className="text-xs text-gray-300">{friend.lastSeen}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default FriendsList;
