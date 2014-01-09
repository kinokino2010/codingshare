
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
//var user = require('./routes/user');
var http = require('http');
var path = require('path');
var connect = express.connect;//require('connect');
var SessionSockets=require('session.socket.io');

var app = express();

var codeshare=require('./codeshare');

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

//var document=new ace.Document("");

var room=new codeshare.Room();


// var users={
// 	data:[],
// 	count:0,
// 	owner:-1,
// 	add:function(name){
// 		var user={
// 			id:this.data.length,
// 			name:name
// 		}
// 		if( this.count==0 ){
// 			this.owner=user.id;
// 		}
// 		this.data[this.data.length]=user;
// 		this.count++;

// 		console.log( 'add user', name );
// 		return user;
// 	},
// 	get:function(id){
// 		return this.data[id];
// 	},
// 	remove:function(user){
// 		console.log( 'remove user', user.name );

// 		delete this.data[user.id];
// 		if(this.owner==user.id){
// 			this.owner=-1;
// 			for( i in this.data ){
// 				this.owner=i;
// 				break;
// 			}
// 		}
// 		this.count--;
// 	},
// 	names:function(){
// 		var obj={};
// 		for( i in this.data ){
// 			obj[i]=this.data[i].name;
// 		}
// 		return obj;
// 	}
// };

app.post('/login',function(req,res){
	var user=room.userlist.add(req.body.name);
	req.session.userid=user.id;
	res.redirect('/');
});

//app.get('/', routes.index);
app.get('/', function(req, res){
	var userid=req.session.userid;
	var user=room.userlist.get(userid);
	if( user==undefined ){
		res.render('login.ejs', { title:"Code Share" });
	}else{
		res.render('index.ejs', { title:"Code Share",user:user.name });
	}
});


//app.get('/users', user.list);

server=http.createServer(app);
var socketio=require('socket.io');
var io=socketio.listen(server);
io.set(‘transports’,['xhr-polling']);


var sessionSockets=new SessionSockets(io,store,parseCookie);
room.listen(io,sessionSockets);

server.listen(app.get('port'),function(){
	console.log('Express server listening on port ' + app.get('port'));
});



// sessionSockets.on('connection',function(err,client,session){

// 	if(err){
// 		console.log(err);
// 	}else{

// 		if( session && ('userid' in session) ) {
// 			setClient(client,session);

// 	        var user=users.get(session.userid);
// 	        var data={
// 	        	owner:users.owner,
// 	        	list:users.names()
// 	        };
// 	        // 自分に送る
// 			client.emit("login",{data:user});

// 			// 全員に送る
// 			io.sockets.emit("userlist",{data:data});

// 	        // 自分に送る
// 			client.emit("document",{data:document.getValue()});
// 		}
// 	}
// })

// function setClient(client,session){

// 	var user=users.get(session.userid);

// 	client.on('edit', function(e){
// 		document.applyDeltas([e.data]);
// 		// 自分以外に送る
// 		client.broadcast.emit("edit",{data : e.data });
// 	});

// 	client.on('disconnect', function () {
// 		users.remove( user );
//         var data={
//         	owner:users.owner,
//         	list:users.names()
//         };

// 		// 全員に送る
// 		io.sockets.emit("userlist",{data:data});
// 	});

// }

