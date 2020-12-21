var BLOCK_COLORS = [0xff0000, 0xa05403, 0xbcbf07, 0x03a03c, 0x0000ff, 0x4b0082];
var colorIndex;

var scene, scene2,
		camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
		renderer, container,
		controls, keyboard, stats,
		starSphere,
		GRID_X, GRID_Y, GRID_Z, SPAWN_X, SPAWN_Y, SPAWN_Z,
		cube, geoCube, CUBE_SIDE, movingShape,
		stepTime, accTime, frameTime, lastFrameTime, clock, 
		gameOver,
		currentScore, scoreText, translation, rotation, linesCompleted;
var constants = {
	CUBE_SIDE: 1,
	GRID_X: 5,
	GRID_Y: 10,
	GRID_Z: 5
};
		  
var STATE = {
	EMPTY: 0,
	MOVING: 1,
	FROZEN: 2
}
		  
var shapes = [
		  
  [  // ㄴ
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 1, y: 1, z: 0},
	{x: 1, y: 2, z: 0}
  ],
  [ // 일자
	{x: 0, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 0, y: 2, z: 0},
	{x: 0, y: 3, z: 0}
  ],
  [ // 네모
	{x: 0, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 1, y: 1, z: 0}
  ],
  [
	{x: 0, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 0, y: 2, z: 0},
	{x: 1, y: 1, z: 0}
  ],
  [  // 지그제그
	{x: 0, y: 0, z: 0},   
	{x: 0, y: 1, z: 0},
	{x: 1, y: 1, z: 0},
	{x: 1, y: 2, z: 0}
  ]
];
		  
var grid = new Array();
window.addEventListener('load', init, false);

function init () {

	document.getElementById("play_button").addEventListener('click', function (){
		document.getElementById('play_button').style.display = 'none';
		start();
	});
	
}
function start(){
		createScene();                                            // 신을 만든다.
		createBackground();
		initObjects();
		makeGrid();
		generateRandomBlockShape();
		createLights();
		loop();
}

function createScene() {
	scene = new THREE.Scene();
	scene2 = new THREE.Scene();
	fieldOfView = 110;                       // 초기 시작배율(?)
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	aspectRatio = WIDTH/HEIGHT;
	nearPlane = 0.1
	farPlane = 1000;

	camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);  // 시야, 가로세로 비율, 가까운정도, 먼정도
	camera.position.x = -2.9;
	camera.position.y = 11.2;
	camera.position.z = 6.7;

	controls = new THREE.OrbitControls(camera);                 // 물체 중심으로 카메라를 이동시킬수 있는 오브젝트
	controls.enableDamping = true;
	controls.dampingFactor = 0.4;
	controls.maxDistance = 10;

	keyboard = new KeyboardState();

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(WIDTH, HEIGHT);
	document.body.appendChild( renderer.domElement );
	renderer.shadowMap.enabled = true;
	renderer.autoClear = false;

	container = document.getElementById('world');  // 우리의 world 지정
	container.appendChild(renderer.domElement);

	window.addEventListener('resize', handleWindowResize, false);
}

function createBackground() {
	var geometry  = new THREE.SphereGeometry(90, 32, 32); // 구로 만들기 

	var material  = new THREE.MeshBasicMaterial();
	var loader = new THREE.TextureLoader();
	material.map   = loader.load('images/space.jpg'); // 이 이미지를 바탕으로 배경 지정
	material.side  = THREE.BackSide;

	starSphere  = new THREE.Mesh(geometry, material);
	scene.add(starSphere);     
}

function createLights() {
	var light = new THREE.PointLight(0xffffff, 1, 100);
	light.position.set(0, GRID_Y+1, 0);
	scene2.add(light);
	var sideLight1 = new THREE.PointLight(0xffffff, 1, 10);
	sideLight1.position.set(Math.floor(GRID_X/2), Math.floor(GRID_Y/2), -7);
	scene2.add(sideLight1);
	var sideLight2 = new THREE.PointLight(0xffffff, 1, 10);
	sideLight2.position.set(Math.floor(GRID_X/2), Math.floor(GRID_Y/2), 7);
	scene2.add(sideLight2);
	var sideLight3 = new THREE.PointLight(0xffffff, 1, 10);
	sideLight3.position.set(7, Math.floor(GRID_Y/2), Math.floor(GRID_Z/2));
	scene2.add(sideLight3);
	var sideLight4 = new THREE.PointLight(0xffffff, 1, 10);
	sideLight4.position.set(-7, Math.floor(GRID_Y/2), Math.floor(GRID_Z/2));
	scene2.add(sideLight4);
}

function initObjects() {


	CUBE_SIDE = constants.CUBE_SIDE;
	geoCube = new THREE.BoxGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE); // 직육면체 및 큐브와 같은 상자 (길이, 높이, 깊이)

	//Initialize grid size
	GRID_X = constants.GRID_X;
	GRID_Y = constants.GRID_Y;
	GRID_Z = constants.GRID_Z;

	//Initialize spawn Point
	SPAWN_X = Math.floor(GRID_X / 2);
	SPAWN_Y = GRID_Y + 1;
	SPAWN_Z = Math.floor(GRID_Z / 2);

	//Initialize Time steps
	clock = new THREE.Clock();
	clock.start();
	stepTime = 500;  
	frameTime = 0;
	accTime = 0;
	lastFrameTime = Date.now();

	currentScore = 0;
	linesCompleted = 0;
	gameOver = false;
	gamePause = false;
	colorIndex = 0;


	translation = document.createElement('div');
	translation.style.fontSize = "30px";
	translation.style.fontWeight = "800";
	translation.style.position = 'absolute';
	translation.style.width = 500;
	translation.style.height = 150;
	translation.style.color = "white";
	translation.id = "translation";
	translation.style.bottom = 500 +'px';
	translation.style.left = 150+'px'
	container.appendChild(translation);

	rotation = document.createElement('div');
	rotation.style.fontSize = "30px";
	rotation.style.fontWeight = "800";
	rotation.style.position = 'absolute';
	rotation.style.width = 500;
	rotation.style.height = 150;
	rotation.style.color = "white";
	rotation.id = "translation";
	rotation.style.bottom = 450 +'px';
	rotation.style.left = 150 + 'px'
	container.appendChild(rotation);

	
	// score
	scoreText = document.createElement('div');
	scoreText.style.position = 'absolute';
	scoreText.style.fontSize = "30px";
	scoreText.style.fontWeight = "800";
	scoreText.style.width = 250;
	scoreText.style.height = 150;
	scoreText.style.color = "white";
	scoreText.id = "score";
	scoreText.style.bottom = 0 + 'px';
	scoreText.style.left = 150 + 'px';
	refreshScore();
	container.appendChild(scoreText);

}


function keypress() {

	//Translations
	if (keyboard.down("A")) {
		movingShape.translate(0, 0, -1);
	}
	if (keyboard.down("D")) {
		movingShape.translate(0, 0, 1);
	}
	if (keyboard.down("W")) {
		movingShape.translate(1, 0, 0);
	}
	if (keyboard.down("S")) {
		movingShape.translate(-1, 0, 0);
	}

	//Rotations
	if (keyboard.down("T")) {
		movingShape.rotate(90, 0, 0);
	}
	if (keyboard.down("G")) {
		movingShape.rotate(-90, 0, 0);
	}
	if (keyboard.down("H")) {
		movingShape.rotate(0, 90, 0);
	}
	if (keyboard.down("F")) {
		movingShape.rotate(0, -90, 0);
	}
	if (keyboard.down("Y")) {
		movingShape.rotate(0, 0, 90);
	}
	if (keyboard.down("R")) {
		movingShape.rotate(0, 0, -90);
	}

}

function makeGrid() {
	var geometry = new THREE.BoxGeometry(GRID_X, GRID_Y, GRID_Z);
	var geo = new THREE.EdgesGeometry( geometry ); 
	var mat = new THREE.LineBasicMaterial( { color: 0xdddddddd, linewidth: 6 } );
	var boundingBox = new THREE.LineSegments( geo, mat );
	boundingBox.position.x += GRID_X / 2 - CUBE_SIDE / 2;
	boundingBox.position.y += GRID_Y / 2 - CUBE_SIDE / 2;
	boundingBox.position.z += GRID_Z / 2 - CUBE_SIDE / 2;
	controls.target.copy(boundingBox.position)
	//scene2.add(boundingBox);

	geo = new THREE.EdgesGeometry( geoCube.clone()); 
	mat = new THREE.LineBasicMaterial( { color: 0xfff9c4, linewidth: 4 } ); // gold color boundingbox
	var wireframe;

	for (var i = 0; i < GRID_X; i++) {
		grid[i] = new Array();
		for (var j = 0; j < GRID_Y + 10; j++) {
			grid[i][j] = new Array();
				for (var k = 0; k < GRID_Z; k++) {
					wireframe = null;
					if (j < GRID_Y) {
						wireframe = new THREE.LineSegments( geo.clone(), mat.clone() );
						wireframe.position.set(i, j, k);
						scene.add( wireframe );
					}
					grid[i][j][k] = new Block(i, j, k, wireframe);
				}
		}
	}

	var gridHelper = new THREE.GridHelper(5, GRID_X*GRID_Y, 0x0000ff, 0x808080 );
	gridHelper.position.y -= CUBE_SIDE / 2;
	//scene.add( gridHelper );
}

function handleWindowResize() {
	// update height and width of the renderer and the camera
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}

function generateRandomBlockShape() {
	var type = Math.floor(Math.random() * shapes.length);
	var shape = [];
	for (var  i = 0; i < shapes[type].length; i++) {
		shape[i] = cloneVector(shapes[type][i]);
	}
	var geometry = 	new THREE.BoxGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);
	for(var i = 1 ; i < shape.length; i++) {
	  tmpGeometry = new THREE.Mesh(new THREE.BoxGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE));
	  tmpGeometry.position.x = CUBE_SIDE * shape[i].x;
	  tmpGeometry.position.y = CUBE_SIDE * shape[i].y;
	  tmpGeometry.updateMatrix();
		geometry.merge(tmpGeometry.geometry, tmpGeometry.matrix);
	}

	var matCube = new THREE.MeshPhongMaterial( {
	
    color: BLOCK_COLORS[colorIndex],
    polygonOffset: true,
    polygonOffsetFactor: 1, // positive value pushes polygon further away
    polygonOffsetUnits: 1
	} );
	
	cube = new THREE.Mesh(geometry, matCube );

	// wireframe
	var newgeo = new THREE.EdgesGeometry(geometry); // or WireframeGeometry
	var newmat = new THREE.LineBasicMaterial( { color: 0x00000000, linewidth: 2 } );
	var newwireframe = new THREE.LineSegments( newgeo, newmat );
	cube.add(newwireframe);
	cube.position.x = SPAWN_X;
	cube.position.y = SPAWN_Y;
	cube.position.z = SPAWN_Z;
	cube.rotation = {x: 0, y: 0, z: 0};
	cube.name = "MOVING";

	movingShape = new BlockShape(type, shape, cube, BLOCK_COLORS[colorIndex], {
		x: SPAWN_X,
		y: SPAWN_Y,
		z: SPAWN_Z
	});
	scene2.add(cube);

	colorIndex++;
	if (colorIndex == BLOCK_COLORS.length) {
		colorIndex = 0;
	}
}

function cloneVector(v) {
	return {x: v.x, y: v.y, z: v.z};
}

function addStaticBlock (x, y, z, blockColor) {
	cleanRemove(scene, grid[x][y][z].cube);
	var geometry = 	new THREE.BoxGeometry(CUBE_SIDE, CUBE_SIDE, CUBE_SIDE);
	var matCube = new THREE.MeshPhongMaterial( {
    color: blockColor,
    polygonOffset: true,
    polygonOffsetFactor: 1, // positive value pushes polygon further away
    polygonOffsetUnits: 1
	} );
	cube = new THREE.Mesh(geometry, matCube );

	// wireframe
	var wireGeo = new THREE.EdgesGeometry(geometry); // or WireframeGeometry
	var wireMat = new THREE.LineBasicMaterial( { color: 0x00000000, linewidth: 2 } );
	var wire = new THREE.LineSegments( wireGeo , wireMat );
	cube.add(wire);
	cube.position.set(x, y, z);
	cube.rotation = {x: 0, y: 0, z: 0};

	scene2.add(cube);
	grid[x][y][z].cube = cube;
	grid[x][y][z].state = STATE.FROZEN;
}

function cleanRemove(gameScene, mesh) {
	mesh.geometry.dispose();
	mesh.material.dispose();
	gameScene.remove(mesh);
}

function freeze(movingShape) {
	var shape = movingShape.shape;
	for (var i = 0 ; i < movingShape.shape.length; i++) {
    addStaticBlock(movingShape.position.x + shape[i].x, movingShape.position.y + shape[i].y, movingShape.position.z + shape[i].z, movingShape.color);
  }
}

function checkCollision() {
	var shape = movingShape.shape;
	var posX = movingShape.position.x;
	var posY = movingShape.position.y;
	var posZ = movingShape.position.z;
	for (i = 0; i < shape.length; i++) {
		if ((shape[i].y + posY) <= 0) {
			return true;
		}

		if (grid[shape[i].x + posX][shape[i].y + posY - 1][shape[i].z + posZ].state == STATE.FROZEN) {
			return true;
		}
	}
	return false;
}

function checkGameOver() {
	var shape = movingShape.shape;
	var posY = movingShape.position.y;
	for (i = 0; i < shape.length; i++) {
		if ((shape[i].y + posY) >= GRID_Y) {
			gameOver = true;
		}
	}
	if(gameOver) {
		alert("Game over!")
	}
}

function checkComplete() {

	var x, y, z = false;
	//for each row
	for (var j = 0; j < GRID_Y; j++) {
		var total = grid.length * grid[0][0].length;
		var sum = 0;
		for (var i = 0; i < grid.length; i++) {
				for (var k = 0; k < grid[0][0].length; k++) {
					if (grid[i][j][k].state == STATE.FROZEN)
						sum++;
				}
		}
		if (j == 0)
			console.log(sum + ", " + total);
		//if row is full
			if (sum == total) {
				linesCompleted++;
				currentScore += 100;
				refreshScore();
				//move dem down
				for (y = j; y < GRID_Y-1; y++) {
					console.log("watsp");
					for (x = 0; x < grid.length; x++) {
						for (z = 0; z < grid[0][0].length; z++) {
							if (y == j) {
								if (grid[x][y][z].state == STATE.FROZEN) {
									cleanRemove(scene2, grid[x][y][z].cube);
								}
								else {
									cleanRemove(scene, grid[x][y][z].cube);
								}
							}
							grid[x][y+1][z].cube.position.y -= 1;
							grid[x][y][z] = grid[x][y+1][z];
							console.log(grid[x][y][z].cube.position.y);
						}
					}
				}
				

				y = GRID_Y - 1;
				var geo = new THREE.EdgesGeometry( geoCube.clone()); // 
				var mat = new THREE.LineBasicMaterial( { color: 0xfff9c4, linewidth: 4 } ); // 금색으로 맵만들기 
				var wireframe;
				for (x = 0; x < grid.length; x++) {
					for (z = 0; z < grid[0][0].length; z++) {
					
						wireframe = new THREE.LineSegments( geo, mat );
						wireframe.position.set(x, y, z);
						scene.add( wireframe );
						grid[x][y][z] = new Block(x, y, z, wireframe);
					}
				}
			}
		}
}

function hitBottom() {
	checkGameOver();
	if (!gameOver) {
		freeze(movingShape);
		currentScore += 10;
		refreshScore();
		cleanRemove(scene2, movingShape.cubes);
		checkComplete();
		generateRandomBlockShape();
	}
}

function refreshScore() {

 	translation.innerHTML ="Translation: A/D/W/S", rotation.innerHTML = "Rotation: T/G/H/F/Y/R", scoreText.innerHTML = "SCORE: " + currentScore + " <br/>LINES: " + linesCompleted;
}

function loop(){
	requestAnimationFrame(loop);
	keyboard.update();
	
	var time = Date.now();
	frameTime = time - lastFrameTime;
  lastFrameTime = time;
	accTime += frameTime;

  starSphere.rotation.y += 0.0003;


	if (!gameOver) {
	  keypress();

		while (accTime > stepTime) {
	  	accTime -= stepTime;
			movingShape.fall(-1);

			if (movingShape.position.y == 0) {
				hitBottom();
			}
			else if (checkCollision()) {
				hitBottom();
			}
	  }
	}
	controls.update();
	
	render();

}

function render() {
	renderer.clear();
	renderer.render( scene, camera );
	renderer.clearDepth();
	renderer.render( scene2, camera );
	
}

function animate() {
  requestAnimationFrame(animate);
}

// keyboard event
KeyboardState = function()
{
	// bind keyEvents
	document.addEventListener("keydown", KeyboardState.onKeyDown, false);
	document.addEventListener("keyup",   KeyboardState.onKeyUp,   false);
}


KeyboardState.k =
{
    8: "backspace",  9: "tab",       13: "enter",    16: "shift",
    17: "ctrl",     18: "alt",       27: "esc",      32: "space",
    33: "pageup",   34: "pagedown",  35: "end",      36: "home",
    37: "left",     38: "up",        39: "right",    40: "down",
    45: "insert",   46: "delete",   186: ";",       187: "=",
    188: ",",      189: "-",        190: ".",       191: "/",
    219: "[",      220: "\\",       221: "]",       222: "'"
}

KeyboardState.status = {};

KeyboardState.keyName = function ( keyCode )
{
	return ( KeyboardState.k[keyCode] != null ) ?
		KeyboardState.k[keyCode] :
		String.fromCharCode(keyCode);
}

KeyboardState.onKeyUp = function(event)
{
	var key = KeyboardState.keyName(event.keyCode);
	if ( KeyboardState.status[key] )
		KeyboardState.status[key].pressed = false;
}

KeyboardState.onKeyDown = function(event)
{
	var key = KeyboardState.keyName(event.keyCode);
	if ( !KeyboardState.status[key] )
		KeyboardState.status[key] = { down: false, pressed: false, up: false, updatedPreviously: false };
}

KeyboardState.prototype.update = function()
{
	for (var key in KeyboardState.status)
	{
		
		if ( !KeyboardState.status[key].updatedPreviously )
		{
			KeyboardState.status[key].down        		= true;
			KeyboardState.status[key].pressed     		= true;
			KeyboardState.status[key].updatedPreviously = true;
		}
		else 
		{
			KeyboardState.status[key].down = false;
		}

	
		if ( KeyboardState.status[key].up )
		{
			delete KeyboardState.status[key];
			continue; 
		}

		if ( !KeyboardState.status[key].pressed ) 
			KeyboardState.status[key].up = true;
	}
}

KeyboardState.prototype.down = function(keyName)
{
	return (KeyboardState.status[keyName] && KeyboardState.status[keyName].down);
}

KeyboardState.prototype.pressed = function(keyName)
{
	return (KeyboardState.status[keyName] && KeyboardState.status[keyName].pressed);
}

KeyboardState.prototype.up = function(keyName)
{
	return (KeyboardState.status[keyName] && KeyboardState.status[keyName].up);
}

KeyboardState.prototype.debug = function()
{
	var list = "Keys active: ";
	for (var arg in KeyboardState.status)
		list += " " + arg
	console.log(list);
}

function BlockShape(type, shape, cubes, color, position) {
  this.cubes = cubes;
  this.shape = shape;
  this.type = type;
  this.color = color;
  this.position = position;

  this.rotate = function(x, y, z) {
    cubes.rotation.x += x * Math.PI / 180;
    cubes.rotation.y += y * Math.PI / 180;
    cubes.rotation.z += z * Math.PI / 180;


    var rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(cubes.rotation);

    for (var i = 0; i < shape.length; i++) {
      var vector = new THREE.Vector3(shapes[this.type][i].x, shapes[this.type][i].y, shapes[this.type][i].z);
      shape[i] = vector.applyMatrix4(rotationMatrix);
      shape[i].x = Math.round(vector.x);
      shape[i].y = Math.round(vector.y);
      shape[i].z = Math.round(vector.z);
    }

    if (this.checkWallCollision()) {
      this.rotate(-x, -y, -z);
    }
  }

  this.rotate = function(x, y, z) {
    cubes.rotation.x += x * Math.PI / 180;
    cubes.rotation.y += y * Math.PI / 180;
    cubes.rotation.z += z * Math.PI / 180;

    for (var i = 0; i < shape.length; i++) {
      var vector = new THREE.Vector3(shapes[this.type][i].x, shapes[this.type][i].y, shapes[this.type][i].z);

      var axisX = new THREE.Vector3(1, 0, 0);
      var axisY = new THREE.Vector3(0, 1, 0);
      var axisZ = new THREE.Vector3(0, 0, 1);
      vector.applyAxisAngle(axisX, x * Math.PI / 180);
      vector.applyAxisAngle(axisY, y * Math.PI / 180);
      vector.applyAxisAngle(axisZ, z * Math.PI / 180);

      shape[i].x = Math.round(vector.x);
      shape[i].y = Math.round(vector.y);
      shape[i].z = Math.round(vector.z);
    }

    if (this.checkWallCollision()) {
      this.rotate(-x, -y, -z);
    }
  };

  this.translate = function(x, y, z) {
    cubes.position.x += x * constants.CUBE_SIDE;
    position.x += x;
    cubes.position.y += y * constants.CUBE_SIDE;
    position.y += y;
    cubes.position.z += z * constants.CUBE_SIDE;
    position.z += z;
    if (this.checkWallCollision()) {
      this.translate(-x, 0, -z);
    }
  }

  // fall shape
  this.fall = function(y) {
    cubes.position.y += y * constants.CUBE_SIDE;
    position.y += y;
  }

  this.checkWallCollision = function() {
    for (i = 0; i < shape.length; i++) {
  		if ((shape[i].x + position.x) < 0 ||
  				(shape[i].z + position.z) < 0 ||
          (shape[i].y + position.y) < 0 ||
  				(shape[i].x + position.x) >= constants.GRID_X ||
  				(shape[i].z + position.z) >= constants.GRID_Z) {
  					return true;
  		}
      if (grid[shape[i].x +  position.x][shape[i].y +  position.y][shape[i].z +  position.z].state == STATE.FROZEN) {
        return true;
  		}
    }
    return false;
  }

}
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Stats = factory());
}(this, (function () { 'use strict';

var Stats = function () {

	var mode = 0;

	var container = document.createElement( 'div' );
	container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
	container.addEventListener( 'click', function ( event ) {

		event.preventDefault();
		showPanel( ++ mode % container.children.length );

	}, false );



	function addPanel( panel ) {

		container.appendChild( panel.dom );
		return panel;

	}

	function showPanel( id ) {

		for ( var i = 0; i < container.children.length; i ++ ) {

			container.children[ i ].style.display = i === id ? 'block' : 'none';

		}

		mode = id;

	}


	var beginTime = ( performance || Date ).now(), prevTime = beginTime, frames = 0;

	var fpsPanel = addPanel( new Stats.Panel( 'FPS', '#0ff', '#002' ) );
	var msPanel = addPanel( new Stats.Panel( 'MS', '#0f0', '#020' ) );

	if ( self.performance && self.performance.memory ) {

		var memPanel = addPanel( new Stats.Panel( 'MB', '#f08', '#201' ) );

	}

	showPanel( 0 );

	return {

		REVISION: 16,

		dom: container,

		addPanel: addPanel,
		showPanel: showPanel,

		begin: function () {

			beginTime = ( performance || Date ).now();

		},

		end: function () {

			frames ++;

			var time = ( performance || Date ).now();

			msPanel.update( time - beginTime, 200 );

			if ( time > prevTime + 1000 ) {

				fpsPanel.update( ( frames * 1000 ) / ( time - prevTime ), 100 );

				prevTime = time;
				frames = 0;

				if ( memPanel ) {

					var memory = performance.memory;
					memPanel.update( memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576 );

				}

			}

			return time;

		},

		update: function () {

			beginTime = this.end();

		},


		domElement: container,
		setMode: showPanel

	};

};

Stats.Panel = function ( name, fg, bg ) {

	var min = Infinity, max = 0, round = Math.round;
	var PR = round( window.devicePixelRatio || 1 );

	var WIDTH = 80 * PR, HEIGHT = 48 * PR,
			TEXT_X = 3 * PR, TEXT_Y = 2 * PR,
			GRAPH_X = 3 * PR, GRAPH_Y = 15 * PR,
			GRAPH_WIDTH = 74 * PR, GRAPH_HEIGHT = 30 * PR;

	var canvas = document.createElement( 'canvas' );
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	canvas.style.cssText = 'width:80px;height:48px';

	var context = canvas.getContext( '2d' );
	context.font = 'bold ' + ( 9 * PR ) + 'px Helvetica,Arial,sans-serif';
	context.textBaseline = 'top';

	context.fillStyle = bg;
	context.fillRect( 0, 0, WIDTH, HEIGHT );

	context.fillStyle = fg;
	context.fillText( name, TEXT_X, TEXT_Y );
	context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

	context.fillStyle = bg;
	context.globalAlpha = 0.9;
	context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

	return {

		dom: canvas,

		update: function ( value, maxValue ) {

			min = Math.min( min, value );
			max = Math.max( max, value );

			context.fillStyle = bg;
			context.globalAlpha = 1;
			context.fillRect( 0, 0, WIDTH, GRAPH_Y );
			context.fillStyle = fg;
			context.fillText( round( value ) + ' ' + name + ' (' + round( min ) + '-' + round( max ) + ')', TEXT_X, TEXT_Y );

			context.drawImage( canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT );

			context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT );

			context.fillStyle = bg;
			context.globalAlpha = 0.9;
			context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round( ( 1 - ( value / maxValue ) ) * GRAPH_HEIGHT ) );

		}

	};

};
return Stats;

})));

// OrbitControls 


THREE.OrbitControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Set to false to disable panning
	this.enablePan = true;
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

	};

	this.reset = function () {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function() {

		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update () {

			var position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();


			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location
			scope.target.add( panOffset );

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

			}

			scale = 1;
			panOffset.set( 0, 0, 0 );

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function() {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		window.removeEventListener( 'keydown', onKeyDown, false );

		//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	var panLeft = function() {

		var v = new THREE.Vector3();

		return function panLeft( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	var panUp = function() {

		var v = new THREE.Vector3();

		return function panUp( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function() {

		var offset = new THREE.Vector3();

		return function pan ( deltaX, deltaY ) {

			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

			if ( scope.object instanceof THREE.PerspectiveCamera ) {

				// perspective
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

				// we actually don't use screenWidth, since perspective camera is fixed to screen height
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

			} else if ( scope.object instanceof THREE.OrthographicCamera ) {

				// orthographic
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

			} else {

				// camera neither orthographic nor perspective
			
				scope.enablePan = false;

			}

		};

	}();

	function dollyIn( dollyScale ) {

		if ( scope.object instanceof THREE.PerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object instanceof THREE.OrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			scope.enableZoom = false;

		}

	}

	function dollyOut( dollyScale ) {

		if ( scope.object instanceof THREE.PerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object instanceof THREE.OrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

		
			scope.enableZoom = false;

		}

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {


		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

	

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		panStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {
		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}


	function handleMouseWheel( event ) {

		if ( event.deltaY < 0 ) {

			dollyOut( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			dollyIn( getZoomScale() );

		}

		scope.update();

	}

	

	function handleTouchStartRotate( event ) {

	

		rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchStartDolly( event ) {



		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

	}

	function handleTouchStartPan( event ) {

		panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchMoveRotate( event ) {

		rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleTouchMoveDolly( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyIn( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleTouchMovePan( event ) {;

		panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleTouchEnd( event ) {


	}

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( event.button === scope.mouseButtons.ORBIT ) {

			if ( scope.enableRotate === false ) return;

			handleMouseDownRotate( event );

			state = STATE.ROTATE;

		} else if ( event.button === scope.mouseButtons.ZOOM ) {

			if ( scope.enableZoom === false ) return;

			handleMouseDownDolly( event );

			state = STATE.DOLLY;

		} else if ( event.button === scope.mouseButtons.PAN ) {

			if ( scope.enablePan === false ) return;

			handleMouseDownPan( event );

			state = STATE.PAN;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( state === STATE.ROTATE ) {

			if ( scope.enableRotate === false ) return;

			handleMouseMoveRotate( event );

		} else if ( state === STATE.DOLLY ) {

			if ( scope.enableZoom === false ) return;

			handleMouseMoveDolly( event );

		} else if ( state === STATE.PAN ) {

			if ( scope.enablePan === false ) return;

			handleMouseMovePan( event );

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;

		handleMouseUp( event );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		handleMouseWheel( event );

		scope.dispatchEvent( startEvent ); 
		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:	// rotate

				if ( scope.enableRotate === false ) return;

				handleTouchStartRotate( event );

				state = STATE.TOUCH_ROTATE;

				break;

			case 2:	// dolly

				if ( scope.enableZoom === false ) return;

				handleTouchStartDolly( event );

				state = STATE.TOUCH_DOLLY;

				break;

			case 3: // pan

				if ( scope.enablePan === false ) return;

				handleTouchStartPan( event );

				state = STATE.TOUCH_PAN;

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1: // rotate

				if ( scope.enableRotate === false ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return; 

				handleTouchMoveRotate( event );

				break;

			case 2: //  dolly

				if ( scope.enableZoom === false ) return;
				if ( state !== STATE.TOUCH_DOLLY ) return; 
				handleTouchMoveDolly( event );

				break;

			case 3: //  pan

				if ( scope.enablePan === false ) return;
				if ( state !== STATE.TOUCH_PAN ) return; 

				handleTouchMovePan( event );

				break;

			default:
				state = STATE.NONE;
		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		handleTouchEnd( event );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		event.preventDefault();

	}

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );
	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start

	this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties( THREE.OrbitControls.prototype, {

	center: {

		get: function () {

			return this.target;

		}

	},

	noZoom: {

		get: function () {
			return ! this.enableZoom;
		},

		set: function ( value ) {

			this.enableZoom = ! value;

		}

	},

	noRotate: {

		get: function () {
			return ! this.enableRotate;

		},

		set: function ( value ) {
			this.enableRotate = ! value;

		}

	},

	noPan: {

		get: function () {

			return ! this.enablePan;

		},

		set: function ( value ) {
			this.enablePan = ! value;

		}

	},

	noKeys: {

		get: function () {

			return ! this.enableKeys;

		},

		set: function ( value ) {

			this.enableKeys = ! value;

		}

	},

	staticMoving : {

		get: function () {

			return ! this.enableDamping;

		},

		set: function ( value ) {

			this.enableDamping = ! value;

		}

	},

	dynamicDampingFactor : {

		get: function () {

			return this.dampingFactor;

		},

		set: function ( value ) {

			this.dampingFactor = value;

		}

	}

} );
