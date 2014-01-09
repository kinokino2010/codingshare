(function(exports){

	var ace = require('./ace');

	var UserList = function(){
		this.data=[];
		this.count=0;
		this.owner=-1;
	};

	(function(){

		this.add=function(name){
			var user={
				id:this.data.length,
				name:name
			}
			if( this.count==0 ){
				this.owner=user.id;
			}
			this.data[this.data.length]=user;
			this.count++;

			console.log( 'add user', name );
			return user;
		};
		this.get=function(id){
			return this.data[id];
		};

		this.remove=function(user){
			console.log( 'remove user', user.name );

			delete this.data[user.id];
			if(this.owner==user.id){
				this.owner=-1;
				for( i in this.data ){
					this.owner=i;
					break;
				}
			}
			this.count--;
		};

		this.names=function(){
			var obj={};
			for( i in this.data ){
				obj[i]=this.data[i].name;
			}
			return obj;
		};

	}).call(UserList.prototype);

	var Room = function(){
		this.userlist=new UserList();
		this.id=new Date().getTime();
		this.document=new ace.Document("");
	};

	(function(){

		this.listen=function(io,sessionSockets){
			var this_=this;
			sessionSockets.on('connection',function(err,socket,session){
			//sessionSockets.of('/'+id).on('Connect',function(err,socket,session){
		        console.log("recv","connection");
				if(err){
					console.log(err);
					if(socket){
				        console.log("disconnection");
						socket.disconnect();
					}
				}else{

					if( session && ('userid' in session) ) {
						this_.client(io,socket,session);

						var user=this_.userlist.get(session.userid);
						var data={
							owner:this_.userlist.owner,
							list:this_.userlist.names()
						};
				        // 自分に送る
				        console.log("emit","login");
				        socket.emit("login",{data:user});

						// 全員に送る
				        console.log("emit","userlist");
						io.sockets.emit("userlist",{data:data});

				        // 自分に送る
				        console.log("emit","document");
				        socket.emit("document",{data:this_.document.getValue()});
				    }
				}
			});
		};

		this.client=function(io,socket,session){
			var this_=this;
			var user=this_.userlist.get(session.userid);

			socket.on('edit', function(e){
		        console.log("recv","edit");
				this_.document.applyDeltas([e.data]);
				// 自分以外に送る
		        console.log("emit","edit");
				socket.broadcast.emit("edit",{data : e.data });

				console.log("document",this_.document.getValue());
			});

			socket.on('changeowner', function(e){
		        console.log("recv","changeowner");

		        if( this_.userlist.owner==user.id ){
			        var owner=this_.userlist.get(e.data);
			        if( owner ){
			        	this_.userlist.owner=owner.id;
			        }

					var data={
						owner:this_.userlist.owner,
						list:this_.userlist.names()
					};

					// 全員に送る
					        console.log("emit","userlist");
					io.sockets.emit("userlist",{data:data});
		        }
			});

			socket.on('disconnect', function () {
		        console.log("recv","disonnect");
				this_.userlist.remove( user );
				var data={
					owner:this_.userlist.owner,
					list:this_.userlist.names()
				};

				// 全員に送る
				        console.log("emit","userlist");
				io.sockets.emit("userlist",{data:data});
			});
		};

	}).call(Room.prototype);

	exports.Room = Room;

})(module.exports);