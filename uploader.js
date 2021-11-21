'use strict';
const fs = require("fs");
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');
const util = require('./util.js');
const chalk = require('chalk');
const QCSDK = require('./flushcdn');

//初始化对象
var QCosSDK = function () {
    this.secretKey = '';
    this.secretId = '';
    this.bucket = '';
    this.region = '';
    this.distPath = '';
    this.targetPath = '/';
    this.enableCdn = false;
    this.cdnUrl = [];
    this.publicPath = '';
}
//写明配置文件
QCosSDK.prototype.config = function (userConfig) {
    checkConfigs(userConfig)

    this.secretKey = userConfig.secretKey;
    this.secretId = userConfig.SecretId;
    this.bucket = userConfig.bucket;
    this.region = userConfig.region;
    this.distPath = userConfig.distPath;
    this.targetPath = userConfig.targetPath || '/';
    this.enableCdn = userConfig.enableCdn || false;
    this.cdnUrl = userConfig.cdnUrl;
    this.publicPath = path.join(__dirname, this.distPath);
}

const client = new Cos({
    SecretId: this.SecretId,
    SecretKey: this.SecretKey,
});

QCosSDK.prototype.uploader = function (callback) {
    upFile(this.distPath);
    if (this.enableCdn) {
        cacheRefresh();
    }
}

async function deleteDir(dir) {
    let result = await client.getBucket(
        {
            Bucket: this.Bucket /* 必须 */,
            Region: this.Region,
        },
        //
        async function (err, result) {
            if (err) {
                console.log(err);
                return;
            }
            if (result.Contents) {
                let keys = [];
                result.Contents.forEach(function (obj) {
                    keys.push({Key: obj.Key});
                });

                try {
                    await client.deleteMultipleObject({
                        Bucket: this.Bucket /* 必须 */,
                        Region: this.Region,
                        Objects: keys,
                    });
                    successMes('delete files in ' + dir + 'success');
                } catch (e) {
                    console.log('delete file fail ,error :', e);
                }
            }
        }
    );
}

function addFileToCosSync(src, dist) {
    let docs = fs.readdirSync(src);
    docs.forEach(function (doc) {
        let _src = src + '/' + doc,
            _dist = dist + '/' + doc;
        let st = fs.statSync(_src);
        // 判断是否为文件
        if (st.isFile() && doc !== '.DS_Store') {
            putCos(_src, _dist);
        }
        // 如果是目录则递归调用自身
        else if (st.isDirectory()) {
            addFileToCosSync(_src, _dist);
        }
    });
}

/** *单个文件上传至cos */
async function putCos(src, dist) {
    await client.putObject(
        {
            Bucket: this.Bucket /* 必须 */,
            Region: this.Region,
            Key: dist /* 必须 */,
            Body: fs.createReadStream(src),
        },
        function (err, data) {
            if (err) {
                console.log('upload data error :' + err);
            } else {
                successMes(src + '  upload success ');
            }
        }
    );
}

/** *上传文件启动 *@param {string} dirName 将要上传的文件名 */
async function upFile(dirName) {
    console.log(config);
    try {
        setTimeout(function () {
            deleteDir(dirName);
        }, 3000);
        console.log('----------------');
        setTimeout(function () {
            addFileToCosSync(PUBLIC_PATH, dirName);
        }, 5000);
    } catch (err) {
        console.log(dirName + 'upload file fail  ', err);
    }
}

function successMes(msg) {
    console.log(msg);
}

/**
 * 更新CDN缓存
 * @param  {[type]} cfgs     [description]
 * @param  {[type]} filesMap [description]
 * @return {[type]}          [description]
 */
function cacheRefresh() {
    QCSDK.config({
        secretId: this.secretId,
        secretKey: this.secretKey,
        cdnUrl: this.cdnUrl
    })
    return new Promise((resolve, reject) => {
        QCSDK.request((res) => {
            if (res === 'success') {
                resolve(true);
            } else {
                reject(false);
            }
        })
    })
}

/**
 * 检查并处理设置项
 * @param  {[type]} config [hexo设置项]
 * @return {[type]}        [description]
 */
function checkConfigs(config) {
    if (!config.secretId || !config.secretKey || !config.region || !config.bucket || !config.distPath) {
        let tips = [
            chalk.red('由于配置错误，部署到 腾讯云COS 失败！'),
            '请检查输入的参数中中是否包含了以下信息',
            '    bucket: yourBucket',
            '    region: yourRegion',
            '    secretId: yourSecretId',
            '    secretKey: yourSecretKey',
            '    distPath: distPath',
            '',
            '您还可以访问仓库，以获取详细说明： ' + chalk.underline('https://github.com/dislazy/alidaodao-cos-uploader')
        ]
        console.log(tips.join('\n'));
        return false;
    }

    if (config.cdnEnable && _.size([config.cdnUrl]) <= 0) {
        let tips = [
            chalk.red('您开启了cdn目录刷新,但是由于配置错误，刷新CDN目录失败！'),
            '请检查输入的参数中中是否包含了以下信息',
            '  cdnUrl: []',
            '',
            '您还可以访问插件仓库，以获取详细说明： ' + chalk.underline('https://github.com/dislazy/alidaodao-cos-uploader')
        ]
        //校验CDN目录的地址
        let cdnUrls = [];
        config.cdnUrl.for(e => {
            cdnUrls.push(e.replace(/([^\/])$/, "$1\/"));
        });
        config.cdnUrl = cdnUrls;
    }
}

var qCosSDK = new QCosSDK();


module.exports = qCosSDK;