import Wallet from "../../models/walletModel.js"

export const getWalletService = async (userId, page) => {

    const limit = 10
    const skip = (page - 1) * limit

    let wallet = await Wallet.findOne({ userId })

    if (!wallet) {

        wallet = await Wallet.create({
            userId,
            balance: 0,
            transactions: []
        })
    }

    const sortedTransactions = [...wallet.transactions].sort((a, b) => new Date(b.createdAt) - (a.createdAt))

    const totalTransactions = sortedTransactions.length

    const totalPages = Math.ceil(totalTransactions / limit)

    const transactions = sortedTransactions.slice(skip, skip + limit)
    return {
        wallet,
        transactions,
        totalPages,
        currentpage: page,
        totalTransactions
    }
}


export const creditWalletService = async (userId, amount, description, purpose, orderId = null) => {

    let wallet = await Wallet.findOne({ userId })

    if (!wallet) {
        wallet = await Wallet.create({
            userId,
            balance: 0,
            transactions: []
        });
    }

    wallet.balance += amount

    wallet.transactions.unshift({
        transactionId: "WTXN-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        type: "credit",
        amount,
        description,
        purpose,
        orderId
    })

    await wallet.save()

    return wallet
}

export const debitWalletService = async (userId, amount, description, purpose, orderId = null) => {

    let wallet = await Wallet.findOne({ userId })

    if (!wallet) {
        wallet = await Wallet.create({
            userId,
            balance: 0,
            transactions: []
        });
    }
    if (wallet.balance < amount) {
        throw new Error("Insufficient wallet balance")
    }

    wallet.balance -= amount
    wallet.transactions.unshift({
        transactionId: `WTXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: "debit",
        amount,
        description,
        purpose,
        orderId
    })

    await wallet.save()

    return wallet
}