const { request } = require('express');
var express = require('express');
var app = express();
const cors = require('cors');
app.use(cors());

// 查询
var mysql = require('mysql');
var connection = mysql.createConnection({
	host:'localhost',
	user: 'root',
  password: '123456',
  database: 'CARD'
});


app.get('/cardInfo', function (req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  var sql = 'SELECT * FROM visa ORDER BY useStartDay';
  connection.query(sql, function (err, result) {
    if (err) {
      console.log('[SELECT ERROR] - ', err.message);
      res.end(err.message);
      return;
    }
    res.end(resultTreatment(result));
  });
})

app.get('/totalInfo',function(req,res){
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  var sql = 'SELECT * FROM total';
  connection.query(sql, function (err, result) {
    if (err) {
      console.log('[SELECT ERROR] - ', err.message);
      res.end(err.message);
      return;
    }
    var times = result.map(bank => bank.time);
    var totalMoney = result.map(bank => bank.total_money);
    var formatData = {'time':times,'money':totalMoney};
    res.end(JSON.stringify(formatData));
  });
})

app.get('/updateMoney',function(req,res){
  var sql = 'UPDATE visa SET useMoney = ? WHERE name = ?';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  var name = req.query.name;
  var money = req.query.money;
  connection.query(sql,[money,name],function(err, result){
    if(err){
      console.log('[SELECT ERROR] - ', err.message);
      res.end(err.message);
      return;
    }
    res.end('ok')
  })

})

// 将当前时间和总负债存
app.get('/job_calculate',function(req,res){
	console.log('同步更新');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  var sumSQL = 'SELECT SUM(useMoney) as sumMoney FROM visa;'
  connection.query(sumSQL,function(err,result){
    if (err) {
       console.log('[SELECT ERROR] - ', err.message);
      res.end(err.message);
      return;
    }
    if(result.length < 1){
      res.end(err);
    }
    var toalMoney = result[0].sumMoney;
    var nowTime = dateFormat('YYYY-mm-dd',new Date());
    var jobCalSql = 'INSERT INTO total (time,total_money) VALUES (?,?)';
    connection.query(jobCalSql,[nowTime, toalMoney],function(err,result){
      if(err){
         console.log('插入失败',err);
        res.end(err);
        return;
      }
      res.end('ok');
    })
  })
})




var server = app.listen(10051, function () {

  var host = server.address().address
  var port = server.address().port
  console.log('运行中port:'+port+'host:'+host);
})

// 私有方法

function dateFormat(fmt, date) {
  let ret;
  const opt = {
    "Y+": date.getFullYear().toString(),        // 年
    "m+": (date.getMonth() + 1).toString(),     // 月
    "d+": date.getDate().toString(),            // 日
    "H+": date.getHours().toString(),           // 时
    "M+": date.getMinutes().toString(),         // 分
    "S+": date.getSeconds().toString()          // 秒
    // 有其他格式化字符需求可以继续添加，必须转化成字符串
  };
  for (let k in opt) {
    ret = new RegExp("(" + k + ")").exec(fmt);
    if (ret) {
      fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
    };
  };
  return fmt;
}

function dayDifference(day1, day2) {
  let day = 24 * 60 * 60 * 1000;
  try {
    let startTime = day1.getTime();

    let startTime2 = day2.getTime();

    let cha = parseInt(Math.abs(startTime - startTime2) / day);
    return cha;
  }
  catch (e) {
    return false;
  }
}

function getSum(total, num) {
  return total + Math.round(num);
}

function resultTreatment(result) {
  for (var i in result) {
    var bank = result[i];
    bank.remainMoney = 0;
    if (bank.type == 1 || bank.billDay == null || bank.returnDay == null) {
      continue;
    }
    var nowDate = new Date();
    var billDay = Number(bank.billDay);
    var returnDay = Number(bank.returnDay);
    var nowDay = nowDate.getDate();

    // 账单日
    var billDate = new Date();
    billDate.setDate(billDay);
    if (nowDay > billDay) {
      billDate.setMonth(nowDate.getMonth() + 1);
    }

    // 还款日
    var returnDate = new Date(billDate);
    returnDate.setDate(returnDay);
    if (billDay > returnDay) {
      returnDate.setMonth(billDate.getMonth() + 1);
    }
    // 距离账单日
    var billDayDiff = dayDifference(nowDate, billDate);
    bank.billDayDiff = billDayDiff;
    bank.billDay = dateFormat('mm-dd', billDate);
    // 距离还款日
    var returnDayDiff = dayDifference(nowDate, returnDate);
    bank.returnDayDiff = returnDayDiff;
    bank.returnDay = dateFormat('mm-dd', returnDate);

    // 可用额度
    bank.remainMoney = bank.totalMoney - bank.useMoney;

    // 本月还款倒计时
    var nowReturnDate = new Date();
    nowReturnDate.setDate(returnDay);
    if(nowDay > returnDay){
      nowReturnDate.setMonth(nowDate.getMonth() + 1);
    }
    var diff = dayDifference(nowDate, nowReturnDate);
    bank.countDownDay = diff;
  }
  // 增加一条总额
  var totalMoney = result.reduce((preTotal, bank) => preTotal + bank.totalMoney, 0);
  var useMoney = result.reduce((preTotal, bank) => preTotal + bank.useMoney, 0);
  var remainMoney = result.reduce((preTotal, bank) => preTotal + bank.remainMoney, 0);
  var total = {
    "name": "总计",
    "totalMoney": totalMoney,
    "useMoney": useMoney, "remainMoney": remainMoney
  };
  result.push(total);

  result = result.map(bank => [bank.name, bank.countDownDay, bank.billDay, bank.returnDay, bank.billDayDiff, bank.returnDayDiff, bank.totalMoney, bank.useMoney, bank.remainMoney])
  // console.log('[SELECT SUCCESS] -', result);
  return JSON.stringify(result);
}

