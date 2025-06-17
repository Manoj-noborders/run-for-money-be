const { ethers } = require('ethers');

async function verify_user_signature(message, signature) {
    try {
        // Hash the message
        const messageHash = ethers.utils.hashMessage(message);

        // Recover the wallet address from the signature
        const walletAddress = ethers.utils.recoverAddress(messageHash, signature);

        return walletAddress;
    } catch (error) {
        console.error('Error verifying signature:', error);
        throw new Error('Invalid signature');
    }
}



module.exports = {
    verify_user_signature
};