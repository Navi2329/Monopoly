import React, { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import classicMap from '../../data/maps/classic';

// Helper for formatting currency
const formatMoney = (amount) => `$${amount}`;

const glassStyle = {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    boxShadow: '0 20px 40px 0 rgba(0, 0, 0, 0.3)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    width: '90vw',
    maxWidth: '800px',
    minWidth: '600px',
    padding: '0',
    position: 'relative',
    fontFamily: 'inherit',
    fontSize: '1rem',
    zIndex: 200,
};

const timerBarStyle = (color, percent) => ({
    width: '100%',
    height: 8,
    background: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
});
const timerFillStyle = (color, percent) => ({
    width: `${percent}%`,
    height: '100%',
    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
    borderRadius: 4,
    transition: 'width 0.2s ease-out',
});

const bidBtnStyle = (enabled, isHovered = false) => ({
    background: enabled 
        ? (isHovered ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #a855f7, #8b5cf6)')
        : 'rgba(71, 85, 105, 0.3)',
    color: enabled ? 'white' : '#94a3b8',
    border: enabled ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(71, 85, 105, 0.3)',
    borderRadius: 12,
    fontWeight: 600,
    fontSize: '14px',
    padding: '12px 16px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: enabled ? (isHovered ? '0 8px 25px rgba(168, 85, 247, 0.4)' : '0 4px 15px rgba(168, 85, 247, 0.2)') : 'none',
    opacity: enabled ? 1 : 0.5,
    transform: enabled ? (isHovered ? 'translateY(-2px) scale(1.02)' : 'none') : 'scale(0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px'
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
                <div style={{ display: 'flex', gap: '24px', padding: '32px' }}>
                    {/* Left Section - Auction Info */}
                    <div style={{ flex: 1 }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 8px 0' }}>
                                Auction
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {property?.flag && <span style={{ fontSize: 24 }}>{property.flag}</span>}
                                <span style={{ fontSize: '28px', fontWeight: '700', color: 'white' }}>{property?.name}</span>
                            </div>
                        </div>

                        {/* Current Bid */}
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '500', marginBottom: '8px' }}>
                                Current bid
                            </div>
                            <div style={{ 
                                fontSize: '36px', 
                                fontWeight: '800', 
                                color: 'white',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: 12 
                            }}>
                                {currentBidder && (
                                    <div style={{ 
                                        display: 'inline-block', 
                                        width: 40, 
                                        height: 40, 
                                        borderRadius: '50%', 
                                        background: currentBidder.color,
                                        border: '2px solid rgba(255,255,255,0.2)'
                                    }}></div>
                                )}
                                {formatMoney(currentBid)}
                            </div>
                        </div>

                        {/* Timer Bar */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={timerBarStyle(finalTimerColor, displayPercent)}>
                                <div style={timerFillStyle(finalTimerColor, displayPercent)} />
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                fontSize: '14px', 
                                color: '#94a3b8', 
                                marginTop: '8px' 
                            }}>
                                <span>I'm bidding...</span>
                                <span>
                                    {auctionEnded ? 'Sold' : percent <= 0.1 ? 'Sold in 0s' : `Sold in ${Math.ceil((percent / 100) * timeTotal)}s`} 🔨
                                </span>
                            </div>
                        </div>

                        {/* Bid Buttons */}
                        {!auctionEnded && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
                                {[2, 10, 100].map((inc) => (
                                    <button
                                        key={inc}
                                        style={{
                                            ...bidBtnStyle(canBidAmounts[inc], hoveredButton === inc),
                                            minWidth: '100px',
                                            padding: '12px 16px',
                                            fontSize: '16px',
                                            fontWeight: '600'
                                        }}
                                        disabled={!canBidAmounts[inc]}
                                        onClick={() => onBid(inc)}
                                        onMouseEnter={() => setHoveredButton(inc)}
                                        onMouseLeave={() => setHoveredButton(null)}
                                        title={!canBidAmounts[inc] ? "You cannot bid again until another player bids" : `Bid ${formatMoney(currentBid + inc)}`}
                                    >
                                        {formatMoney(currentBid + inc)}
                                        <div style={{ fontSize: '12px', fontWeight: '400', opacity: 0.8 }}>+${inc}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Bid History */}
                        <div style={{ 
                            background: 'rgba(15, 23, 42, 0.5)', 
                            borderRadius: '12px', 
                            padding: '16px', 
                            minHeight: '120px', 
                            maxHeight: '160px', 
                            overflowY: 'auto',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {bidHistory && bidHistory.length > 0 ? (
                                bidHistory.slice().reverse().map((bid, idx) => (
                                    <div key={idx} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        fontSize: '14px', 
                                        marginBottom: '8px',
                                        padding: '4px 0'
                                    }}>
                                        <div style={{ 
                                            display: 'inline-block', 
                                            width: 24, 
                                            height: 24, 
                                            borderRadius: '50%', 
                                            background: bid.color,
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}></div>
                                        <span style={{ fontWeight: '600', color: 'white', flex: 1 }}>{bid.name}</span>
                                        <span style={{ color: '#06b6d4', fontWeight: '700' }}>bids {formatMoney(bid.amount)}</span>
                                        {bid.note && <span style={{ color: '#64748b', fontSize: '12px' }}>{bid.note}</span>}
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', lineHeight: '120px' }}>
                                    No bids yet
                                </div>
                            )}
                        </div>

                        {/* Auction Ended */}
                        {auctionEnded && winner && (
                            <div style={{ 
                                textAlign: 'center', 
                                marginTop: '16px', 
                                color: '#10b981', 
                                fontWeight: '700', 
                                fontSize: '18px',
                                padding: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                                🎉 {winner.name} won the auction for {formatMoney(winner.amount)}!
                            </div>
                        )}
                    </div>

                    {/* Right Section - Property Card */}
                    <div style={{ 
                        width: '280px',
                        background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                    }}>
                        {/* Property Header */}
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <h3 style={{ 
                                fontSize: '20px', 
                                fontWeight: '700', 
                                color: 'white', 
                                margin: '0 0 4px 0'
                            }}>
                                {property?.name}
                            </h3>
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                {property?.type === 'property' ? 'Property' : 
                                 property?.type === 'airport' ? 'Airport' : 
                                 property?.type === 'company' ? 'Company' : 'Property'}
                            </div>
                        </div>

                        {/* Rent Information */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
                                When collected, get:
                            </div>
                            <div style={{ 
                                background: 'rgba(255,255,255,0.1)', 
                                borderRadius: '8px', 
                                padding: '12px',
                                fontSize: '14px'
                            }}>
                                {rentRows.map((row, idx) => (
                                    <div key={idx} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        marginBottom: idx < rentRows.length - 1 ? '6px' : '0',
                                        color: 'white'
                                    }}>
                                        <span style={{ color: 'rgba(255,255,255,0.9)' }}>{row.label}</span>
                                        <span style={{ fontWeight: '600' }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Price Information */}
                        <div style={{ 
                            borderTop: '1px solid rgba(255,255,255,0.2)', 
                            paddingTop: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Price</div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>
                                    {formatMoney(property?.price)}
                                </div>
                            </div>
                            {property?.type === 'property' && (
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '16px' }}>🏠</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                                            {formatMoney(property?.buildCost)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '16px' }}>🏨</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                                            {formatMoney(property?.hotelCost)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AuctionModal; 