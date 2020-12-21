function Block(x, y, z, cube) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.cube = cube;
  this.state = STATE.EMPTY;
}

function BlockShape(type, shape, cubes, color, position) {
  this.cubes = cubes;
  this.shape = shape;
  this.type = type;
  this.color = color;
  this.position = position;

  this.rotate = function(x, y, z) {
    var initialcubes = this.cubes;
    cubes.rotation.x += x * Math.PI / 180;
    cubes.rotation.y += y * Math.PI / 180;
    cubes.rotation.z += z * Math.PI / 180;

    //new TWEEN.Tween( initialcubes.rotation ).to( cubes.rotation, 1000 ).easing(TWEEN.Easing.Elastic.InOut).start();

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

  // 큐브가 떨어지는거 구현
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

  function cloneVector(v) {
  	return {x: v.x, y: v.y, z: v.z};
  }
}
