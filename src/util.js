module.exports.createIdentifier = function () {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`
}
