angular.module('starter.services', [])
.factory('canvasService', function($filter, $q){
    var renderer
    ,loader = new PIXI.loaders.Loader()    
    ,world
    ,elements = [] 
    ,input
    ,loadedDropoffs = []
    ,viewWidth = window.innerWidth
    ,viewHeight = 750
    ,viewportBounds = Physics.aabb(0, 0, window.innerWidth, 750)
    ,edgeBounce
    ,colors = [
        ['0x268bd2', '0x0d394f']
        ,['0xc93b3b', '0x561414']
        ,['0xe25e36', '0x79231b']
        ,['0x6c71c4', '0x393f6a']
        ,['0x58c73c', '0x30641c']
        ,['0xcac34c', '0x736a2c']
    ]
    ,styles = {
        'circle': {
          fillStyle: colors[0][0],
          lineWidth: 1,
          strokeStyle: colors[0][1],
          angleIndicator: colors[0][1]
        }
        ,'rectangle': {
          fillStyle: colors[1][0],
          lineWidth: 1,
          strokeStyle: colors[1][1],
          angleIndicator: colors[1][1]
        }
    }
    ,icons = [
        {name:"user", url:"img/user.png"},
        {name:"treat", url:"img/treat.png"},
        {name:"tip", url:"img/tip.png", category:"tipIcon"},
        {name:"cheer", url:"img/cheer.png"},
        {name:"host", url:"img/host.png"},
        {name:"follow", url:"img/follow.png"},
        {name:"sub", url:"img/sub.png"},
        {name:"resub", url:"img/sub-1.png"},
        {name:"sponsor", url:"img/sponsor.png"},
        {name:"silver", url:"img/silver-md.png", category:"tipIcon"},
        {name:"bronze", url:"img/bronze-sm.png", category:"tipIcon"},
        {name:"gold", url:"img/gold-lg.png", category:"tipIcon"},
        {name:"diamond", url:"img/diamond-xl.png", category:"tipIcon"},
        {name:"dollar", url:"img/dollar.png", category:"tipIcon"}        
    ]
    ,cups = [
        {name:"Cup1", url:"img/Cup1.png", yOff:100, yAnch: 0.85, height:520, width:110, angle:Math.PI/40},
        {name:"Cup2", url:"img/Cup2.png", yOff:100, yAnch: 0.85, width:70, angle:Math.PI/20},
        {name:"Cup3", url:"img/Cup3.png", yOff:100, yAnch: 0.85, height:400, width:150, angle:Math.PI/30},
        {name:"Cup4", url:"img/Cup4.png", yOff:150, yAnch: 0.57, height:350, width:150, angle:-Math.PI/40},
        {name:"Cup5", url:"img/Cup5.png", yOff:250, yAnch: 0.3, height:250, width:40, angle:Math.PI/4},
        {name:"Cup6", url:"img/Cup6.png", yOff:100, yAnch: 0.72, height:360, width:130, xAnch:0.32},
        {name:"Cup7", url:"img/Cup7.png", yOff:100, yAnch: 0.85, height:550, width:65, angle:Math.PI/30},
        {name:"Cup8", url:"img/Cup8.png", yOff:200, yAnch: 0.6, height:400, width:110, angle:-Math.PI/40}
    ]
    ,bits = [
        {name:"1+", folder:"img/bits/1", noFrames: 71, frames:[]},
        {name:"100+", folder:"img/bits/100", noFrames: 64, frames:[]},
        {name:"1000+", folder:"img/bits/1000", noFrames: 59, frames:[]},
        {name:"5000+", folder:"img/bits/5000", noFrames: 71, frames:[]},
        {name:"10000+", folder:"img/bits/10000", noFrames: 35, frames:[]}
    ]
    ,dropOffs = [
        {name:"Angel", folder:"img/dropoff/Angel", noFrames: 6, frames:[], height:40, width:47},
        {name:"Balloon", folder:"img/dropoff/Balloon", noFrames: 49, frames:[], height:45, width:45},
        {name:"Bird", folder:"img/dropoff/Bird", noFrames: 9, frames:[], height:40, width:81},
        {name:"Blimp", folder:"img/dropoff/Blimp", noFrames: 4, frames:[], height:28, width:54},
        {name:"Cloud", folder:"img/dropoff/Cloud", noFrames: 1, frames:[], height:35, width:62},
        {name:"Helicopter", folder:"img/dropoff/Helicopter", noFrames: 4, frames:[], height:40, width:40},
        {name:"HelicopterBlue", folder:"img/dropoff/HelicopterBlue", noFrames: 2, frames:[], height:40, width:40},
        {name:"Pig", folder:"img/dropoff/Pig", noFrames: 4, frames:[], height:40, width:53},
        {name:"Plane", folder:"img/dropoff/Plane", noFrames: 2, frames:[], height:35, width:68},
        {name:"Rocket", folder:"img/dropoff/Rocket", noFrames: 8, frames:[], height:35, width:56},
        {name:"Star", folder:"img/dropoff/Star", noFrames: 4, frames:[], height:36, width:72},
        {name:"UFO", folder:"img/dropoff/UFO", noFrames: 15, frames:[], height:30, width:60},
    ]
    ;

    renderer = Physics.renderer('pixi', { 
        el: $(".demo-bg")[0], 
        styles: styles 
    });

    world = Physics({
        // timestep
        timestep: 6,
        // maximum number of iterations per step
        maxIPF: 4,
        // default integrator
        integrator: 'verlet',
        // is sleeping disabled?
        sleepDisabled: false,
        // speed at which bodies wake up
        sleepSpeedLimit: 0.1,
        // variance in position below which bodies fall asleep
        sleepVarianceLimit: 2,
        // time (ms) before sleepy bodies fall asleep
        sleepTimeLimit: 500
    });

    world.add(renderer);
    
    // render on each step
    world.on('step', function () {
        world.render();
    });
    
    // constrain objects to these bounds
    edgeBounce = Physics.behavior('edge-collision-detection', {
        aabb: viewportBounds
        ,restitution: 0.4
        ,cof: 0.5
    });

    // resize events
    window.addEventListener('resize', function (e) {
        // as of 0.7.0 the renderer will auto resize... so we just take the values from the renderer
        viewportBounds = Physics.aabb(0, 0, renderer.width, renderer.height);
        // update the boundaries
        edgeBounce.setAABB(viewportBounds);
        var found = $filter('filter')(world._bodies, {name:'glass'});
        if(found.length > 0){
            var foundCup = $filter('filter')(cups, {url:found[0].view._texture.baseTexture.imageUrl});
            found.forEach(function(obj){
                obj.state.pos.x = renderer.width/2;             
                obj.state.pos.y = renderer.height - foundCup[0].yOff;             
            });
        }
    }, true);

    // add behaviors to the world
    world.add([
        Physics.behavior('interactive', { el: world.renderer().container })
        ,Physics.behavior('constant-acceleration')
        ,Physics.behavior('body-impulse-response')
        ,Physics.behavior('body-collision-detection')
        ,Physics.behavior('sweep-prune')               
    ]); 

    var attractor = Physics.behavior('attractor', {
      order: 0,
      max:200,
      strength: 0.002
    });
    
    world.on({
      'interact:poke': function( pos ){
        if(pos.hasOwnProperty("virtual") && pos.virtual){
            world.wakeUpAll();
            attractor.position( pos );
            world.add( attractor );
        }
      }
      ,'interact:move': function( pos ){
        attractor.position( pos );
      }
      ,'interact:release': function(){
        world.wakeUpAll();
        world.remove( attractor );
      }
    });

    Physics.util.ticker.on(function( time ) {
        TWEEN.update();
        world.step( time );
    });   
    
    return {
        createTextElements:function(inp){
            input = inp;
            elements = [];            
            var deferred = $q.defer()
            ,resLoaded = deferred.promise
            ;
            input.actions.forEach(function(obj){                   
                amt = parseInt(obj.amount);                    
                switch(obj.value){
                    case 'tp' : 
                              if(amt >= parseInt(input.minTips)){
                                  elements.push({
                                      name:'user', 
                                      type:'sprite', 
                                      height:20
                                    },{
                                      name:'heading', 
                                      type:'text', 
                                      value: input.user + " has tipped $" + amt
                                  });
                                  if(amt >= 1 && amt <= 9){
                                      elements.push(
                                        {name:"dollar", type:'sprite', height:18, width:36},
                                        {name:"bronze", type:'sprite', height:28}  
                                      );
                                  }else if(amt >= 10 && amt <= 49){
                                      elements.push(
                                        {name:"dollar", type:'sprite', height:25, width:50},
                                        {name:"dollar", type:'sprite', height:18, width:36},
                                        {name:"silver", type:'sprite',  height:35}
                                      );
                                  }else if(amt >= 50 && amt <= 99){
                                      elements.push(
                                        {name:"dollar", type:'sprite', height:30, width:60},
                                        {name:"dollar", type:'sprite', height:22, width:44},
                                        {name:"dollar", type:'sprite', height:18, width:36},
                                        {name:"gold", type:'sprite',  height:40}
                                      );
                                  }else if(amt >= 100){
                                      elements.push(
                                        {name:"dollar", type:'sprite', height:30, width:60},
                                        {name:"dollar", type:'sprite', height:32, width:64},
                                        {name:"diamond", type:'sprite',  height:45}
                                      );
                                  }
                                  elements.push({type:'linebreak'});   
                              }
                              break;
                    case 'sp' : 
                              elements.push({
                                  name:'user', 
                                  type:'sprite', 
                                  height:20
                                },{
                                  name:'heading', 
                                  type:'text', 
                                  value: input.user + " has sponsored " + amt
                              });
                              if(amt >= 1 && amt <= 9){
                                elements.push(
                                  {name:"sponsor", type:'sprite', height:18},
                                  {name:"sponsor", type:'sprite', height:25}
                                );
                              }else if(amt >= 10 && amt <= 49){
                                elements.push(
                                  {name:"sponsor", type:'sprite', height:22},
                                  {name:"sponsor", type:'sprite', height:28},
                                  {name:"sponsor", type:'sprite', height:35}
                                );
                              }else if(amt >= 50 && amt <= 99){
                                elements.push(
                                  {name:"sponsor", type:'sprite', height:30},
                                  {name:"sponsor", type:'sprite', height:35},
                                  {name:"sponsor", type:'sprite', height:32}
                                );
                              }else if(amt >= 100){
                                elements.push(
                                  {name:"sponsor", type:'sprite', height:35},
                                  {name:"sponsor", type:'sprite', height:40},
                                  {name:"sponsor", type:'sprite', height:45},
                                  {name:"sponsor", type:'sprite', height:42}
                                );
                              }
                              elements.push({type:'linebreak'});   
                              break;
                    case 'bt' : 
                              if(amt >= parseInt(input.minBits)){
                                  elements.push({
                                      name:'user', 
                                      type:'sprite', 
                                      height:20
                                    },{
                                      name:'heading', 
                                      type:'text', 
                                      value: input.user + " Cheer Message!"
                                  });
                                  if(amt >= 1 && amt <= 99){
                                      elements.push({type:'movieclip', name:"1+", height:18});    
                                  }else if(amt >= 100 && amt <= 999){
                                      elements.push({type:'movieclip', name:"100+", height:25});
                                  }else if(amt >= 1000 && amt <= 4999){
                                      elements.push({type:'movieclip', name:"1000+", height:30});
                                  }else if(amt >= 5000 && amt <= 9999){
                                      elements.push({type:'movieclip', name:"5000+", height:45});
                                  }else if(amt >= 10000){
                                      elements.push({type:'movieclip', name:"10000+", height:55});
                                  }
                                  elements.push({name:"cheer", type:'sprite', height:35});
                                  elements.push({type:'linebreak'});   
                              }
                              break;
                    case 'sb' : 
                              elements.push({
                                  name:'user', 
                                  type:'sprite', 
                                  height:20
                                },{
                                  name:'heading',
                                  type:'text',
                                  value: input.user + " has subscribed for " + amt + " months!"
                              })
                              elements.push({name:"sub", type:'sprite', height:35});                          
                              elements.push({type:'linebreak'});                                     
                              break;
                    case 'tr' : 
                              elements.push({
                                  name:'user', 
                                  type:'sprite', 
                                  height:20
                                },{
                                  name:'heading',
                                  type:'text',
                                  value: input.user + " sent a treat!"
                              })
                              elements.push({name:"treat", type:'sprite', height:35});                          
                              elements.push({type:'linebreak'});   
                              break;
                    case 'fl' : 
                              elements.push({
                                  name:'user', 
                                  type:'sprite', 
                                  height:20
                                },{
                                  name:'heading',
                                  type:'text',
                                  value: input.user + " followed!"
                              })
                              elements.push({name:"follow", type:'sprite', height:35}); 
                              elements.push({type:'linebreak'});   
                              break;
                    case 'ho' : 
                              elements.push({
                                  name:'user', 
                                  type:'sprite', 
                                  height:20
                                },{
                                  name:'heading',
                                  type:'text',
                                  value: input.user + " hosted for x" + amt + " viewers!"
                              })
                              elements.push({name:"host", type:'sprite', height:35}); 
                              elements.push({type:'linebreak'});   
                              break;
                }
            });
            for(var i = 0; i < 6; i++){
                //Choose 6 random dropoff gifs
                rand = Math.floor(Math.random() * dropOffs.length-1) + 1;
                elements.push({type:'dropoff', name:dropOffs[rand].name, height:dropOffs[rand].height, width:dropOffs[rand].width});                                
            }

            this.loadResources().then(function(){
                deferred.resolve();
            });

            return $q.when(resLoaded);         
        },
        createRandomElements:function(inp){
            input = inp;    
            elements = [];      
            var deferred = $q.defer()
            ,resLoaded = deferred.promise
            ,iconLength = icons.length
            ,bitLength = bits.length
            ,rand
            ;

            input.actions.forEach(function(obj){                   
                amt = parseInt(obj.amount);                    
                switch(obj.value){
                    case 'tp' : 
                              if(amt >= parseInt(input.minTips)){
                                  if(amt >= 1 && amt <= 9){
                                      elements.push(
                                        {name:"dollar", type:'sprite', height:18, width:36},
                                        {name:"bronze", type:'sprite', height:28}  
                                      );
                                  }else if(amt >= 10 && amt <= 49){
                                      elements.push(
                                        {name:"dollar", type:'sprite', height:25, width:50},
                                        {name:"dollar", type:'sprite', height:18, width:36},
                                        {name:"silver", type:'sprite',  height:35}
                                      );
                                  }else if(amt >= 50 && amt <= 99){
                                      elements.push(
                                        {name:"dollar", type:'sprite', height:30, width:60},
                                        {name:"dollar", type:'sprite', height:22, width:44},
                                        {name:"dollar", type:'sprite', height:18, width:36},
                                        {name:"gold", type:'sprite',  height:40}
                                      );
                                  }else if(amt >= 100){
                                      elements.push(
                                        {name:"dollar", type:'sprite', height:30, width:60},
                                        {name:"dollar", type:'sprite', height:32, width:64},
                                        {name:"diamond", type:'sprite',  height:45}
                                      );
                                  }
                              }
                              break;
                    case 'sp' : 
                              if(amt >= 1 && amt <= 9){
                                elements.push(
                                  {name:"sponsor", type:'sprite', height:18},
                                  {name:"sponsor", type:'sprite', height:25}
                                );
                              }else if(amt >= 10 && amt <= 49){
                                elements.push(
                                  {name:"sponsor", type:'sprite', height:22},
                                  {name:"sponsor", type:'sprite', height:28},
                                  {name:"sponsor", type:'sprite', height:35}
                                );
                              }else if(amt >= 50 && amt <= 99){
                                elements.push(
                                  {name:"sponsor", type:'sprite', height:30},
                                  {name:"sponsor", type:'sprite', height:35},
                                  {name:"sponsor", type:'sprite', height:32}
                                );
                              }else if(amt >= 100){
                                elements.push(
                                  {name:"sponsor", type:'sprite', height:35},
                                  {name:"sponsor", type:'sprite', height:40},
                                  {name:"sponsor", type:'sprite', height:45},
                                  {name:"sponsor", type:'sprite', height:42}
                                );
                              }
                              break;
                    case 'bt' : 
                              if(amt >= parseInt(input.minBits)){
                                  if(amt >= 1 && amt <= 99){
                                      elements.push({type:'movieclip', name:"1+", height:18});    
                                  }else if(amt >= 100 && amt <= 999){
                                      elements.push({type:'movieclip', name:"100+", height:25});
                                  }else if(amt >= 1000 && amt <= 4999){
                                      elements.push({type:'movieclip', name:"1000+", height:30});
                                  }else if(amt >= 5000 && amt <= 9999){
                                      elements.push({type:'movieclip', name:"5000+", height:45});
                                  }else if(amt >= 10000){
                                      elements.push({type:'movieclip', name:"10000+", height:55});
                                  }
                                  elements.push({name:"cheer", type:'sprite', height:35});
                              }
                              break;
                    case 'sb' : 
                              elements.push({name:"sub", type:'sprite', height:35});                          
                              break;
                    case 'tr' : 
                              elements.push({name:"treat", type:'sprite', height:35});                          
                              break;
                    case 'fl' : 
                              elements.push({name:"follow", type:'sprite', height:35}); 
                              break;
                    case 'ho' : 
                              elements.push({name:"host", type:'sprite', height:35}); 
                              break;
                }
            });

            this.loadResources().then(function(){
                deferred.resolve();
            });

            return $q.when(resLoaded);
        },
        createPreviousElements:function(bodies){
            elements = [];          
            var deferred = $q.defer()
            ,resLoaded = deferred.promise
            ;
            elements = bodies;
            this.loadResources().then(function(){
                deferred.resolve();
            });

            return $q.when(resLoaded);     
        },
        loadResources:function(){
            var deferred = $q.defer()
            ,resources = deferred.promise
            ,currLength = 0
            ,newLength = 0
            ;
            for(var name in loader.resources){
                currLength++;
            }
            elements.forEach(function(obj){
                switch(obj.type){
                    case 'sprite' : 
                            var found = $filter('filter')(icons, {name: obj.name}, true);
                            if(!loader.resources.hasOwnProperty(found[0].name))
                                loader.add(found[0].name, found[0].url);
                    break;
                    
                    case 'movieclip' : 
                        var frArr = []; 
                        var found = $filter('filter')(bits, {name: obj.name}, true);
                        for(var i = 0; i < found[0].noFrames; i++){
                            var val = i < 10?"0" + i:i;
                            var currFrame = found[0].folder + "/f000" + val + ".png";
                            if(!loader.resources.hasOwnProperty(currFrame)){
                                loader.add(currFrame);
                            }
                            frArr.push(currFrame);
                        }
                        obj.frames = frArr;
                    break;

                    case 'dropoff' : 
                        var frArr = []; 
                        var found = $filter('filter')(dropOffs, {name: obj.name}, true);
                        for(var i = 0; i < found[0].noFrames; i++){
                            var val = i < 10?"0" + i:i;
                            var currFrame = found[0].folder + "/f000" + val + ".png";
                            if(!loader.resources.hasOwnProperty(currFrame)){
                                loader.add(currFrame);
                            }
                            frArr.push(currFrame);
                        }
                        obj.frames = frArr;
                        loadedDropoffs.push(obj);                
                    break;
                }          
            });
            for(var name in loader.resources){
                newLength++;
            }            
            if(currLength < newLength){
                loader.load();
                loader.once("complete", function(e){
                    deferred.resolve();
                });
            }else{
                deferred.resolve();
            }
            return $q.when(resources);
        },
        createTextBodies:function(inp){
            var xPos = window.innerWidth + 50
            ,yPos = 100
            ,body
            ,found
            ,bodies = []
            ,frArr = []
            ,tmt = 'static'  
            ,j = 1          
            ;

            elements.forEach(function(obj){            
                switch(obj.type){
                    case 'sprite' : 
                        found = $filter('filter')(icons, {name: obj.name}, true);
                        body = Physics.body('circle', {
                            treatment: tmt,                        
                            toDrop:true,
                            mass:obj.height,
                            x: xPos,
                            y: yPos-obj.height/2,
                            radius: obj.height/3
                            ,cof: 0.5
                            ,name:obj.name
                            ,viewType:'sprite'
                            ,restitution:0.7
                            ,view:  renderer.createDisplay('sprite', {
                                texture: found[0].url,
                                anchor: {
                                    x: 0.5,
                                    y: 0.5
                                },
                                height : obj.height,
                                width : obj.width?obj.width:obj.height
                            })
                        });
                        if(obj.name == "dollar"){
                            body.radius = obj.width;
                        }
                        world.add( body ); 
                        bodies.push(body);

                        if(obj.name != "user"){
                            var rand = Math.floor(Math.random() * loadedDropoffs.length-1) + 1;
                            var tempGif = loadedDropoffs[rand];
                            body = Physics.body('circle', {
                                treatment: "static",
                                toDrop:false, 
                                x: xPos,
                                y: yPos-70,
                                viewType:'dropoff',
                                radius: 0.001
                                ,view: renderer.createDisplay('movieclip', {
                                    anchor: {
                                        x: 0.5,
                                        y: 0.5
                                    },
                                    height : tempGif.height,
                                    width : tempGif.width,
                                    frames: tempGif.frames
                                })
                            });
                            world.add( body ); 
                            bodies.push(body);
                        }

                        xPos += body.view.texture.width + 30;
                    break;
                    case 'movieclip' : 
                        body = Physics.body('circle', {
                            treatment: tmt,
                            toDrop:true, 
                            x: xPos,
                            y: yPos-obj.height/3,
                            viewType:'movieclip',
                            radius: obj.height/3
                            ,mass:obj.height
                            ,cof: 0.5
                            ,name:obj.name
                            ,restitution:0.7
                            ,view: renderer.createDisplay('movieclip', {
                                anchor: {
                                    x: 0.5,
                                    y: 0.5
                                },
                                height : obj.height,
                                width : obj.height,
                                frames: obj.frames
                            })
                        });
                        world.add( body );
                        bodies.push(body);
                        
                        var rand = Math.floor(Math.random() * loadedDropoffs.length-1) + 1;
                        var tempGif = loadedDropoffs[rand];
                        body = Physics.body('circle', {
                            treatment: "static",
                            toDrop:false, 
                            x: xPos,
                            y: yPos-70,
                            viewType:'dropoff',
                            radius: 0.001
                            ,view: renderer.createDisplay('movieclip', {
                                anchor: {
                                    x: 0.5,
                                    y: 0.5
                                },
                                height : tempGif.height,
                                width : tempGif.width,
                                frames: tempGif.frames
                            })
                        });
                        world.add( body ); 
                        bodies.push(body);

                        xPos += body.view.texture.width + 20;
                    break;
                    case 'text' : 
                        var textProps = input.text;
                        var style = new PIXI.TextStyle({
                            fontFamily: textProps.font,
                            fontSize: textProps.size.value,
                            fontWeight: textProps.weight,
                            fill: textProps.color,
                            dropShadow: textProps.effect=="Glow"?true:false,
                            dropShadowColor: textProps.effectColor,
                            dropShadowBlur: 10,
                            dropShadowAngle: 0,
                            dropShadowDistance: 0,
                            stroke: textProps.effect=="Stroke"?textProps.effectColor:'#ffffff',
                            strokeThickness: textProps.effect=="Stroke"?3:0
                        });

                        var richText = new PIXI.Text(obj.value, style);
                        richText.anchor = {
                            x:0,
                            y:textProps.size.anchorY
                        };
                        body = Physics.body('rectangle', {
                            treatment: tmt,
                            toDrop:false,
                            x: xPos,
                            y: yPos - richText.height/2, 
                            viewType:'text',
                            height:richText.height,
                            width:1
                            ,cof: 0
                            ,restitution:0.6
                            ,view: richText
                        });

                        world.add( body );
                        bodies.push(body);          

                        xPos += richText.width + 50;
                    break;
                    case 'linebreak' :  
                        $(".demo-bg-contain").append('<div class="text-bg" style="left:'+ (renderer.width + j*50 - 30) +'px; top:'+ (yPos-50) +'px; width:'+(xPos - renderer.width - j*50 + 30)+'px; height:70px; border-radius:10px; background:url('+ inp.text.background +')"></div>');  
                        j++;  yPos+=120; xPos = renderer.width+j*50;
                    break;
                }
            });  

            this.addGlass(inp);
            return bodies;
        },
        createRandomBodies:function(inp){
            var body
            ,found
            ,bodies = []
            ,frArr = []
            ,tmt = 'static'  
            ,j = 1          
            ;

            elements.forEach(function(obj){            
                switch(obj.type){
                    case 'sprite' : 
                        found = $filter('filter')(icons, {name: obj.name}, true);
                        body = Physics.body('circle', {
                            treatment: tmt,                        
                            mass:obj.height,
                            x:renderer.width+50,
                            y:0,
                            radius: obj.height/3
                            ,name:obj.name
                            ,viewType:'sprite'
                            ,cof: 0.5
                            ,restitution:0.7
                            ,view:  renderer.createDisplay('sprite', {
                                texture: found[0].url,
                                anchor: {
                                    x: 0.5,
                                    y: 0.5
                                },
                                height : obj.height,
                                width : obj.width?obj.width:obj.height
                            })
                        });
                        if(obj.name == "dollar"){
                            body.radius = obj.width;
                        }
                        world.add( body ); 
                        bodies.push(body);                        
                    break;
                    case 'movieclip' : 
                        body = Physics.body('circle', {
                            treatment: tmt,
                            x:renderer.width+50,
                            y:0,
                            mass:obj.height
                            ,name:obj.name
                            ,radius: obj.height/3
                            ,viewType:'movieclip'
                            ,cof: 0.5
                            ,restitution:0.7
                            ,view: renderer.createDisplay('movieclip', {
                                anchor: {
                                    x: 0.5,
                                    y: 0.5
                                },
                                height : obj.height,
                                width : obj.height,
                                frames: obj.frames
                            })
                        });
                        world.add( body );
                        bodies.push(body);
                    break;
                }
            });             

            this.addGlass(inp);
            return bodies;
        },
        createPreviousBodies:function(inp){
            var body, found, tmt = "dynamic";
            elements.forEach(function(obj){
                switch(obj.type){
                    case 'sprite' :
                        found = $filter('filter')(icons, {name: obj.name}, true);
                        body = Physics.body('circle', {
                            treatment: tmt                        
                            ,mass:obj.mass
                            ,x: obj.state.pos._[0]
                            ,y: obj.state.pos._[1]
                            ,radius: obj.radius
                            ,name:obj.name
                            ,cof: 0.5
                            ,viewType:'sprite'
                            ,restitution:0.7
                            ,angle:obj.state.angular.pos
                            ,view:  renderer.createDisplay('sprite', {
                                texture: found[0].url,
                                anchor: {
                                    x: 0.5,
                                    y: 0.5
                                },
                                height : obj.height,
                                width : obj.width?obj.width:obj.height
                            })
                        });                        
                        world.add( body );
                    break;
                    case 'movieclip' : 
                        body = Physics.body('circle', {
                            treatment: tmt,
                            mass:obj.mass
                            ,x: obj.state.pos._[0]
                            ,y: obj.state.pos._[1]
                            ,radius: obj.radius
                            ,name:obj.name
                            ,viewType:'movieclip'
                            ,cof: 0.5
                            ,restitution:0.7
                            ,angle:obj.state.angular.pos
                            ,view: renderer.createDisplay('movieclip', {
                                anchor: {
                                    x: 0.5,
                                    y: 0.5
                                },
                                height : obj.height,
                                width : obj.height,
                                frames: obj.frames
                            })
                        });
                        world.add( body );
                    break;
                }
            }); 
            this.addGlass(inp); 
        },
        addGlass:function(inp){
            var oldGlass = $filter('filter')(world._bodies, {name:"glass"});
            if(oldGlass.length > 0){
                oldGlass.forEach(function(obj){
                    world.remove(obj);
                });
            }
            world.one('render', function(){
                if(inp.showOverflow){
                    world.add(edgeBounce);
                }else{
                    world.remove(edgeBounce);
                }
            });                      

            var found = $filter('filter')(cups, {name: inp.cup.name}, true)
            ,glass = Physics.body('rectangle', {
                treatment: 'static',
                name:'glass',
                x: renderer.width/2,
                y: renderer.height - found[0].yOff,
                height: 10,
                width: 200,
                view: renderer.createDisplay('sprite', {
                    texture: found[0].url,          
                    anchor: {
                        x: found[0].xAnch?found[0].xAnch:0.5,
                        y: found[0].yAnch
                    }
                })
            })
            ,helper = Physics.body('compound', {
              x: renderer.width/2
              ,y: renderer.height - found[0].yOff
              ,width: found[0].width?found[0].width:200
              ,cof: 1
              ,name:'glass'
              ,hidden:true            
              ,restitution:0.2
              ,treatment: 'static'  
              ,styles:{lineWidth:0}      
              ,children: [
                Physics.body('rectangle', {
                    x: 0 
                    ,y: 0
                    ,width: found[0].width?found[0].width:140
                    ,height: 1
                    ,mass: 20
                    ,treatment: 'static'                      
                }),
                Physics.body('rectangle', {
                    x: found[0].width?-1*found[0].width/2:-70  
                    ,y: 0
                    ,width: 1
                    ,height: found[0].height?found[0].height:500
                    ,mass: 20
                    ,angle:found[0].angle?-1*found[0].angle:0
                    ,treatment: 'static' 
                    ,alpha:0           
                }),
                Physics.body('rectangle', {
                    x: found[0].width?found[0].width/2:70 
                    ,y: 0
                    ,width: 1
                    ,height: found[0].height?found[0].height:500
                    ,mass: 20
                    ,angle:found[0].angle?found[0].angle:0
                    ,treatment: 'static' 
                    ,alpha:0           
                })
              ]
            })
            ;     
            world.add( glass );
            world.add( helper );
            if(oldGlass.length > 0){
                if(oldGlass[0].view._texture.baseTexture.imageUrl != found[0].url){
                    setTimeout(function(){
                        world.emit('interact:poke', {virtual:true, idx:1, x:renderer.width/2, y:renderer.height+200});
                        setTimeout(function(){
                            world.emit('interact:release');
                        }, 1000);
                    }, 1000)
                }
            };
            world.wakeUpAll();
        },
        animateTextBodies:function(input, bodies){
            bodies.forEach(function(obj){
                obj.tween = new TWEEN.Tween({ x: obj.state.pos.x, y:obj.state.pos.y})
                .to( { x: obj.state.pos.x - renderer.width*2 - 100, y:obj.state.pos.y }, 2000/renderer.width * 8000 )            
                .onUpdate(function () {
                    world.wakeUpAll();
                    if(obj.state.pos.x >= renderer.width/2)
                        obj.state.pos = new Physics.vector(this.x, this.y);                    
                    else if(!obj.toDrop)
                        obj.state.pos = new Physics.vector(this.x, this.y);                    
                    else{
                        TWEEN.remove(obj.tween);
                        obj.treatment = 'dynamic'; 
                        obj.state.vel = new Physics.vector(0, 0);
                    }
                })
                .onComplete(function(){
                    if(obj.viewType == 'text' || 'dropoff'){
                        world.remove(obj);
                    }
                })
                .start();
            });
            $(".text-bg").toArray().forEach(function(obj){
                var pos = $(obj).position().left;
                new TWEEN.Tween({x:pos})
                .to({x:pos - renderer.width*2 - 100}, 2000/renderer.width * 8000)  
                .onUpdate(function(){
                    $(obj).css("left", this.x+"px");
                })
                .onComplete(function(){
                    $(obj).remove();
                })
                .start();  
            });
        },
        animateRandomBodies:function(bodies){
            var i = 0;
            bodies.forEach(function(obj){
                setTimeout(function(){
                    obj.treatment = 'dynamic';
                    obj.state.pos = new Physics.vector(renderer.width/2, 0);
                    obj.state.vel = new Physics.vector(0.001, 0.001);
                },i*200);
                i++;
            });
        },
        emptyJar:function(){
            var found = $filter('filter')(world._bodies, {name:"glass"});
            world.remove(world.getBodies());
            found.forEach(function(obj){
                world.add(obj);
            }); 
            $(".text-bg").remove();
            TWEEN.removeAll();
        },
        getBodies:function(){
            return world._bodies;
        }
    }
})
;
