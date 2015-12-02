import THREE from "three"
import {computeBoundingSphere} from './computeBounds'

export default function centerMesh( object, onX, onY, onZ )
{
  //TODO: should this be added to our object/mesh classes
  onX = onX === undefined ? false: onX
  onY = onY === undefined ? false: onY
  onZ = onZ === undefined ? false: onZ
  
  //centering hack
  if(!object.boundingSphere) computeBoundingSphere( object )
  let offset = object.boundingSphere.center
  
  object.traverse(function(item)
  {
    if(item.geometry){
      item.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( -offset.x, -offset.y, -offset.z ) )
    }
  })
  
  //offset to move the object above given planes
  if(onZ)
  {
    let h = object.boundingBox.max.z  - object.boundingBox.min.z 
    object.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, h/2 ) )
  }
  
  if(onY)
  {
    let d = object.boundingBox.max.y  - object.boundingBox.min.y 
    object.applyMatrix( new THREE.Matrix4().makeTranslation( 0, d/2, 0 ) )
  }
  
  if(onX)
  {
    let w = object.boundingBox.max.x  - object.boundingBox.min.x 
    object.applyMatrix( new THREE.Matrix4().makeTranslation( w/2, 0, 0 ) )
  }
  return object
}
