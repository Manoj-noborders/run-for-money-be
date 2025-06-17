const Web3 = require('web3');

exports.convertFuelToHumanReadable = (fuel) => {
    let tmp_fuel = Number(fuel);
    if (process.env.NODE_ENV === 'production') {
        tmp_fuel = fuel / 10 ** 18;
        console.log(tmp_fuel); // 1e+21    
        tmp_fuel = tmp_fuel.toLocaleString('fullwide', { useGrouping: false }) // "1000000000000000000000"
    } else {
        tmp_fuel = (fuel / 10 ** 9).toLocaleString('fullwide', { useGrouping: false });
    }
    return tmp_fuel;
}


exports.ethToFuel = (ethAmount, unit = 'gwei') => {
    ethAmount = ethAmount.toString();
    let fuelAmount = '0';
    if (process.env.NODE_ENV === 'production') {
        fuelAmount = Web3.utils.toWei(ethAmount, 'ether');
    } else {
        let ethInWei = Web3.utils.toWei(ethAmount, 'ether');
        fuelAmount = Web3.utils.fromWei(ethInWei, unit);
    }
    return fuelAmount;
}



exports.fuelToEth = (fuel) => {
    fuel = fuel.toString();
    let fuelInEther = 0;
    if (process.env.NODE_ENV === 'production') {
        fuelInEther = Web3.utils.fromWei(fuel, 'ether');
    } else {
        let fuelInWei = Web3.utils.toWei(fuel, 'gwei');
        fuelInEther = Web3.utils.fromWei(fuelInWei, 'ether');
    }
    return fuelInEther;
}


exports.isEmpty = variable => (typeof variable === 'string' || Array.isArray(variable)) ? variable.length === 0 : Object.keys(variable).length === 0;
