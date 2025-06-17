function calculateLPWithPoints(leagueA, startingPointsA, leagueB, startingPointsB, resultA, resultB) {
    // Define LP values for each league and win/loss
    const lpValues = {
        Trial: { win: 20, loss: -20 },
        'Bronze 1': { win: 25, loss: -25 },
        'Bronze 2': { win: 30, loss: -25 },
        'Bronze 3': { win: 35, loss: -25 },
        'Silver 1': { win: 40, loss: -40 },
        'Silver 2': { win: 45, loss: -45 },
        'Silver 3': { win: 50, loss: -50 },
        'Gold 1': { win: 55, loss: -55 },
        'Gold 2': { win: 60, loss: -60 },
        'Gold 3': { win: 65, loss: -65 },
        'Platinum 1': { win: 70, loss: -70 },
        'Platinum 2': { win: 75, loss: -75 },
        'Platinum 3': { win: 80, loss: -80 },
        'Elite 1': { win: 85, loss: -85 },
        'Elite 2': { win: 90, loss: -90 },
        'Elite 3': { win: 95, loss: -95 },
    };

    // Calculate LP change for both players based on their league and match result
    const lpChangeA = lpValues[leagueA][resultA];
    const lpChangeB = lpValues[leagueB][resultB];

    // Calculate new LP for both players
    const newPointsA = startingPointsA + lpChangeA;
    const newPointsB = startingPointsB + lpChangeB;

    return { playerA: newPointsA, playerB: newPointsB };
}

// const result = calculateLPWithStartingPoints('Bronze 1', 500, 'Bronze 2', 600, 'win', 'loss');
// console.log(result); // { playerA: 525, playerB: 570 }


module.exports = { calculateLPWithPoints }