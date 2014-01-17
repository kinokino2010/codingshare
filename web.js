
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var connect = express.connect;//require('connect');
var SessionSockets=require('session.socket.io');

var app = express();

var codeshare=require('./codingshare');

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var store = new express.session.MemoryStore();
app.use(express.cookieParser());
app.use(express.session({
    store: store,
    secret: "hogehoge"
}));

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var parseCookie = express.cookieParser("hogehoge");


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// var room=new codeshare.Room();

// app.post('/login',function(req,res){
// 	var user=room.userlist.add(req.body.name);
// 	req.session.userid=user.id;
// 	res.redirect('/');
// });

app.get('/', routes.index);
app.post('/create', function(req,res){
	var room=codeshare.create(req.body.roomtitle);
	room.listen(io,sessionSockets);
	res.redirect('/room-'+room.id);
});

app.get(/^\/room\-([0-9a-z]+)/,function(req,res){
	var roomid=req.params[0];
	var room=codeshare.getRoom(roomid);
	if(room){
		var user=room.userlist.get(req.session.userid);
		if(user){
			res.render('room',{ title:room.title,roomid:room.id } );
		}else{
			res.render('login',{ title:room.title,roomid:room.id } );
		}
	}else{
		res.render('index', { title: 'Code Share',error:'Room not exists.' });
	}
});

app.post('/login',function(req,res){
	var room=codeshare.getRoom(req.body.roomid);
	if(room){
		var user=room.userlist.add(req.body.name)
		req.session.userid=user.id;
		res.redirect('/room-'+room.id);
	}else{
		res.render('index', { title: 'Code Share',error:'Room not exists.' });
	}
});


// app.get('/', function(req, res){
// 	var userid=req.session.userid;
// 	var user=room.userlist.get(userid);
// 	if( user==undefined ){
// 		res.render('login.ejs', { title:"Code Share" });
// 	}else{
// 		res.render('index.ejs', { title:"Code Share",user:user.name });
// 	}
// });


//app.get('/users', user.list);

server=http.createServer(app);
var socketio=require('socket.io');
var io=socketio.listen(server);
//io.set('transports',['xhr-polling']);


var sessionSockets=new SessionSockets(io,store,parseCookie);
//room.listen(io,sessionSockets);

server.listen(app.get('port'),function(){
	console.log('Express server listening on port ' + app.get('port'));
});

