// const Web3 = require("web3");
// const contractABI = require('./contractAbi.json');


// function xetaEventListener() {
//     const web3 = new Web3("ws://13.215.68.247:9650/ext/bc/fRuomnMajakodKhGaxiaWz7DqGdqAAAZTnQUUPqA4osnLkw5i/ws");    
//     // const web3 = new Web3("ws://13.215.68.247:9650/ext/bc/fRuomnMajakodKhGaxiaWz7DqGdqAAAZTnQUUPqA4osnLkw5i/rpc");    
//     const contractAddress = '0xa61cC4176aED67628d78eDE89257FbA94ceFfCb0';
//     const contract = new web3.eth.Contract(contractABI, contractAddress);

//     contract.events['XetaReceived']({}, (error, event) => {
//         if (error) {
//             console.error("Error:", error);
//             return;
//         }
    
//         console.log("New event received:");
//         console.log(event.returnValues);
//     })
//     .on("connected", () => {
//         console.log("Connected to the blockchain");
//     })
//     .on("changed", (event) => {
//         console.log("Event changed:", event.returnValues);
//     })
//     .on("error", (error) => {
//         console.error("Event error:", error);
//     });
    
//     console.log("End of routine");

// }

// module.exports = {
//     xetaEventListener
// };
