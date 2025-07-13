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

const bidBtnStyle = (enabled) => ({
    background: enabled ? 'linear-gradient(90deg,#a78bfa,#818cf8)' : 'rgba(100,116,139,0.15)',
    color: enabled ? 'white' : '#64748b',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: '1.1rem',
    padding: '14px 0',
    margin: '0 8px 0 0',
    minWidth: 90,
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'background 0.2s',
    outline: 'none',
    boxShadow: enabled ? '0 2px 8px #a78bfa33' : 'none',
});

const passBtnStyle = {
    background: 'rgba(139,92,246,0.15)',
    color: '#a78bfa',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: '1.1rem',
    padding: '14px 0',
    minWidth: 90,
    cursor: 'pointer',
    marginLeft: 8,
    outline: 'none',
    transition: 'background 0.2s',
};

const AuctionModal = ({
    isOpen,
    onClose,
    property,
    players,
    currentBid,
    currentBidder,
    bidHistory,
    onBid,
    onPass,
    canBidAmounts, // {2: true/false, 10: true/false, 100: true/false}
    timeLeft,
    timeTotal,
    auctionEnded,
    winner,
    showEndButton,
    onEndTurn,
}) => {
    // Timer logic
    const [smoothPercent, setSmoothPercent] = useState(100);
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

    // Auto-close on auction end
    useEffect(() => {
        if (auctionEnded && isOpen) {
            const timeout = setTimeout(() => {
                onClose();
            }, 1200);
            return () => clearTimeout(timeout);
        }
    }, [auctionEnded, isOpen, onClose]);

    // Property info
    const rentRows = property?.rent ? [
        { label: 'with rent', value: formatMoney(property.rent[0]) },
        { label: 'with one house', value: formatMoney(property.rent[1]) },
        { label: 'with two houses', value: formatMoney(property.rent[2]) },
        { label: 'with three houses', value: formatMoney(property.rent[3]) },
        { label: 'with four houses', value: formatMoney(property.rent[4]) },
        { label: 'with a hotel', value: formatMoney(property.rent[5]) },
    ] : [];

    const percent = smoothPercent;
    const timerColor = currentBidder?.color || '#a78bfa';

    return (
        <Modal isOpen={isOpen} onClose={onClose} disableBackdropClose={!auctionEnded}>
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
                    <div style={timerBarStyle(timerColor, percent)}>
                        <div style={timerFillStyle(timerColor, percent)} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13, color: '#a78bfa', marginTop: -8 }}>{Math.ceil((percent / 100) * timeTotal)}s</div>
                </div>
                {/* Bid Buttons */}
                {!auctionEnded && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '0 0 12px 0' }}>
                        {[2, 10, 100].map((inc) => (
                            <button
                                key={inc}
                                style={bidBtnStyle(canBidAmounts[inc])}
                                disabled={!canBidAmounts[inc]}
                                onClick={() => onBid(inc)}
                            >
                                {formatMoney(currentBid + inc)}
                                <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>+${inc}</span>
                            </button>
                        ))}
                        <button style={passBtnStyle} onClick={onPass}>Pass</button>
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
                            <span>🏠 {formatMoney(property?.buildCost)}</span>
                            <span>🏨 {formatMoney(property?.hotelCost)}</span>
                        </div>
                    </div>
                </div>
                {/* Auction Ended */}
                {auctionEnded && winner && (
                    <div style={{ textAlign: 'center', margin: '18px 0 0 0', color: '#a78bfa', fontWeight: 700, fontSize: 20 }}>
                        {winner.name} won the auction for {formatMoney(winner.amount)}!
                        {showEndButton && (
                            <div style={{ marginTop: 16 }}>
                                <button style={{ ...bidBtnStyle(true), minWidth: 120 }} onClick={onEndTurn}>End Turn</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AuctionModal; 