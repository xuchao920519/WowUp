console.log("Test-Ext Loaded");

function activate(context) {
  console.debug("ACTIVE", context);
}

function dispose() {}

module.exports.activate = activate;
module.exports.dispose = dispose;
