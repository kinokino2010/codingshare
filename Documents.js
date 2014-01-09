(function(export){

	Room = function(){
		this.userlist=new UserList();
		this.id=new Date().gettime();
	}

	(function(){

		this.listen=function(){
			SessionSockets.on('Connect',function(err,socket,session){
				if(err){
					console.log(err);
				}else{

					if( session && ('userid' in session) ) {
						setClient(client,session);

						var user=users.get(session.userid);
						var data={
							owner:users.owner,
							list:users.names()
						};
				        // 自分に送る
				        client.emit("login",{data:user});

						// 全員に送る
						io.sockets.emit("userlist",{data:data});

				        // 自分に送る
				        client.emit("document",{data:document.getValue()});
				    }
				} 

			}
		};

		this.setCIient=function(client,session){

			var user=userlist.get(session.userid);

			client.on('edit', function(e){
				document.applyDeltas([e.data]);
				// 自分以外に送る
				client.broadcast.emit("edit",{data : e.data });
			});

			client.on('disconnect', function () {
				users.remove( user );
				var data={
					owner:users.owner,
					list:users.names()
				};

				// 全員に送る
				io.sockets.emit("userlist",{data:data});
			});
		};

	}).call(Room.protetype);

})()