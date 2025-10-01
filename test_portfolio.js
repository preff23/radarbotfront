// Тест для проверки расчета портфеля
const testData = {
  accounts: [{
    portfolio_value: 2237516.54,
    holdings: [
      {
        name: "БДеньг-2P8",
        raw_quantity: 5,
        price: 1000,
        market_value: 5000
      },
      {
        name: "КЛС-ТРЕЙД БО-03", 
        raw_quantity: 25,
        price: 1000,
        market_value: 25000
      }
    ]
  }]
}

const account = testData.accounts[0]

// Тест суммы портфеля
const portfolioValue = account.portfolio_value
console.log('Portfolio value:', portfolioValue)

// Тест количества бумаг
const totalQuantity = account.holdings.reduce((acc, holding) => {
  const quantity = holding.raw_quantity || holding.quantity || holding.amount || 0
  return acc + quantity
}, 0)
console.log('Total quantity:', totalQuantity)

// Тест количества позиций
const positionsCount = account.holdings.length
console.log('Positions count:', positionsCount)

console.log('Expected: 30 papers, 2237516.54 value')
console.log('Actual:', totalQuantity, 'papers,', portfolioValue, 'value')
