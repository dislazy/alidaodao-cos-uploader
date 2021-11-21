var QCosSDK = require("./src/cosTool")
var QCdnSDK = require("./src/cdnTool")
module.exports.putObjectsToCos = function (config) {
    //上传文件到cos中
    QCosSDK.putObjectToCos(config);
}

module.exports.flushCdnPathCache = function (config) {
    //只刷新cdn目录
    QCdnSDK.flushCdnCache(config);
}