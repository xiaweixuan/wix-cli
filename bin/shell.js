#!/usr/bin/env node

const inquirer = require('inquirer'); // 交互
const log = require('single-line-log').stdout;
const strformat = require('str-format').format;
const clicolor = require('cli-color');
const fse = require('fs-extra');
const rp = require('request-promise');
const path = require('path');
const unzipper = require('unzipper');

const status = { success: false };

// 一些方法
const utils = {
  getRemoteZip: ({ filename, filepath }, cb) => {
    // let url = `http://iuap-design-cdn.oss-cn-beijing.aliyuncs.com/static/ucf/templates/1.4.x/react-js-templete.zip`
    let url = 'http://download.xiawx.top/react-js-templete.zip';
    return new Promise((resolve, reject) => {
      utils.download({ url }, `react-js-templete.tmp`, () => {
        resolve({ success: true });
      });
    });
  },
  download: async function (options, filename, cb) {
    let opts = {
      method: 'get',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': 1
      }
    }
    opts = { ...opts, ...options };
    // 获得文件夹路径
    let fileFolder = path.dirname(filename);
    // 创建文件夹
    fse.ensureDirSync(fileFolder);
    // 开始下载无需返回
    rp(opts).pipe(fse.createWriteStream(filename)).on('close', cb);
  }
}

// 进度条封装
function ProgressBar(description, bar_length) {
  this.description = description || "PROGRESS";
  this.length = bar_length.length || 28;

  // 刷新进度条图案，文字的方法
  this.render = function (opts) {
    var percentage = (opts.completed / opts.total).toFixed(4);
    var cell_num = Math.floor(percentage * this.length);
    // 拼接黑色条
    var cell = '';
    for (var i = 0; i < cell_num; i++) {
      cell += '█';
    }
    // 拼接灰色条
    var empty = '';
    for (var i = 0; i < this.length - cell_num; i++) {
      empty += '░';
    }

    var percent = (100 * percentage).toFixed(2);
    /**
     * 使用cli-color进行包装美化。
     */
    this.description = clicolor.blue.bold(this.description);
    cell = clicolor.green.bgBlack.bold(cell);
    opts.completed = clicolor.yellow.bold(opts.completed);
    opts.total = clicolor.blue.bold(opts.total);
    opts.status = percent == 100.00 ? clicolor.green.bold(opts.status) : clicolor.red.bold(opts.status);


    // 拼接最终文本
    var cmdtext = strformat("<{}:{}%> {}{}  [ {}/{} `{}`]", [this.description, percent,
      cell, empty, opts.completed, opts.total, opts.status]);
    log(cmdtext);
  };
}
// 加载进度条
const downloading = (status, pb, num, total, callback) => {
  if (status.success) {
    pb.render({ completed: total, total: total, status: "Completed." });
    callback && callback()
    process.exit(0);
  }
  if (num < total - 1) {
    pb.render({ completed: num, total: total, status: 'Downloading...' });
    num++;
    setTimeout(() => {
      downloading(status, pb, num, total,callback);
    }, 100);
  }
}
const init = async () => {

  console.log();
  console.log(clicolor.green.bold(`⏳  welcome use wx-cli  ⏳`));
  console.log(clicolor.green.bold(`⏳  this is the react architecture I designed  ⏳`));
  console.log(clicolor.green.bold(`⏳  if you have a better opinion  ⏳`));
  console.log(clicolor.green.bold(`⏳  you can contact me through xia_weixuan@163.com  ⏳`));
  console.log(clicolor.green.bold(`⏳ 🔊 📢 ⚠️ 🇺🇿 🌍 ☁️ ⏳`));
  console.log();

  const { name: folderName } = await inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: 'Project Name:',
    default: function () {
      return 'wx-web';
    }
  }]);

  console.log(clicolor.cyan.bold(`[Info] :    🚀 Start downloading wx project to the current directory 🎁`));

  var pb = new ProgressBar('Download', 72); // 进度条
  var num = 0, total = 100;

  if (folderName) {
    downloading(status, pb, num, total, () => {
      console.log();
      console.log();
      console.log(clicolor.cyan.bold(`🚀 Next, install NPM package dependencies 🎁 `));
      console.log(clicolor.cyan.bold(`[Tips] : 🏆  cd ${folderName} && yarn && yarn start`));
    });
    let { success } = await utils.getRemoteZip({
      filename: folderName,
    });
    let filepath = path.resolve('.');
    if (success) {
      fse.createReadStream(`${filepath}/react-js-templete.tmp`).pipe(unzipper.Extract({ path: filepath })).on('close', () => {
        fse.remove(`${filepath}/react-js-templete.tmp`);
        fse.renameSync(`${filepath}/react-templete`, `${filepath}/${folderName}`);
        status.success = true;
      });
    }
  } else {
    console.log(clicolor.red.bold(`[Error] :   ⚠️  directory ${folderName} already exists. 😫`));
    console.log(clicolor.yellow.bold(`[Tips] :    🤔 Try renaming the project name 🤗  `));
    process.exit(0);
  }
}

init()
