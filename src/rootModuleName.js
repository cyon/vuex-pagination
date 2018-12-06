let rootModuleName = '__paginatedResources'

module.exports.setRootModuleName = function (name) {
  rootModuleName = name
}

module.exports.getRootModuleName = function () {
  return rootModuleName
}
