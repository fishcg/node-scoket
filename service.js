const express = require('express')
const R = require("ramda");
const Mutils = require('./lib/mutils')
const path = require('path')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use('/public', express.static('public'))
app.use('/', function(req, res){
    res.sendFile(__dirname + '/chat-room.html');
})

// 在线用户
var users = []

var connectionHandle = function (socket) {
    // 新增在线用户
    var user = {
        // @todo: 之后用户昵称从 cookie 取
        name: socket.id.substring(0, 5),
        socketID: socket.id,
    }
    users.push(user)
    // 提示 xx 上线
    io.emit('online', { user: user, users: users })
    // 提示连接成功
    io.to(socket.id).emit('connect success', { user: user, users: users })
    // 下线处理
    socket.on('disconnect', function () {
        let index = R.findIndex(R.propEq("socketID", socket.id))(users)
        if (index !== -1) {
            // 从在线列表中剔除
            users.splice(index, 1)
        }
        io.emit('online', { user: user, users: users })
    })
    socket.on('send msg', function (msg) {
        msg.name = user.name
        msg.date = Mutils.date('yyyy-MM-dd HH:mm:ss', Math.floor(Date.now() / 1000))
        io.emit('send msg', msg)

    })
    socket.on('writing', function (msg) {
        io.emit('writing', msg)
    })
    socket.on('blur', function (msg) {
        io.emit('blur', msg)
    })
}

// io.of('/' + 'chat1').on('connection', connectionHandle)
io.on('connection', connectionHandle)



http.listen(8888, function(){
  console.log('listening on *: 8888')
})