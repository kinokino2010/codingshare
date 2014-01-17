(function(exports){

	var ace = require('./ace');

	var UserList = function(){
		this.userlist={};
		this.count=0;
		this.id=0;
		this.owner=-1;
	};

	(function(){

		this.add=function(name){
			var user={
				id:this.id,
				name:name
			}
			if( this.count==0 ){
				this.owner=user.id;
			}
			this.id++;
			this.count++;
			this.userlist[user.id]=user;

			console.log( 'add user', name );
			console.log( 'userlist', this.userlist );
			return user;
		};
		this.get=function(id){
			return this.userlist[id];
		};

		this.remove=function(user){
			if(user){
				console.log( 'remove user', user.name );
				delete this.userlist[user.id];
				if(this.owner==user.id){
					this.owner=-1;
					for( i in this.userlist ){
						this.owner=i;
						break;
					}
				}
				this.count--;
				console.log( 'userlist', this );
			}
		};

		this.names=function(){
			var obj={};
			for( i in this.userlist ){
				obj[i]=this.userlist[i].name;
			}
			return obj;
		};

	}).call(UserList.prototype);

	var Room = function(title){
		this.title=title;
		this.userlist=new UserList();
		this.document=new ace.Document("");
	};

	(function(){

		this.listen=function(io,sessionSockets){
			var this_=this;
			sessionSockets.of('/room'+this.id).on('connection',function(err,socket,session){
			//sessionSockets.of('/'+id).on('Connect',function(err,socket,session){
		        console.log(this_.id,"recv","connection");
				if(err){
					console.log(err);
					if(socket){
						socket.disconnect();
					}
				}else{
					if( session && ('userid' in session) ) {
						var user=this_.userlist.get(session.userid);
						if(user){
							var data={
								owner:this_.userlist.owner,
								list:this_.userlist.names()
							};
					        // 自分に送る
					        console.log(this_.id,"emit","login");
					        socket.emit("login",{data:user});

							// 全員に送る
					        console.log(this_.id,"emit","userlist");
							socket.emit("userlist",{data:data});
							socket.broadcast.emit("userlist",{data:data});

					        // 自分に送る
					        console.log(this_.id,"emit","document");
					        socket.emit("document",{data:this_.document.getValue()});

							this_.start(io,socket,user);
						}else{
					        console.log(this_.id,"user info not found");
							socket.disconnect();
						}
				    }else{
				        console.log(this_.id,"session info not found");
						socket.disconnect();
				    }
				}
			});
		};

		this.start=function(io,socket,user){
			var this_=this;

			socket.on('edit', function(e){
		        console.log(this_.id,"recv","edit");
				this_.document.applyDeltas(e.data);

				// 自分以外に送る
		        console.log(this_.id,"emit","edit");
				socket.broadcast.emit("edit",{data : e.data });

				console.log(this_.id,"document",this_.document.getValue());
			});

			socket.on('changeowner', function(e){
		        console.log(this_.id,"recv","changeowner");

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
			        console.log(this_.id,"emit","userlist");
					socket.emit("userlist",{data:data});
					socket.broadcast.emit("userlist",{data:data});
		        }
			});

			socket.on('disconnect', function () {
		        console.log(this_.id,"recv","disonnect");
				this_.userlist.remove( user );
				var data={
					owner:this_.userlist.owner,
					list:this_.userlist.names()
				};

				// 全員に送る
		        console.log(this_.id,"emit","userlist");
				socket.emit("userlist",{data:data});
				socket.broadcast.emit("userlist",{data:data});
			});
		};

	}).call(Room.prototype);

	RoomList = function(){
		this.roomlist={};
		this.title='No Title';
	};

	(function(){
		this.create=function(title){
			var room=new Room(title);

			do{
				room.id=parseInt((""+new Date().getTime()).split('').reverse().join('')).toString(36).slice(-8);
			}while( this.get(room.id) );

			this.roomlist[room.id]=room;

			console.log('create room : '+room.title);

			return room;
		};
		this.get=function(id){
			if( id in this.roomlist){
				return this.roomlist[id];
			}
			return null;
		}
		this.remove=function(room){
			if( room.id in this.roomlist){
				console.log('remove room : '+room.title);
				delete this.roomlist[room.id];
			}
		}
	}).call(RoomList.prototype);

	var roomlist=new RoomList();

	exports.create=function(name){
		return roomlist.create(name);
	};

	exports.getRoom=function(id){
		return roomlist.get(id);
	}

//	exports.Room = Room;

})(module.exports);