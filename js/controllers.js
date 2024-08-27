angular.module('starter.controllers', ['minicolors'])

.controller('HomeCtrl', function($scope, $state, $stateParams, $window, $filter, canvasService) {
  var intercom = Intercom.getInstance();
  $scope.showCanvas = false;
  $scope.actions = [
    { name:"Tips", value:"tp", field:'Tip Amount', amount: 100, selected:true },
    { name:"Sponsors", value:"sp", field:'Sp Amount', amount: 100, selected:true },
    { name:"Treats", value:"tr", field:'Amount', amount: 100, selected:false },
    { name:"Bits", value:"bt", field:'Bit Amount', amount: 9000, selected:true },
    { name:"Subscriptions", value:"sb", field:'Months', amount: 100, selected:false },
    { name:"Follower", value:"fl", field:'Amount', amount: 100, selected:false },
    { name:"Hosts", value:"ho", field:'Viewers', amount: 100, selected:false }
  ];
  
  $scope.fonts = [
    { name:"Arial", value:"Arial, Helvetica, sans-serif"},
    { name:"Arial Black", value:"'Arial Black', Gadget, sans-serif"},
    { name:"Comic Sans", value:"'Comic Sans MS', cursive, sans-serif"},
    { name:"Courier New", value:"'Courier New', Courier, monospace"},
    { name:"Georgia", value:"Georgia, serif"},
    { name:"Impact", value:"Impact, Charcoal, sans-serif"},
    { name:"Lucida Sans", value:"'Lucida Sans Unicode', 'Lucida Grande', sans-serif"},
    { name:"Lucida Console", value:"'Lucida Console', Monaco, monospace"},
    { name:"Palatino Linotype", value:"'Palatino Linotype', 'Book Antiqua', Palatino, serif"},
    { name:"Tahoma", value:"Tahoma, Geneva, sans-serif"},
    { name:"Times New Roman", value:"'Times New Roman', Times, serif"},
    { name:"Trebuchet MS", value:"'Trebuchet MS', Helvetica, sans-serif"},
    { name:"Verdana", value:"Verdana, Geneva, sans-serif"}
  ];

  $scope.cups = [
    { name:"Cup1" },
    { name:"Cup2" },
    { name:"Cup3" },
    { name:"Cup4" },
    { name:"Cup5" },
    { name:"Cup6" },
    { name:"Cup7" },
    { name:"Cup8" }
  ];

  $scope.textBg = [
    { name:"None", url:"" },    
    { name:"Beach", url:"img/tiles/Beach.png" },    
    { name:"Donuts", url:"img/tiles/Donuts.png" },    
    { name:"Zig Zag", url:"img/tiles/ZigZags.png" },    
    { name:"Wood", url:"img/tiles/Wood.png" },    
    { name:"Loons", url:"img/tiles/Loons.png" },    
    { name:"Hearts", url:"img/tiles/Hearts.png" },    
    { name:"Fish", url:"img/tiles/Fish.png" },    
  ];

  $scope.textEffects = [
      { name: "None", color: false},
      { name: "Stroke", color: true}
  ];

  $scope.fontSize = [
      { name: "Barely", value: 12, anchorY:1 },
      { name: "Small", value: 20, anchorY:0.65 },
      { name: "Medium", value: 32, anchorY:0.5 },
      { name: "Large", value: 40, anchorY:0.35 },
      { name: "XL", value: 48, anchorY:0.3 }
  ];

  $scope.weights = [
      { name: "Light", value: 100},
      { name: "Regular", value: 400},
      { name: "Bold", value: 700}
  ];

  $scope.$watch(function() {
    return $scope.actions;
  }, function(newValue, oldValue) {
      var found = $filter('filter')($scope.actions, {selected:true});
      if(found.length > 3 && $scope.input.isTextVisible){          
          $scope.actions = oldValue;
          alert('You can select a maximum of 3 actions for text-scroll. Please uncheck "Show Text" option.');
      }
  }, true);

  $scope.$watch(function() {
    return $scope.input.isTextVisible;
  }, function(newValue, oldValue) {
      var found = $filter('filter')($scope.actions, {selected:true});
      if(found.length > 3 && $scope.input.isTextVisible){          
          $scope.input.isTextVisible = oldValue;
          alert('You have more than 3 options selected. Please de-select some to continue.');
      }
  }, true);

  $scope.setInput = function(){
      var initInp = {
          text:{
            font: "Arial",
            size: "32,0.3",
            color: "#ffffff",
            effect: "None",
            weight: 400,
            effectColor: "#5c1b1b"
          },
          user:"testUser",
          cup : {
            name: "Cup1",
            yOff: 150,
            yAnch: 0.85
          },
          bgColor:"#58cc35",
          minTips:10,
          minBits:10,
          isBgTransparent:false,
          isTextVisible:true,
          showOverflow:true,
          actions:[]
      };
      var tmpInp = $window.localStorage.getItem("input");
      if(tmpInp != null){
          $scope.input = angular.fromJson(tmpInp);
          $scope.actions.forEach(function(obj){
              var found = $filter('filter')($scope.input.actions, {name:obj.name});
              if(found.length > 0){
                  obj.selected = found[0].selected;
                  obj.amount = found[0].amount;
              }
              else
                  obj.selected = false;
          });
      }
      else
          $scope.input = initInp;
  };

  $scope.prepareInput = function(){
      $scope.input.text.weight = parseInt($scope.input.text.weight);
      $scope.input.actions = [];
      $scope.actions.forEach(function(obj){
          if(obj.selected){
              $scope.input.actions.push(obj);
          }
      });
      if($scope.input.isBgTransparent){
          $scope.input.bgColor = "none";
      }
      if(typeof $scope.input.text.size == "string"){
          var a = $scope.input.text.size.split(",");
          $scope.input.text.size = {
              value : parseInt(a[0]),
              anchorY : parseFloat(a[1])
          };
      }
  };

  $scope.sendTest = function(){
      $scope.prepareInput();
      intercom.emit('createInput', {message: $scope.input});
      if(typeof $scope.newWin === "undefined")
          alert("Please open in new window first!")
      else  
          $scope.newWin.focus();
  };

  $scope.saveSettings = function(){
      $scope.prepareInput();
      $window.localStorage.setItem("input", angular.toJson($scope.input));
      alert('Settings have been saved!')  
      intercom.emit('createInput', {message: $scope.input})
      if(typeof $scope.newWin === "undefined")
          alert("Please open in new window to see changes!")
      else  
          $scope.newWin.focus();
  };

  $scope.emptyJar = function(){
      delete $scope.input.previousBodies;
      $window.localStorage.removeItem("input");
      intercom.emit('emptyJar');
      if(typeof $scope.newWin !== "undefined")
          $scope.newWin.focus();      
  };

  $scope.sendInput = function(){      
      $scope.prepareInput();
      var url = $state.href('demo', {});
      if(typeof $scope.newWin === "undefined"){          
          $scope.newWin = $window.open(url, '_blank', "height=750,width=1000");
          $scope.newWin.addEventListener("beforeunload", function(e){
             $scope.newWin = undefined;
          }, false);
          $window.localStorage.setItem("input", angular.toJson($scope.input));
          delete $scope.input.previousBodies;
          $window.addEventListener("beforeunload", function(e){
             $scope.newWin.close();
             $scope.newWin = undefined;             
          }, false);
      }
      else{
          $scope.newWin.focus();
      }
  }; 

  intercom.on('windowClosed', function(data) {
      $scope.$apply(function(){
          $scope.input.previousBodies = data.message;
      });
  });
})
.controller('DemoCtrl', function($scope, $rootScope, $stateParams, $window, canvasService) {
  var intercom = Intercom.getInstance();
  $scope.showLoader = true;    
  $scope.input = angular.fromJson($window.localStorage.getItem("input"));  
  if($scope.input.hasOwnProperty("previousBodies")){
      canvasService.createPreviousElements($scope.input.previousBodies).then(function(){
          canvasService.createPreviousBodies($scope.input);
          $scope.showLoader = false;  
      });
  }else{
      canvasService.addGlass($scope.input);
      $scope.showLoader = false;  
  }
  
  $window.addEventListener("beforeunload", function(e){      
      var bodies = canvasService.getBodies()
      ,prevBodies = [];
      bodies.forEach(function(obj){
          if(obj.viewType == "sprite" || obj.viewType == "movieclip"){
              prevBodies.push({
                  state:obj.state,
                  type:obj.viewType,
                  name:obj.name,
                  radius:obj.name=="dollar"?obj.radius/3:obj.radius,
                  height:obj.view.height,
                  width:obj.view.width,
                  mass:obj.mass,
                  texture:obj.view.texture.baseTexture.imageUrl
              });
          }
      });
      intercom.emit("windowClosed", {message:prevBodies});     
  }, false);

  $scope.createCanvas = function(){      
      if($scope.input.isTextVisible){
          canvasService.createTextElements($scope.input).then(function(){
              canvasService.animateTextBodies($scope.input, canvasService.createTextBodies($scope.input));
              $scope.showLoader = false;
          });
      }else{
          canvasService.createRandomElements($scope.input).then(function(resources){
              canvasService.animateRandomBodies(canvasService.createRandomBodies($scope.input));
              $scope.showLoader = false;
          });
      }  
  };  

  intercom.on('createInput', function(data) {
      $scope.$apply(function(){
          $scope.showLoader = true;
          $scope.input = data.message;
      });
      $scope.createCanvas();
  });

  intercom.on('emptyJar', function(data) {
      canvasService.emptyJar();
  });
});

 