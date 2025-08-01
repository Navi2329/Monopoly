import React, { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import classicMap from '../../data/maps/classic';

// Helper for formatting currency
const formatMoney = (amount) => `$${amount}`;

const glassStyle = {
    background: 'linear-gradient(135deg, #181c2a 80%, #2d2250 100%)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    borderRadius: '18px',
    border: '1.5px solid rgba(255,255,255,0.10)',
    color: 'white',
    minWidth: 420,
    maxWidth: 480,
    padding: '0',
    position: 'relative',
    fontFamily: 'inherit',
    fontSize: '1rem',
    zIndex: 200,
};

const timerBarStyle = (color, percent) => ({
    width: '100%',
    height: 10,
    background: 'rgba(120, 120, 180, 0.18)',
    borderRadius: 8,
    margin: '12px 0 18px 0',
    overflow: 'hidden',
    position: 'relative',
});
const timerFillStyle = (color, percent) => ({
    width: `${percent}%`,
    height: '100%',
    background: color,
    borderRadius: 8,
    transition: 'width 0.2s',
});

const bidBtnStyle = (enabled, isHovered = false) => ({
    background: enabled 
        ? (isHovered ? 'linear-gradient(90deg,#8b5cf6,#6366f1)' : 'linear-gradient(90deg,#a78bfa,#818cf8)')
        : 'rgba(100,116,139,0.15)',
    color: enabled ? 'white' : '#64748b',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: '1.1rem',
    padding: '14px 0',
    margin: '0 8px 0 0',
    minWidth: 90,
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
    outline: 'none',
    boxShadow: enabled ? (isHovered ? '0 4px 12px #a78bfa44' : '0 2px 8px #a78bfa33') : 'none',
    opacity: enabled ? 1 : 0.4,
    transform: enabled ? (isHovered ? 'translateY(-1px)' : 'none') : 'scale(0.95)',
});

const AuctionModal = ({
    isOpen,
    onClose,
    property,
    players,
    currentBid,
    currentBidder,
    bidHistory,
    onBid,
    canBidAmounts, // {2: true/false, 10: true/false, 100: true/false}
    timeLeft,
    timeTotal,
    timerColor, // Color of the timer based on latest bidder
    auctionEnded,
    winner,
}) => {
    // Timer logic
    const [smoothPercent, setSmoothPercent] = useState(100);
    const [hoveredButton, setHoveredButton] = useState(null);
    
    useEffect(() => {
        if (!isOpen) return;
        let frame;
        let start;
        const duration = (timeLeft / timeTotal) * 5000; // 5s max
        const initialPercent = (timeLeft / timeTotal) * 100;
        setSmoothPercent(initialPercent);
        function animate(ts) {
            if (!start) start = ts;
            const elapsed = ts - start;
            const percent = Math.max(0, initialPercent - (elapsed / duration) * initialPercent);
            setSmoothPercent(percent);
            if (percent > 0 && !auctionEnded) {
                frame = requestAnimationFrame(animate);
            }
        }
        if (!auctionEnded) {
            frame = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(frame);
    }, [timeLeft, isOpen, auctionEnded, timeTotal]);

    // Property info - handle different property types
    const rentRows = property?.rent ? (() => {
        if (property.type === 'property') {
            // Regular properties have 6 rent levels: base, 1-4 houses, hotel
            return [
                { label: 'with rent', value: formatMoney(property.rent[0]) },
                { label: 'with one house', value: formatMoney(property.rent[1]) },
                { label: 'with two houses', value: formatMoney(property.rent[2]) },
                { label: 'with three houses', value: formatMoney(property.rent[3]) },
                { label: 'with four houses', value: formatMoney(property.rent[4]) },
                { label: 'with a hotel', value: formatMoney(property.rent[5]) },
            ];
        } else if (property.type === 'airport') {
            // Airports have 4 rent levels: 1, 2, 3, 4 airports owned
            return [
                { label: 'with 1 airport', value: formatMoney(property.rent[0]) },
                { label: 'with 2 airports', value: formatMoney(property.rent[1]) },
                { label: 'with 3 airports', value: formatMoney(property.rent[2]) },
                { label: 'with 4 airports', value: formatMoney(property.rent[3]) },
            ];
        } else if (property.type === 'company') {
            // Companies have 2 rent multipliers: 1 company, 2 companies
            return [
                { label: 'with 1 company', value: `${property.rent[0]}x dice roll` },
                { label: 'with 2 companies', value: `${property.rent[1]}x dice roll` },
            ];
        }
        return [];
    })() : [];

    const percent = smoothPercent;
    // Use the timerColor from server, fallback to greyish silver
    const finalTimerColor = timerColor || '#94a3b8';
    
    // Ensure timer bar shows 0 when auction ends or time is effectively up
    const displayPercent = (auctionEnded || percent <= 0.1) ? 0 : percent;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div style={glassStyle}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '32px 0 0 0' }}>
                    {property?.flag && <span style={{ fontSize: 36, marginRight: 8 }}>{property.flag}</span>}
                    <span style={{ fontSize: 32, fontWeight: 700 }}>{property?.name}</span>
                </div>
                {/* Current Bid */}
                <div style={{ textAlign: 'center', margin: '18px 0 0 0' }}>
                    <div style={{ fontSize: 18, color: '#a78bfa', fontWeight: 600 }}>Current bid</div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: currentBidder?.color || '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {currentBidder && <span style={{ fontSize: 32, marginRight: 4 }}> <span style={{ display: 'inline-block', width: 32, height: 32, borderRadius: '50%', background: currentBidder.color, marginRight: 4, verticalAlign: 'middle' }}></span></span>}
                        {formatMoney(currentBid)}
                    </div>
                </div>
                {/* Timer Bar */}
                <div style={{ padding: '0 32px' }}>
                    <div style={timerBarStyle(finalTimerColor, displayPercent)}>
                        <div style={timerFillStyle(finalTimerColor, displayPercent)} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13, color: '#a78bfa', marginTop: -8 }}>
                        {auctionEnded || percent <= 0.1 ? '0s' : `${Math.ceil((percent / 100) * timeTotal)}s`}
                    </div>
                </div>
                {/* Bid Buttons */}
                {!auctionEnded && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '0 0 12px 0' }}>
                        {[2, 10, 100].map((inc) => (
                            <button
                                key={inc}
                                style={bidBtnStyle(canBidAmounts[inc], hoveredButton === inc)}
                                disabled={!canBidAmounts[inc]}
                                onClick={() => onBid(inc)}
                                onMouseEnter={() => setHoveredButton(inc)}
                                onMouseLeave={() => setHoveredButton(null)}
                                title={!canBidAmounts[inc] ? "You cannot bid again until another player bids" : `Bid ${formatMoney(currentBid + inc)}`}
                            >
                                {formatMoney(currentBid + inc)}
                                <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>+${inc}</span>
                            </button>
                        ))}
                    </div>
                )}
                {/* Bid History */}
                <div style={{ background: 'rgba(120, 120, 180, 0.10)', borderRadius: 10, margin: '0 32px 0 32px', padding: 10, minHeight: 60, maxHeight: 120, overflowY: 'auto' }}>
                    {bidHistory && bidHistory.length > 0 ? (
                        bidHistory.slice().reverse().map((bid, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, marginBottom: 2 }}>
                                <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: '50%', background: bid.color, marginRight: 4 }}></span>
                                <span style={{ fontWeight: 600, color: bid.color }}>{bid.name}</span>
                                <span style={{ color: '#a78bfa', fontWeight: 700 }}>{formatMoney(bid.amount)}</span>
                                <span style={{ color: '#64748b', fontSize: 13 }}>{bid.note}</span>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>No bids yet</div>
                    )}
                </div>
                {/* Property Info */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 18, margin: '18px 0 0 0', padding: '0 32px 18px 32px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{property?.name}</div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: '6px 7px', fontSize: '0.95rem', marginBottom: 8 }}>
                            {rentRows.map((row, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                    <span style={{ color: '#e0e7ef' }}>{row.label}</span>
                                    <span style={{ color: '#fff' }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', fontSize: 15, marginTop: 4, gap: 6 }}>
                            <span>Price {formatMoney(property?.price)}</span>
                            {property?.type === 'property' && (
                                <>
                                    <span>🏠 {formatMoney(property?.buildCost)}</span>
                                    <span>🏨 {formatMoney(property?.hotelCost)}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {/* Auction Ended */}
                {auctionEnded && winner && (
                    <div style={{ textAlign: 'center', margin: '18px 0 0 0', color: '#a78bfa', fontWeight: 700, fontSize: 20 }}>
                        {winner.name} won the auction for {formatMoney(winner.amount)}!
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AuctionModal; 