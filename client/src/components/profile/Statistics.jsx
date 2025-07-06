import React from 'react';
import { FaGamepad, FaTrophy, FaCalendarAlt, FaUserFriends } from 'react-icons/fa';

const iconMap = [FaGamepad, FaTrophy, FaCalendarAlt, FaUserFriends];

const Statistics = ({ stats }) => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Statistics</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = iconMap[index];
        return (
          <div key={index} className="flex items-center gap-3 p-4 bg-[#2a2a3e] rounded-lg">
            <Icon className="text-2xl text-gray-400" />
            <div>
              <p className="font-bold">{stat.value}</p>
              <p className="text-sm text-gray-300">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default Statistics;
