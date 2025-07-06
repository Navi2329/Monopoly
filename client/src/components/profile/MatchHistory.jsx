import React, { useState } from 'react';
import { FaTrophy, FaChevronDown, FaLock, FaUser } from 'react-icons/fa';

const ITEMS_PER_PAGE = 8;

const MatchHistory = ({ matches }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(matches.length / ITEMS_PER_PAGE);
    const currentMatches = matches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Last games</h2>
            <p className="text-sm text-gray-400 mb-4">
                Only last {matches.length} games are shown.{' '}
                <a href="#" className="underline">Learn more about this list.</a>
            </p>
            <div className="space-y-2">
                {currentMatches.map((match) => (
                    <div key={match.id} className="bg-[#2a2a3e] p-3 rounded-lg flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <FaChevronDown className="text-gray-500 cursor-pointer" />
                            <span>{match.date}</span>
                            <div className="flex items-center -space-x-2">
                                {Array.from({ length: match.players }).map((_, i) => (
                                    <FaUser key={i} className="w-4 h-4 text-gray-400 bg-purple-800 rounded-full p-0.5" />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <FaLock className="text-gray-500" />
                            <span className={`flex items-center gap-1 ${match.outcome === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                <FaTrophy /> {match.points}
                            </span>
                            <span className="text-gray-400 w-12 text-right">{match.duration}</span>
                        </div>
                    </div>
                ))}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2 items-center">
                    <button
                        className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                            key={idx}
                            className={`px-2 py-1 rounded ${currentPage === idx + 1 ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300'}`}
                            onClick={() => goToPage(idx + 1)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                    <button
                        className="px-2 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default MatchHistory;
