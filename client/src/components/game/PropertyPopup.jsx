import React from 'react';
import classicMap from '../../data/maps/classic';
import { Avatar, Tooltip } from '@mui/material';
import { Home, Hotel, MonetizationOn, Gavel, Delete } from '@mui/icons-material';

const glassStyle = {
    background: 'linear-gradient(135deg, rgb(30, 41, 59), rgb(139, 92, 246))',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    borderRadius: '12px',
    border: '1.5px solid rgb(139,92,246)',
    color: 'white',
    minWidth: 200,
    maxWidth: 220,
    padding: '8px 10px 6px 10px',
    position: 'relative',
    fontFamily: 'inherit',
    fontSize: '0.93rem',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginLeft: 5,
};

const actionBtn = (enabled) => ({
    flex: 1,
    background: enabled ? 'linear-gradient(90deg,#a78bfa,#8b5cf6)' : 'linear-gradient(90deg,#ede9fe,#c4b5fd)',
    color: enabled ? '#fff' : '#a78bfa',
    border: 'none',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: '0.93rem',
    padding: '4px 0',
    cursor: enabled ? 'pointer' : 'not-allowed',
    minHeight: 0,
    minWidth: 0,
    boxShadow: enabled ? '0 1px 4px rgba(139,92,246,0.08)' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    opacity: enabled ? 1 : 0.7,
    transition: 'background 0.2s, color 0.2s, opacity 0.2s',
});

const mortgageBtn = (enabled) => ({
    width: '100%',
    background: enabled ? 'linear-gradient(90deg,#fbbf24,#f59e42)' : 'linear-gradient(90deg,#fef3c7,#fde68a)',
    color: enabled ? '#1e293b' : '#b45309',
    border: 'none',
    borderRadius: 7,
    fontWeight: 700,
    fontSize: '1rem',
    padding: '7px 0',
    marginBottom: 7,
    cursor: enabled ? 'pointer' : 'not-allowed',
    boxShadow: enabled ? '0 1px 4px rgba(251,191,36,0.10)' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: enabled ? 1 : 0.7,
    transition: 'background 0.2s, color 0.2s, opacity 0.2s',
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
            {/* Mortgage Button at Top */}
            {gameSettings?.mortgage && (
                <Tooltip
                    title={canMortgage ? (
                        <span>
                            You can mortgage <b>{propertyName}</b> and get <b>${Math.floor(property.price / 2)}</b> from the bank, but players landing on this property won't pay you rent.
                        </span>
                    ) : ''}
                    arrow
                    placement="bottom"
                    disableHoverListener={!canMortgage}
                >
                    <span style={{ width: '100%' }}>
                        <button
                            style={{
                                width: '100%',
                                background: canMortgage ? 'linear-gradient(90deg,#eab308,#fbbf24)' : 'linear-gradient(90deg,#fef3c7,#fde68a)',
                                color: canMortgage ? '#fff' : '#b45309',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                padding: '6px 0',
                                marginBottom: 10,
                                marginTop: 2,
                                cursor: canMortgage ? 'pointer' : 'not-allowed',
                                boxShadow: canMortgage ? '0 1px 6px rgba(251,191,36,0.13)' : 'none',
                                opacity: canMortgage ? 1 : 0.7,
                                transition: 'background 0.2s, color 0.2s, opacity 0.2s',
                                letterSpacing: 0.2,
                                outline: 'none',
                                borderWidth: 0,
                                borderStyle: 'solid',
                                borderColor: 'transparent',
                                textAlign: 'center',
                                fontFamily: 'inherit',
                            }}
                            onClick={handleMortgage}
                            disabled={!canMortgage}
                        >
                            {isMortgaged ? `Unmortgage for $${Math.ceil(property.price * 0.6)}` : `Mortgage for $${Math.floor(property.price / 2)}`}
                        </button>
                    </span>
                </Tooltip>
            )}
            {/* Header: Property Name */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: property?.color || '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {property.flag && <span style={{ fontSize: 15 }}>{property.flag}</span>}
                    {propertyName}
                </span>
            </div>
            {/* Rent Table */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: '5px 6px', marginBottom: 2, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 2 }}>
                    <span style={{ color: '#a5b4fc' }}>when</span>
                    <span style={{ color: '#a5b4fc' }}>get</span>
                </div>
                {property.type === 'property' && property.rent.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                        <span>{['with rent', 'with one house', 'with two houses', 'with three houses', 'with four houses', 'with hotel'][i]}</span>
                        <span style={{ fontWeight: 600 }}>${r}</span>
                    </div>
                ))}
                {property.type === 'airport' && property.rent.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                        <span>{['1 airport owned', '2 airports owned', '3 airports owned', '4 airports owned'][i]}</span>
                        <span style={{ fontWeight: 600 }}>${r}</span>
                    </div>
                ))}
                {property.type === 'company' && property.rent.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                        <span>{['If one company is owned', 'If two companies are owned'][i]}</span>
                        <span style={{ fontWeight: 600 }}>{r}</span>
                    </div>
                ))}
            </div>
            {/* Owner and Details at bottom */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '3px 0 0 0', padding: '3px 0 0 0', fontSize: 12 }}>
                {ownership && (
                    <div style={{ color: ownership.ownerColor || '#22d3ee', fontWeight: 600, marginBottom: 2 }}>
                        Owner: {players?.find(p => p.id === ownership.owner)?.name || 'Unowned'}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <span>Price <b style={{ color: '#fbbf24' }}>${property.price}</b></span>
                    {property.type === 'property' && <span><Home sx={{ fontSize: 13, color: 'white', verticalAlign: 'middle' }} /> <b style={{ color: '#fbbf24' }}>${property.buildCost}</b></span>}
                    {property.type === 'property' && <span><Hotel sx={{ fontSize: 13, color: 'white', verticalAlign: 'middle' }} /> <b style={{ color: '#fbbf24' }}>${property.hotelCost}</b></span>}
                </div>
            </div>
            {/* Action Buttons Row: Always show all three, disabled if not available */}
            <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'center' }}>
                <button style={actionBtn(canBuild)} disabled={!canBuild} onClick={handleBuildHouse} title="Build House">
                    <Home sx={{ fontSize: 16, verticalAlign: 'middle', color: canBuild ? '#fff' : '#a78bfa', opacity: canBuild ? 1 : 0.5 }} />
                </button>
                <button style={actionBtn(canDestroy)} disabled={!canDestroy} onClick={handleDestroyHouse} title="Destroy House">
                    <Delete sx={{ fontSize: 16, verticalAlign: 'middle', color: canDestroy ? '#fff' : '#a78bfa', opacity: canDestroy ? 1 : 0.5 }} />
                </button>
                <button style={actionBtn(canSell)} disabled={!canSell} onClick={handleSellProperty} title="Sell Property">
                    <MonetizationOn sx={{ fontSize: 16, verticalAlign: 'middle', color: canSell ? '#fff' : '#a78bfa', opacity: canSell ? 1 : 0.5 }} />
                </button>
            </div>
        </div>
    );
};

export default PropertyPopup; 