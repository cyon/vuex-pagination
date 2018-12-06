const path = require('path')
const fs = require('fs')

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'licenses.json'), {
  encoding: 'utf8'
}))

module.exports.fetchPage = async function (opts) {
  var indexStart = opts.page * opts.pageSize - opts.pageSize

  let randomWaitTime = Math.floor(Math.random() * 5000)
  await sleep(randomWaitTime)

  let filteredData = data.filter((license) => license.name.toLowerCase().includes(opts.args.query.toLowerCase()))

  return {
    total: filteredData.length,
    data: filteredData.slice(indexStart, indexStart + opts.pageSize)
  }
}

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
