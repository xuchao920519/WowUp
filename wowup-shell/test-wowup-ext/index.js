console.log("Test-WowUp-Ext Loaded");

function activate(context) {
  console.debug("ACTIVE", context);
}

function dispose() {}

module.exports.activate = activate;
module.exports.dispose = dispose;
