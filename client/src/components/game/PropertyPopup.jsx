import React from 'react';
import classicMap from '../../data/maps/classic';

const glassStyle = {
    background: 'rgba(30, 41, 59, 0.97)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    borderRadius: '12px',
    border: '1.5px solid rgba(255,255,255,0.10)',
    color: 'white',
    minWidth: 210,
    maxWidth: 250,
    padding: '12px 12px 8px 12px',
    position: 'relative',
    fontFamily: 'inherit',
    fontSize: '0.97rem',
    zIndex: 200,
};

const mortgageBtn = (enabled) => ({
    width: '100%',
    background: enabled ? 'linear-gradient(90deg,#fbbf24,#fde68a)' : 'rgba(100,116,139,0.15)',
    color: enabled ? '#1e293b' : '#64748b',
    border: 'none',
    borderRadius: 7,
    fontWeight: 700,
    fontSize: '1rem',
    padding: '6px 0',
    marginBottom: 7,
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'background 0.2s',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
});

const actionRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    margin: '6px 0 7px 0',
};

const iconBtn = (enabled) => ({
    flex: 1,
    background: enabled ? 'rgba(139,92,246,0.15)' : 'rgba(100,116,139,0.15)',
    border: 'none',
    borderRadius: 7,
    color: enabled ? '#a78bfa' : '#64748b',
    fontSize: 16,
    padding: '7px 0',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'background 0.2s',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const rentTable = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 7,
    padding: '6px 7px',
    margin: '0 0 7px 0',
    fontSize: '0.95rem',
};

const priceRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    fontSize: '0.93rem',
    color: '#fbbf24',
    gap: 6,
};

const arrowStyle = {
    position: 'absolute',
    left: '50%',
    bottom: -8,
    transform: 'translateX(-50%)',
    width: 14,
    height: 8,
    zIndex: 101,
};

const PropertyPopup = ({
    propertyName,
    onClose,
    propertyOwnership,
    players,
    currentPlayerIndex,
    gamePhase,
    onBuildHouse,
    onDestroyHouse,
    onMortgageProperty,
    onSellProperty,
    gameSettings
}) => {
    const property = classicMap.find(p => p.name === propertyName);
    if (!property) return null;

    const ownership = propertyOwnership[propertyName];
    const currentPlayer = players && players[currentPlayerIndex];
    const isOwner = ownership && currentPlayer && ownership.owner === currentPlayer.id;

    // Get current property state from ownership data
    const currentHouses = ownership?.houses || 0;
    const hasHotel = ownership?.hotel || false;
    const isMortgaged = ownership?.mortgaged || false;

    const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
    const ownedSet = setProperties.every(p => propertyOwnership[p.name] && propertyOwnership[p.name].owner === currentPlayer?.id);
    const anyMortgaged = setProperties.some(p => propertyOwnership[p.name]?.mortgaged);
    const anyHousesOrHotels = setProperties.some(p => propertyOwnership[p.name]?.houses > 0 || propertyOwnership[p.name]?.hotel);

    let canMortgage = false, canBuild = false, canDestroy = false, canSell = false;
    if (isOwner) {
        // For mortgaging: can mortgage if this specific property has no houses/hotel and is not mortgaged
        if (property.type === 'property' && currentHouses === 0 && !hasHotel && !isMortgaged) canMortgage = true;
        else if (property.type !== 'property' && !isMortgaged) canMortgage = true;

        // For unmortgaging: can unmortgage if this specific property is mortgaged and no other properties in set have houses/hotels
        // and player has enough money (60% of property price)
        const unmortgageCost = Math.ceil(property.price * 0.6);
        if (property.type === 'property' && isMortgaged && !anyHousesOrHotels && currentPlayer && currentPlayer.money >= unmortgageCost) canMortgage = true;
        else if (property.type !== 'property' && isMortgaged && currentPlayer && currentPlayer.money >= unmortgageCost) canMortgage = true;

        if (property.type === 'property') {
            if (ownedSet && !anyMortgaged && !(currentHouses === 4 && hasHotel) && currentPlayer && currentPlayer.money >= property.buildCost) {
                // Check if houses are built evenly across the set (only if even build rule is enabled)
                let canBuildEvenly = true;
                if (gameSettings?.evenBuild) {
                    // For even build calculation, treat hotels as 4 houses
                    const setHouseCounts = setProperties.map(p => {
                        const propHouses = propertyOwnership[p.name]?.houses || 0;
                        const propHotel = propertyOwnership[p.name]?.hotel || false;
                        return propHotel ? 4 : propHouses;
                    });
                    const minHouses = Math.min(...setHouseCounts);

                    // Calculate current property's effective house count
                    const currentEffectiveHouses = hasHotel ? 4 : currentHouses;

                    // Can build if this property has the minimum number of houses
                    if (currentEffectiveHouses <= minHouses) {
                        // If building a hotel (4 houses), check if all properties in set have 4 houses or hotels
                        if (currentHouses >= 4) {
                            const allReadyForHotel = setProperties.every(p => {
                                const propHouses = propertyOwnership[p.name]?.houses || 0;
                                const propHotel = propertyOwnership[p.name]?.hotel || false;
                                return propHouses >= 4 || propHotel;
                            });
                            if (allReadyForHotel) {
                                canBuildEvenly = true;
                            } else {
                                canBuildEvenly = false;
                            }
                        } else {
                            canBuildEvenly = true;
                        }
                    } else {
                        canBuildEvenly = false;
                    }
                }

                if (canBuildEvenly) {
                    canBuild = true;
                }
            }
        }
        if (property.type === 'property' && (currentHouses > 0 || hasHotel)) {
            // Check if houses are destroyed evenly across the set (only if even build rule is enabled)
            let canDestroyEvenly = true;
            if (gameSettings?.evenBuild) {
                if (hasHotel) {
                    // Check if all properties in the set have hotels before destroying
                    const allHaveHotels = setProperties.every(p => propertyOwnership[p.name]?.hotel);
                    if (!allHaveHotels) {
                        canDestroyEvenly = false;
                    }
                } else {
                    // Check if this property has the maximum number of houses
                    const setHouses = setProperties.map(p => propertyOwnership[p.name]?.houses || 0);
                    const maxHouses = Math.max(...setHouses);

                    if (currentHouses < maxHouses) {
                        canDestroyEvenly = false;
                    }
                }
            }

            if (canDestroyEvenly) {
                canDestroy = true;
            }
        }
        if (property.type === 'property' && !anyHousesOrHotels && !isMortgaged) canSell = true;
        else if (property.type !== 'property' && !isMortgaged) canSell = true;
    }

    // Handle mortgage/unmortgage
    const handleMortgage = () => {
        if (onMortgageProperty) {
            onMortgageProperty(propertyName, !isMortgaged);
        }
    };

    // Handle build house
    const handleBuildHouse = () => {
        if (onBuildHouse) {
            onBuildHouse(propertyName);
        }
    };

    // Handle destroy house
    const handleDestroyHouse = () => {
        if (onDestroyHouse) {
            onDestroyHouse(propertyName);
        }
    };

    // Handle sell property
    const handleSellProperty = () => {
        if (onSellProperty) {
            onSellProperty(propertyName);
        }
    };

    // Rent rows for property
    const rentRows = property.type === 'property' ? [
        { label: 'with rent', value: `$${property.rent[0]}` },
        { label: 'with one house', value: `$${property.rent[1]}` },
        { label: 'with two houses', value: `$${property.rent[2]}` },
        { label: 'with three houses', value: `$${property.rent[3]}` },
        { label: 'with four houses', value: `$${property.rent[4]}` },
        { label: 'with a hotel', value: `$${property.rent[5]}` },
    ] : property.type === 'airport' ? [
        { label: 'one airport owned', value: `$${property.rent[0]}` },
        { label: '2 airports owned', value: `$${property.rent[1]}` },
        { label: '3 airports owned', value: `$${property.rent[2]}` },
        { label: '4 airports owned', value: `$${property.rent[3]}` },
    ] : property.type === 'company' ? [
        { label: 'If one company is owned', value: '$4 × 🎲' },
        { label: 'If two companies are owned', value: '$10 × 🎲' },
    ] : [];

    // Check if double rent applies for this property
    const hasDoubleRent = gameSettings?.doubleRentOnFullSet && property.type === 'property' && ownedSet;

    return (
        <div style={glassStyle}>
            {/* Mortgage/Unmortgage button at top - only show if mortgage setting is enabled */}
            {gameSettings?.mortgage && (
                <button
                    style={mortgageBtn(canMortgage)}
                    disabled={!canMortgage}
                    onClick={handleMortgage}
                >
                    🏦
                    {isMortgaged ? 'Unmortgage' : 'Mortgage'}
                </button>
            )}

            {/* Rent table */}
            <div style={rentTable}>
                {rentRows.map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                        <span style={{ color: '#a5b4fc', fontSize: '0.95em' }}>{row.label}</span>
                        <span style={{ fontWeight: 600 }}>
                            {row.value}
                            {hasDoubleRent && <span style={{ color: '#ef4444', marginLeft: '4px' }}>×2</span>}
                        </span>
                    </div>
                ))}
                {hasDoubleRent && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: 4,
                        padding: '2px 6px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        borderRadius: 4,
                        fontSize: '0.85rem',
                        color: '#ef4444',
                        fontWeight: 600
                    }}>
                        DOUBLE RENT - FULL SET OWNED
                    </div>
                )}
            </div>

            {/* Action buttons row */}
            <div style={actionRow}>
                {property.type === 'property' && (
                    <button
                        style={iconBtn(canBuild)}
                        disabled={!canBuild}
                        title="Build House/Hotel"
                        onClick={handleBuildHouse}
                    >
                        🏠
                    </button>
                )}
                {property.type === 'property' && (
                    <button
                        style={iconBtn(canDestroy)}
                        disabled={!canDestroy}
                        title="Destroy House/Hotel"
                        onClick={handleDestroyHouse}
                    >
                        🏚️
                    </button>
                )}
                <button
                    style={iconBtn(canSell)}
                    disabled={!canSell}
                    title="Sell"
                    onClick={handleSellProperty}
                >
                    💰
                </button>
            </div>

            {/* Price/mortgage/house/hotel cost row at bottom */}
            <div style={priceRow}>
                <span>Price <b>${property.price}</b></span>
                {property.type === 'property' && <span>🏦 <b>${property.price / 2}</b></span>}
                {property.type === 'property' && <span>🏠 <b>${property.buildCost}</b></span>}
                {property.type === 'property' && <span>🏨 <b>${property.hotelCost}</b></span>}
            </div>

            {/* Current property status */}
            {isOwner && property.type === 'property' && (
                <div style={{
                    marginTop: 8,
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                }}>
                    {isMortgaged ? (
                        <>
                            <span style={{ fontSize: '12px' }}>🏦</span>
                            <span style={{ color: '#ef4444' }}>MORTGAGED</span>
                        </>
                    ) : hasHotel ? (
                        <>
                            <span style={{ fontSize: '12px' }}>🏨</span>
                            <span style={{ color: '#10b981' }}>HOTEL</span>
                        </>
                    ) : currentHouses > 0 ? (
                        <>
                            <span style={{ fontSize: '12px' }}>🏠</span>
                            <span style={{ color: '#3b82f6' }}>{currentHouses} HOUSE{currentHouses > 1 ? 'S' : ''}</span>
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '12px' }}>💰</span>
                            <span style={{ color: '#6b7280' }}>NO HOUSES</span>
                        </>
                    )}
                </div>
            )}

            {/* Arrow pointer at bottom */}
            <svg style={arrowStyle} viewBox="0 0 14 8"><polygon points="0,0 14,0 7,8" fill="rgba(30,41,59,0.97)" /></svg>
        </div>
    );
};

export default PropertyPopup; 