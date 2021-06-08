var httpUrl = 'http://47.116.130.99:20076';
new gridjs.Grid({
    columns: [{
        name: '银行',
        attributes: (cell) => {
            if (cell) {
                return {
                    'data-cell-content': cell,
                    'onclick': () => updateMoney(cell),
                    'style': 'cursor: pointer',
                };
            }
        }
    }
        , '倒计时', '账单日', '还款日',
    {
        name: 'nextBill',
        sort: {
            enable: true,
            compare: (a, b) => {
                const code = (x) => Number(x);

                if (code(a) > code(b)) {
                    return 1;
                } else if (code(b) > code(a)) {
                    return -1;
                } else {
                    return 0;
                }
            }
        }
    },
    {
        name: 'nextReturn',
        sort: {
            enable: true,
            compare: (a, b) => {
                const code = (x) => Number(x);

                if (code(a) > code(b)) {
                    return 1;
                } else if (code(b) > code(a)) {
                    return -1;
                } else {
                    return 0;
                }
            }
        }
    },
        '额度', '负债',
        '可用额度'
    ],
    sort: false,
    server: {
        url: httpUrl + '/cardInfo',
        then: data => data
    },
    style: {
        table: {
        },
        th: {
            'text-align': 'center'
        },
        td: {
            'text-align': 'center'
        }
    }
}).render(document.getElementById("wrapper"));


function updateMoney(str) {

    var person = prompt("请输入" + str + '的负债😂😭😂', "");
    if (person != null && person != "") {
        sendRequest(str, Number(person));
    }
}

function sendRequest(str, money) {
    var url = httpUrl + "/updateMoney?name=" + str + '&money=' + money/*json文件url，本地的就写本地的位置，如果是服务器的就写服务器的路径*/
    var request = new XMLHttpRequest();
    request.open("get", url);/*设置请求方法与路径*/
    request.send(null);/*不发送数据到服务器*/
    request.onload = function () {/*XHR对象获取到返回信息后执行*/
        location.reload();
    }
}

window.onload = function () {
    var ctx = document.getElementById("myChart").getContext('2d');
    var url = httpUrl + "/totalInfo"/*json文件url，本地的就写本地的位置，如果是服务器的就写服务器的路径*/
    var request = new XMLHttpRequest();
    request.open("get", url);/*设置请求方法与路径*/
    request.send(null);/*不发送数据到服务器*/
    request.onload = function () {/*XHR对象获取到返回信息后执行*/
        if (request.status == 200) {/*返回状态为200，即为数据获取成功*/
            var per = JSON.parse(request.responseText);
            console.log('请求结果', per);
            var myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: per.time,
                    datasets: [{
                        label: 'Money',
                        data: per.money,
                        backgroundColor: [
                            // 'rgba(255, 99, 132, 0.2)',
                            // 'rgba(54, 162, 235, 0.2)',
                            // 'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            // 'rgba(255,99,132,1)',
                            // 'rgba(54, 162, 235, 1)',
                            // 'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
        }
    }
}
