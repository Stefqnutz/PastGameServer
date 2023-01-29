    // Welcome to the Past Server Source Code

    // If you are planning on running a server and not do anything else, please don't modify this file.

    // If you are developing a plugin, comments throughout the code will help you understand everything better.
    // Please do not modify the way the server handles connections, disconnections, data as that will break everything.
    // Things that you MUSTN'T modify:
    // Movement
    // Data
    // Instances
    // Connections
    // Disconnections


    var dgram = require("dgram");
    var port = 3000;
    var serverName = "[PAST Official Server] Nr. 1"; // (Max Char Limit: 32) (# not allowed)
    var gamemode = "Vanilla"; // WARNING: Do NOT modify this if this isn't a modded server, if it is feel free to change it. (Max Char Limit: 16) (# not allowed)
    var publicServer = true; // If false, your server wont show up in the server list in-game.

    // Side note: If you are hosting a server on your local machine, it will not show up in the server list.

    var server = dgram.createSocket("udp4");

    var loadedMap = false; // Never change this, if you do, you will have issues.

    var sockets = [];
    var instances = [];

    var playerCounter = 0;
    var instanceCounter = 0;

    // Math


    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }


    function sendPacket(data){ // Send data to every client connected
        for (var client in sockets) {
            client = JSON.parse(client);
            var port = client[1];
            var address = client[0];
            server.send(data, port, address);
        }
    }

    function getID(rinfo){ // Get the ID of a specific client 
        for (var client in sockets) {
            client = JSON.parse(client);
            var id = client[2];
            var address = client[0];
            if (rinfo == address){
                return id;
            }
        }
    }

    function getHealth(rinfo){ // Get the health of a specific client 
        for (var client in sockets) {
            client = JSON.parse(client);
            var health = client[3];
            var address = client[0];
            if (rinfo == address){
                return health;
            }
        }
    }

    

    function getInstances(port, address){ 
        for (var client in instances) {
            client = JSON.parse(client);
            var name = client[0];
            var x = client[1];
            var y = client[2];
            server.send("INSTANCE_REPLICATE_NAME:" + name, port, address);
            server.send("INSTANCE_REPLICATE_X:" + x, port, address);
            server.send("INSTANCE_REPLICATE_Y:" + y, port, address);
            if (name != "obj_bullet") {
                server.send("INSTANCE_ID:" + String(client[3]), port, address);
            } else {
                server.send("INSTANCE_ID:" + String(client[10]), port, address);
            }
        }
    }

    function sendMessage(message){ // Send a broadcast to all clients, will show up in-game as a global message.
        for (var client in sockets) {
            client = JSON.parse(client);
            var port = client[1];
            var address = client[0];
            server.send("Message:#" + message, port, address);
        }
    }

    var object;
    var player;  
    var damageCause;
    var playerid;


    server.on("message",function(msg, rinfo)
    {
        // msg = data that we get from clients
        // rinfo = client that we are receieving data from
        data = String(msg);
        
        console.log("data: " + String(msg)); // get data from clients



        if (data.includes("Client:Connected")){ // if the client connected
            playerCounter+=1;
            sockets[JSON.stringify([rinfo.address, rinfo.port, playerCounter, rinfo.health = 100])] = true; // add client to socket list
            console.table(sockets);
            sendPacket("PLAYER_COUNTER:" + String(playerCounter));
            sendPacket("PLAYER_SPAWN");

            // Feel free to modify this
           // server.send("PLAYER_INVENTORY_UPDATE:Sten", rinfo.port, rinfo.address);
            server.send("PLAYER_INVENTORY_UPDATE:Kar98k", rinfo.port, rinfo.address);
            server.send("PLAYER_HEALTH:" + String(getHealth(rinfo.address)), rinfo.port, rinfo.address);
            server.send("PLAYER_INVENTORY_UPDATE:BuildingPlan", rinfo.port, rinfo.address);
          //  server.send("PLAYER_INVENTORY_UPDATE:Bullets", rinfo.port, rinfo.address);
            sendMessage("[color=c_red](SERVER) someone has joined the server![/color]");
            sendMessage("[color=c_green](SERVER) green thing![/color]");
        }

        if (data.includes("Send:Message")) {
            sendMessage("[color=c_blue](SERVER) this is a message![/color]");
        }

        if (data.includes("Client:Username")) {
            username = data.replace("Client:Username:");
            
        }

        sendPacket("PLAYER_COUNTER:" + String(playerCounter)); // Update the player counter for all clients

        if (data.includes("Client:Disconnected")){
            playerCounter -= 1;
            sendPacket("PLAYER_DISCONNECT:" + String(getID(rinfo.address)));
            delete sockets[JSON.stringify([rinfo.address, rinfo.port, getID(rinfo.address), getHealth(rinfo.address)])];
            console.table(sockets);
        }



        // Handling movement

        if (data.includes("Player:Movement:")) {
            player = data.replace("Player:Movement:", "");
            movement = JSON.parse(player);
            sendPacket("PLAYER_MOVEMENT:" + JSON.stringify(movement));
        }

        // Instances

        if (data.includes("Instance:Create:")) {
            objectstring = data.replace("Instance:Create:", "");
            object = JSON.parse(objectstring);  
            instanceCounter += 1;
            if (object.Object != "obj_bullet"){
                instances[JSON.stringify([object.Object, object.ObjectX, object.ObjectY, object.ObjectID = instanceCounter])] = true; // add instance to instances list   
            } else {
                instances[JSON.stringify([object.Object, object.ObjectX, object.ObjectY, object.ObjectDirection, object.ObjectDamage, object.ObjectSpeed, object.ObjectZ, object.ObjectZDir, object.BulletType, object.ShooterID, object.ObjectID = instanceCounter])] = true; // add instance to instances list   
            }       
            sendPacket("INSTANCE_CREATE:" + JSON.stringify(object));
        }

        if (data.includes("Instance:Destroy:")) {
            instanceCounter -= 1;
            objectdestroystring = data.replace("Instance:Destroy:", "");
            objectdestroy = JSON.parse(objectdestroystring); 
            objectid = objectdestroy.ObjectID
            delete instances[JSON.stringify([objectdestroy.Object, objectdestroy.ObjectX, objectdestroy.ObjectY, objectid])]; 
            console.table(instances);
            sendPacket("INSTANCE_DESTROY:" + JSON.stringify(objectdestroy));
        }   

        if (data.includes("Instance:Replicate")) {
            server.send("INSTANCE_REPLICATE:" + getInstances(rinfo.port, rinfo.address), rinfo.port, rinfo.address);
        }

        // Health

        if (data.includes("Damage:Cause:")) {
            damageCause = data.replace("Damage:Cause:", "");
        }

        if (data.includes("Player:Health:Update")) {
            newHpString = data.replace("Player:Health:Update:", "");
            newHp = parseInt(newHpString);
            if (damageCause.includes("SELF")) {
                playerid = getID(rinfo.address);
                delete sockets[JSON.stringify([rinfo.address, rinfo.port, getID(rinfo.address), getHealth(rinfo.address)])];
                sockets[JSON.stringify([rinfo.address, rinfo.port, playerid, newHp - 10])] = true;
                server.send("PLAYER_HEALTH:" + String(getHealth(rinfo.address)), rinfo.port, rinfo.address);
            }
            if (damageCause.includes("Kar98k")) {
                playerid = getID(rinfo.address);
                delete sockets[JSON.stringify([rinfo.address, rinfo.port, getID(rinfo.address), getHealth(rinfo.address)])];
                sockets[JSON.stringify([rinfo.address, rinfo.port, playerid, newHp - 95])] = true;
                server.send("PLAYER_HEALTH:" + String(getHealth(rinfo.address)), rinfo.port, rinfo.address);
            }            
        }

        if (data.includes("Player:Respawn")) {
            playerid = getID(rinfo.address);
            delete sockets[JSON.stringify([rinfo.address, rinfo.port, getID(rinfo.address), getHealth(rinfo.address)])];
            sockets[JSON.stringify([rinfo.address, rinfo.port, playerid, 100])] = true;
            server.send("PLAYER_HEALTH:" + String(getHealth(rinfo.address)), rinfo.port, rinfo.address);            
        }

        
    });


    server.on('listening', () => {
        const address = server.address();
        console.log(`started server: ${address.address}:${address.port}`);
        if (publicServer) {
            server.send("NAME:" + serverName, 6000, "3.75.158.163");
            server.send("GAMEMODE:" + gamemode, 6000, "3.75.158.163");
        }
      });

      if (!loadedMap) {
        console.log("Generating map...");

        if (instanceCounter < 1000) {
            for (var i = 0; i < 1000; i++) { // Tree
                instanceCounter++;
                instances[JSON.stringify([objectName = 'obj_tree', objectX = getRandomInt(10000), objectY = getRandomInt(10000), objectID = instanceCounter])] = true;              
            } 
        }
        if (instanceCounter >= 1000) {

            for (var i = 0; i < 500; i++) { // Barrel
                instanceCounter++;
                instances[JSON.stringify([objectName = 'obj_barrel', objectX = getRandomInt(10000), objectY = getRandomInt(10000), objectID = instanceCounter])] = true; 
                
            }     
        }    

        if (instanceCounter >= 1500) {
            loadedMap = true;
            console.log("Generated map!");
        }


      }




    server.bind(port);
