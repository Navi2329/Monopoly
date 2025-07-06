import React from 'react';
import { FaUsers, FaPlus } from 'react-icons/fa';

const Inventory = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Inventory</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      <div className="flex flex-col items-center justify-center p-4 bg-[#2a2a3e] rounded-lg aspect-square">
        <FaUsers className="text-4xl text-purple-400" />
        <p className="mt-2 text-sm">7-8 Players</p>
      </div>
      <div className="flex flex-col items-center justify-center p-4 bg-[#2a2a3e] rounded-lg aspect-square border-2 border-dashed border-gray-600">
        <FaPlus className="text-4xl text-gray-500" />
        <p className="mt-2 text-sm text-gray-400">Get more items</p>
      </div>
    </div>
  </div>
);

export default Inventory;
