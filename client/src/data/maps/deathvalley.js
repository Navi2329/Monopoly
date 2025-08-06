export const deathValleyMap = [
    // Position 0: START
    {
        name: "Start",
        type: "start",
        mortgaged: false,
    },
    // Position 1: Heat Wave Canyon
    {
        name: "Heat Wave Canyon",
        type: "property",
        set: "Desert Heat",
        price: 80,
        rent: [4, 20, 60, 180, 320, 450],
        buildCost: 50,
        hotelCost: 50,
        mortgaged: false,
        houses: 0,
        hotel: false,
    },
    // Position 2: Mirage
    {
        name: "Mirage",
        type: "treasure",
        mortgaged: false,
    },
    // Position 3: Scorching Sands
    {
        name: "Scorching Sands",
        type: "property",
        set: "Desert Heat",
        price: 80,
        rent: [4, 20, 60, 180, 320, 450],
        buildCost: 50,
        hotelCost: 50,
        mortgaged: false,
        houses: 0,
        hotel: false,
    },
    // Position 4: Dehydration Tax
    {
        name: "Dehydration Tax",
        type: "tax",
        taxType: "dehydration",
        taxAmount: 0.15,
        mortgaged: false,
    },
    // Position 5: Skull Rock
    {
        name: "Skull Rock",
        type: "property",
        set: "Rock Formations",
        price: 120,
        rent: [8, 40, 100, 300, 450, 600],
        buildCost: 50,
        hotelCost: 50,
        mortgaged: false,
        houses: 0,
        hotel: false,
    },
    // Position 6: Desert Airport
    {
        name: "Desert Airport",
        type: "airport",
        price: 200,
        mortgaged: false,
    },
    // Position 7: Devil's Canyon
    {
        name: "Devil's Canyon",
        type: "property",
        set: "Rock Formations",
        price: 120,
        rent: [8, 40, 100, 300, 450, 600],
        buildCost: 50,
        hotelCost: 50,
        mortgaged: false,
        houses: 0,
        hotel: false,
    },
    // Position 8: Bone Yard
    {
        name: "Bone Yard",
        type: "property",
        set: "Rock Formations",
        price: 140,
        rent: [10, 50, 150, 450, 625, 750],
        buildCost: 50,
        hotelCost: 50,
        mortgaged: false,
        houses: 0,
        hotel: false,
    },
    // Position 9: Sandstorm
    {
        name: "Sandstorm",
        type: "surprise",
        mortgaged: false,
    },
    // Position 10: Cactus Valley
    {
        name: "Cactus Valley",
        type: "property",
        set: "Wasteland",
        price: 160,
        rent: [12, 60, 180, 500, 700, 900],
        buildCost: 100,
        hotelCost: 100,
        mortgaged: false,
        houses: 0,
        hotel: false,
    },
    // Position 11: Barren Plains
    {
        name: "Barren Plains",
        type: "property",
        set: "Wasteland",
        price: 180,
        rent: [14, 70, 200, 550, 750, 950],
        buildCost: 100,
        hotelCost: 100,
        mortgaged: false,
        houses: 0,
        hotel: false,
    },
    // Position 12: Vulture's Nest (JAIL)
    {
        name: "Vulture's Nest",
        type: "jail",
        mortgaged: false,
    }
    // Add more properties here following the same pattern...
    // This is a simplified version for demonstration
];
