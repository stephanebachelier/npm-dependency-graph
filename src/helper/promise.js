const Promise = require('bluebird')

module.exports = {
  allSettled: (promises = []) =>
    Promise.all(
      promises.map(promise => Promise.resolve(promise).reflect())
    ).map(function (inspection) {
      return inspection.isFulfilled()
        ? {
          status: 'fulfilled',
          value: inspection.value()
        }
        : {
          status: 'rejected',
          reason: inspection.reason()
        }
    })
}
