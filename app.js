const ws = require('nodejs-websocket');
const htpp = require('http');
const koa = require("koa");
const Router = require("koa-Router");
const ejs = require('ejs');

const app = new koa()
const router = new Router();

//封装发送消息的函数(向每个链接的用户发送消息)
const boardcast = (str) => {
    console.log(str);
    server.connections.forEach((connect) => {
        connect.sendText(str)
    })
};

//封装获取所有聊天者的nickname
const getAllChatter = () => {
    let chartterArr = [];
    server.connections.forEach((connect) => {
        chartterArr.push({ name: connect.nickname })
    });
    return chartterArr;
};

const server = ws.createServer((connect) => {

    //链接上来的时候
    connect.on('text', (str) => {
        let data = JSON.parse(str);
        console.log(data);
        switch (data.type) {
            case 'setName':
                connect.nickname = data.nickname;
                boardcast(JSON.stringify({
                    type: 'serverInformation',
                    message: data.nickname + "进入房间",
                }));

                boardcast(JSON.stringify({
                    type: 'chatterList',
                    list: getAllChatter()
                }));
                break;
            case 'chat':
                boardcast(JSON.stringify({
                    type: 'chat',
                    name: connect.nickname,
                    message: data.message
                }));
                break;
            default:
                break;
        }
    });

    //关闭链接的时候
    connect.on('close', () => {

        //离开房间
        boardcast(JSON.stringify({
            type: 'serverInformation',
            message: connect.nickname + '离开房间'
        }));

        //从在线聊天的人数上面除去
        boardcast(JSON.stringify({
            type: 'chatterList',
            list: getAllChatter()
        }))
    });

    //错误处理
    connect.on('error', (err) => {
        console.log(err);
    })

}).listen(3000, () => {
    console.log("running")
});

ejs.renderFile('./index.html', {
        title: 'ejs-index', // 渲染的数据key: 对应到了ejs中的title
        index: '首页'
    }, // 渲染的数据key: 对应到了ejs中的index
    (err, data) => {
        if (err) {
            console.log(err);
        } else {
            // console.log(data);
            router.get("/", async ctx => {
                ctx.body = data;
            })
        }
    });


app.use(router.routes());
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`server started osn ${port}`)
})