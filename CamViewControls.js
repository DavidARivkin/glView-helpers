//FIXME: hack 
THREE.Vector3.prototype.pickingRay = function ( camera ) {
    var tan = Math.tan( 0.5 * THREE.Math.degToRad( camera.fov ) ) / camera.zoom;

    this.x *= tan * camera.aspect;
    this.y *= tan; 
    this.z = - 1;

    return this.transformDirection( camera.matrixWorld );
};


GizmoMaterial = function ( parameters ) {

		THREE.MeshBasicMaterial.call( this );

		//this.depthTest = false;
		//this.depthWrite = false;
		this.side = THREE.FrontSide;
		//this.transparent = true;

		this.setValues( parameters );

		this.oldColor = this.color.clone();
		this.oldOpacity = this.opacity;

		this.highlight = function( highlighted ) {

			if ( highlighted ) {

				this.color.setRGB( 1, 1, 0 );
				this.opacity = 1;

			} else {

					this.color.copy( this.oldColor );
					this.opacity = this.oldOpacity;

			}

		};

};

GizmoMaterial.prototype = Object.create( THREE.MeshBasicMaterial.prototype );


CubeEdge = function( size, width, color, position ){
  var size = size || 10;
  var width = width || 4;
  var position = position || new THREE.Vector3();
  var color = color || 0xFF0000;

  var planeGeometry = new THREE.PlaneGeometry( size, width, 2, 2 );
  planeGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI/2 ) ); 
  planeGeometry.applyMatrix( new THREE.Matrix4().makeRotationY( Math.PI/2 ) ); 
  planeGeometry.applyMatrix( new THREE.Matrix4().makeTranslation( -width /2, 0 ,size /2 ) );
  
  var planeGeometry2 = planeGeometry.clone();
  planeGeometry2.applyMatrix( new THREE.Matrix4().makeRotationZ( Math.PI/2 ) ); 
  
  //final geometry
  var geometry = new THREE.Geometry();
  geometry.merge(planeGeometry);
  geometry.merge(planeGeometry2);
  
  var material = new GizmoMaterial( { color:color, 
	   side : THREE.DoubleSide,
	  } );
  //depthTest:false, depthWrite:false 
  THREE.Mesh.call(this, geometry, material);
  this.position.copy( position );
}

CubeEdge.prototype = Object.create( THREE.Mesh.prototype );
CubeEdge.prototype.constructor = CubeEdge;  

CubeEdge.prototype.onSelect = function(){
  console.log(this.name+ " selected");
}


CubePlane = function( size, color, position ){
  var size = size || 10;
  var position = position || new THREE.Vector3();
  var color = color || 0xFF0000;

  var geometry = new THREE.PlaneBufferGeometry( size, size, 2, 2 );
  var material = new GizmoMaterial( { color:color });
  //, depthTest:false , side:THREE.FrontSide
  
  THREE.Mesh.call(this, geometry, material);
  this.position.copy( position );
}

CubePlane.prototype = Object.create( THREE.Mesh.prototype );
CubePlane.prototype.constructor = CubePlane;  

CubePlane.prototype.onSelect = function(){
  console.log(this.name+ " selected");
}



ViewCubeGizmo = function( size, cornerWidth, position, edgesColor, planesColor ){
  THREE.Object3D.call( this );
  
  var size = size || 10;
  var cornerWidth = cornerWidth || 4;
  var position = position || new THREE.Vector3();
  var planesColor = planesColor;
  var edgesColor  = edgesColor;

  this.edges = new THREE.Object3D();
  this.planes  = new THREE.Object3D();
  
  //planes
  var plSize = size - cornerWidth;
  var planes = {
		"F":   new CubePlane( plSize, planesColor ),
		"B":   new CubePlane( plSize, planesColor ),
		"L":   new CubePlane( plSize, planesColor ),
		"R":   new CubePlane( plSize, planesColor ),
		"A":   new CubePlane( plSize, planesColor ),
		"U":   new CubePlane( plSize, planesColor ),
	};
	
	planes["F"].rotation.set( 0, Math.PI/2, 0 );
	planes["F"].position.set( size/2, 0, size/2 );
	planes["B"].rotation.set( 0, -Math.PI/2, 0 );
	planes["B"].position.set( -size/2, 0,size/2 );
	
	planes["L"].rotation.set( -Math.PI/2, 0, -Math.PI );
	planes["L"].position.set( 0, size/2, size/2 );
	planes["R"].rotation.set( -Math.PI/2, 0, -Math.PI );
	planes["R"].position.set( 0,-size/2, size/2 );
	
	planes["A"].position.set( 0, 0, size );
	planes["U"].position.set( 0, 0, 0 );

	for (var i in planes) {
		planes[i].name = i;
		this.planes.add(planes[i]);
		this.planes[i] = planes[i];
		//planes[i].visible = false;
	}
  
  //edges
  var edges = {
		"FL":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"FR":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"FT":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"FB":   new CubeEdge( size, cornerWidth, edgesColor ), 
		
		"BL":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"BR":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"BT":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"BB":   new CubeEdge( size, cornerWidth, edgesColor ), 
		
		"LT":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"LB":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"RT":   new CubeEdge( size, cornerWidth, edgesColor ), 
		"RB":   new CubeEdge( size, cornerWidth, edgesColor ), 
	};
	//front
	edges["FL"].rotation.set( 0, 0, -Math.PI/2 );
	edges["FL"].position.set( size/2,-size/2, 0 );
	edges["FR"].position.set( size/2, size/2, 0 );
	
	edges["FT"].rotation.set( Math.PI/2, 0, 0 );
	edges["FT"].position.set( size/2, size/2, size );
	edges["FB"].rotation.set( -Math.PI/2, 0, 0 );
	edges["FB"].position.set( size/2, -size/2, 0 );
	
	//back	
	edges["BL"].rotation.set( 0, 0, Math.PI/2 );
	edges["BL"].position.set( -size/2,size/2, 0 );
	edges["BR"].rotation.set( 0, 0, -Math.PI );
	edges["BR"].position.set( -size/2, -size/2, 0 );

	edges["BT"].rotation.set( Math.PI/2, Math.PI , 0);
	edges["BT"].position.set( -size/2, -size/2, size );
	edges["BB"].rotation.set( -Math.PI/2, Math.PI, 0 );
	edges["BB"].position.set( -size/2, size/2, 0 );
	
	//sides (left/right)
	edges["LT"].rotation.set( Math.PI/2, -Math.PI/2 , 0);
	edges["LT"].position.set( size/2, -size/2, size );
	edges["LB"].rotation.set( Math.PI, -Math.PI/2 , 0);
	edges["LB"].position.set( size/2, -size/2, 0 );
	
	edges["RT"].rotation.set( Math.PI/2, Math.PI/2 , 0);
	edges["RT"].position.set( -size/2, size/2, size );
	
	edges["RB"].rotation.set( 0, Math.PI/2 , 0);
	edges["RB"].position.set( -size/2, size/2, 0 );
  
  
	for (var i in edges) {
		edges[i].name = i;
		this.edges.add(edges[i]);
		this.edges[i] = edges[i];
		//planes[i].visible = false;
	}
  
  this.add( this.edges );
  this.add( this.planes );
  
  this.position.copy( position );
}

ViewCubeGizmo.prototype = Object.create( THREE.Object3D.prototype );
ViewCubeGizmo.prototype.constructor = ViewCubeGizmo;  


ViewCubeGizmo.prototype.hide = function () {
	this.traverse(function( child ) {
		child.visible = false;
	});
};

ViewCubeGizmo.prototype.show = function () {
	this.traverse(function( child ) {
		child.visible = true;
	});
};

ViewCubeGizmo.prototype.highlight = function ( item ) {
	this.traverse(function( child ) {
		if ( child.material && child.material.highlight ){
			if ( child.name == item ) {
				child.material.highlight( true );
			} else {
				child.material.highlight( false );
			}
		}
	});
};

 
CamViewControls = function (size, xColor, yColor, zColor, textColor, addLabels, addArrows) { 
	 THREE.Object3D.call( this );
	
	 var size = 20;
	 var cornerWidth = 3;
	 var edgesColor = 0x889999;
	 var planesColor = 0x778888;
	 
	 this.viewCubeGizmo = new ViewCubeGizmo(size, cornerWidth, null, edgesColor, planesColor);
	 this.add( this.viewCubeGizmo );
	 
	 this.add( new THREE.LabeledAxes(size, null, null, null, null,true,true) );
}

CamViewControls.prototype = Object.create( THREE.Object3D.prototype );
CamViewControls.prototype.constructor = CamViewControls;  

CamViewControls.prototype.init = function( camera, domElement ){
  console.log("attaching CamViewControls controls to", domElement);
  this.domElement = domElement;
  this.camera = camera;
  
  var scope = this;
  
  var ray = new THREE.Raycaster();
	var pointerVector = new THREE.Vector3();

	var point = new THREE.Vector3();
	var offset = new THREE.Vector3();
	
	var camPosition = new THREE.Vector3();
	var camRotation = new THREE.Euler();
	
	this.camPosition = camPosition;
	this.camRotation = camRotation;
  
  domElement.addEventListener( "mousedown", onPointerDown, false );
	domElement.addEventListener( "touchstart", onPointerDown, false );

	/*domElement.addEventListener( "mousemove", onPointerHover, false );
	domElement.addEventListener( "touchmove", onPointerHover, false );*/

	domElement.addEventListener( "mousemove", onPointerMove, false );
	domElement.addEventListener( "touchmove", onPointerMove, false );

	/*domElement.addEventListener( "mouseup", onPointerUp, false );
	domElement.addEventListener( "mouseout", onPointerUp, false );
	domElement.addEventListener( "touchend", onPointerUp, false );
	domElement.addEventListener( "touchcancel", onPointerUp, false );
	domElement.addEventListener( "touchleave", onPointerUp, false );*/
	
	function intersectObjects( pointer, objects, isOrtho ) {

		var rect = domElement.getBoundingClientRect();
		var x = pointer.offsetX;//;( pointer.offsetX - rect.left ) / rect.width;
		var y = pointer.offsetY;//;( pointer.offsetX - rect.top ) / rect.height;

    pointerVector.set( (x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1, 1  );
    
    if( !isOrtho)
		{
		  //pointerVector.set( ( x * 2 ) - 1, - ( y * 2 ) + 1, 0.5 );
		  
		  pointerVector.unproject( camera );

		  ray.set( camPosition, pointerVector.sub( camPosition ).normalize() );

		  var intersections = ray.intersectObjects( objects, true );
		}else{
		
		 pointerVector.pickingRay( camera );
     ray.set( camPosition, pointerVector );
     var intersections = ray.intersectObjects( objects, true );
		}
		return intersections[0] ? intersections[0] : false;

	}
	
	function onPointerMove( event ) {

			event.preventDefault();
			event.stopPropagation();
			
			var pointer = event.changedTouches? event.changedTouches[0] : event;

			var intersect = intersectObjects( pointer, scope.viewCubeGizmo.children, true );
			
      if(intersect && intersect.object.name){
        scope.activeItem = intersect.object.name;
        //scope.viewCubeGizmo.show();
      }
      else{
        scope.activeItem = null;
        //scope.viewCubeGizmo.hide();
      }
      //intersect
			//point.copy( planeIntersect.point );
  }
  function onPointerDown( event ) {
      console.log("pointer down in camView controls");
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;
			var intersect = intersectObjects( pointer, scope.viewCubeGizmo.children, true );
			if(intersect && intersect.object.onSelect)
			{
			  intersect.object.onSelect();
			}
  }
  
  
}

CamViewControls.prototype.intersectObjects = function intersectObjects( pointer, objects ) {

	var rect = domElement.getBoundingClientRect();
	var x = ( pointer.clientX - rect.left ) / rect.width;
	var y = ( pointer.clientY - rect.top ) / rect.height;

	pointerVector.set( ( x * 2 ) - 1, - ( y * 2 ) + 1, 0.5 );
	pointerVector.unproject( camera );

	ray.set( camPosition, pointerVector.sub( camPosition ).normalize() );

	var intersections = ray.intersectObjects( objects, true );
	return intersections[0] ? intersections[0] : false;

}

CamViewControls.prototype.update = function () {
		this.camera.updateMatrixWorld();
		this.camPosition.setFromMatrixPosition( this.camera.matrixWorld );
		//this.camRotation.setFromRotationMatrix( tempMatrix.extractRotation( camera.matrixWorld ) );
		//this.gizmo[_mode].highlight( scope.axis );
    this.viewCubeGizmo.highlight( this.activeItem );
}

