import THREE from 'three'

export function getTargetBoundsData( targetObject, point ){
  console.log("computing bounds")
  /* -1 /+1 directions on all 3 axis to determine for example WHERE an annotation
  should be placed (left/right, front/back, top/bottom)
  */
  let putSide= [0,0,0]
  if(!targetObject ) return putSide
  let bbox     = targetObject.boundingBox
  
  let objectCenter =   new THREE.Vector3().addVectors( targetObject.boundingBox.min,
    targetObject.boundingBox.max).divideScalar(2)
    
  //let realCenter = point.clone().sub( objectCenter )
  //console.log("objectCenter",objectCenter,"point", point,foo.normalize())
  
  let axes = ["x","y","z"]
  axes.forEach( (axis, index) => {
    let axisOffset  = point[axis] - objectCenter[axis]
    axisOffset = Math.round(axisOffset * 100) / 100
    if( axisOffset>0 ){
      putSide[index] = 1
    }
    else if( axisOffset<0 )
    {
      putSide[index] = -1
    }
  })
  
  console.log("putSide",putSide)
  putSide = new THREE.Vector3().fromArray( putSide )
  return putSide 
}   


//compute center , dia/radius from three 3d points
export function computeCenterDiaNormalFromThreePoints(pointA,pointB,pointC){

  let plane = new THREE.Plane().setFromCoplanarPoints( pointA, pointB, pointC )
  let center = new THREE.Vector3()

  //see http://en.wikipedia.org/wiki/Circumscribed_circle
  // triangle "edges"
  let t = pointA.clone().sub( pointB )
  let u = pointB.clone().sub( pointC )
  let v = pointC.clone().sub( pointA )
  let m = pointA.clone().sub( pointC )
  let x = pointB.clone().sub( pointA )
  let z = pointC.clone().sub( pointB )

  let foo = t.clone().cross( u ).length()
  let bar = 2 * foo
  let baz = foo * foo
  let buu = 2 * baz

  let radius = ( t.length()*u.length()*v.length() )/ bar

  let alpha = ( u.lengthSq() * t.clone().dot( m ) ) / buu
  let beta  = ( m.lengthSq() * x.clone().dot( u ) ) / buu
  let gamma = ( t.lengthSq() * v.clone().dot( z ) ) / buu

  center = pointA.clone().multiplyScalar( alpha ).add( 
   pointB.clone().multiplyScalar( beta ) ) .add(
   pointC.clone().multiplyScalar( gamma ) )

  let diameter = radius * 2
  let normal   = plane.normal

  return {center,diameter,normal}
}

export function getEntryExitThickness(entryInteresect, normalType="face"){
  let normal  = entryInteresect.face.normal.clone()
  switch(normalType)
  {
    case "face":
    break
    case "x":
      normal = new THREE.Vector3(1,0,0)
    break
    case "y":
      normal = new THREE.Vector3(0,1,0)
    break
    case "z":
      normal = new THREE.Vector3(0,0,1)
    break
  }
    
  let object = entryInteresect.object
  if( !object ) return undefined
    
  let entryPoint = entryInteresect.point.clone()
  let flippedNormal = normal.clone().negate()
  let offsetPoint = entryPoint.clone().add( flippedNormal.clone().multiplyScalar(10000))
    
  //get escape entryPoint
  let raycaster  = new THREE.Raycaster(offsetPoint, normal.clone().normalize())
  let intersects = raycaster.intersectObjects([object], true)
    
  let exitPoint = null
  let minDist   = Infinity
  
  intersects.map(function(entry){
      let curPt = entry.point
      let curLn = curPt.clone().sub( entryPoint ).length()
      
      if( curLn < minDist )
      {
        exitPoint = curPt
        minDist = curLn
      }
    })
   
  //FIXME: todo or not ??
  object.worldToLocal( entryPoint )
  object.worldToLocal( exitPoint )
  
  //compute actual thickness
  let endToStart = exitPoint.clone().sub( entryPoint )
  let thickness = endToStart.length()
  
  return {object: object, entryPoint: entryPoint, exitPoint:exitPoint, thickness:thickness}
}