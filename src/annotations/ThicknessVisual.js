import THREE from 'three'
import AnnotationHelper from "./AnnotationHelper"
import CrossHelper from "../CrossHelper"
import SizeHelper from "../dimensions/SizeHelper"
import BaseHelper from "../BaseHelper"



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



class ThicknessVisual extends AnnotationHelper {
  constructor( options ) {
    const DEFAULTS = {
        normalType:  "face",//can be, face, x,y,z
        sideLength: 10,
        
        object:    undefined,
        entryPoint:undefined,
        exitPoint :undefined,
        thickness: undefined,
    }
    
    this.DEFAULTS = DEFAULTS
    let options = Object.assign({}, DEFAULTS, options) 
    super(options)
    Object.assign(this, options)//unsure
    
    //initialise visuals
    this._setupVisuals()
    this._computeBasics()
    
    this.setAsSelectionRoot( true )
  }
  
  _computeBasics(){
    var entryPoint = this.entryPoint
    var exitPoint = this.exitPoint
    var object    = this.object
    
    if( ! entryPoint || ! exitPoint || ! object ) return
    
    var endToStart = exitPoint.clone().sub( entryPoint )
    this.thickness = endToStart.length()
    
    try{
      var midPoint = endToStart.divideScalar( 2 ).add( entryPoint )
      var putSide = this.getTargetBoundsData(object, midPoint)
    }catch(error){
      console.error(error)
    }
    
    this.ThicknessVisualArrows.setFromParams( {
      start:entryPoint,
      end:exitPoint,
      facingSide:putSide,
    })
    this.ThicknessVisualArrows.show()
  }
   
   /*configure all the basic visuals of this helper*/
  _setupVisuals(){
    this.ThicknessVisualArrows = new SizeHelper({
      textColor:this.textColor, 
      textBgColor:this.textBgColor, 
      fontSize:this.fontSize,
      fontFace:this.fontFace,
      labelType:"flat",
      arrowsPlacement:"outside",
      arrowColor: this.arrowColor,
      sideLength:this.sideLength
    })
    this.ThicknessVisualArrows.hide()
    this.add( this.ThicknessVisualArrows )
  
    //debug helpers
    this.faceNormalHelper  = new THREE.ArrowHelper( new THREE.Vector3(), new THREE.Vector3(), 15, 0XFF0000 )
    this.faceNormalHelper2 = new THREE.ArrowHelper( new THREE.Vector3(), new THREE.Vector3(), 15, 0X00FF00 )
    this.entryPointHelper = new CrossHelper({color:0xFF0000})
    this.exitPointHelper = new CrossHelper({color:0x00FF00})
    
    this.debugHelpers = new BaseHelper()
    this.debugHelpers.add( this.faceNormalHelper )
    this.debugHelpers.add( this.faceNormalHelper2 )
    this.debugHelpers.add( this.entryPointHelper )
    this.debugHelpers.add( this.exitPointHelper )
    
    //this.add( this.debugHelpers )
    
    if( !this.debug ){
      this.debugHelpers.hide()
    }
  }
  
  _updateVisuals(){
    this.faceNormalHelper.setStart( this.entryPoint )
    this.faceNormalHelper.setDirection( this.exitPoint.clone().sub( this.entryPoint ) )
    
    this.faceNormalHelper2.setStart( this.exitPoint )
    this.faceNormalHelper2.setDirection( this.entryPoint.clone().sub( this.exitPoint ) )
    
    this.entryPointHelper.position.copy( this.entryPoint )
    this.exitPointHelper.position.copy( this.exitPoint )
  }
  
  setThickness( thickness ){
    this.thickness  = thickness
  }
  
  setEntryPoint( entryPoint, object ){
    this.entryPoint  = entryPoint
    this.object = object
  }
  
  setExitPoint( exitPoint ){
    this.exitPoint  = exitPoint
  }

  set( entryInteresect )
  {
    let {object, entryPoint, exitPoint, thickness} = getEntryAndExit(entryInteresect, this.normalType)

    this.position.setFromMatrixPosition( object.matrixWorld )
    
    //set various internal attributes
    this.setEntryPoint( entryPoint, object)
    this.exitPoint = exitPoint
    try{
      var midPoint = endToStart.divideScalar( 2 ).add( entryPoint )
      console.log("midPoint",entryPoint, midPoint, exitPoint)
      var putSide = this.getTargetBoundsData(object, midPoint)
    
    }catch(error){
      console.error(error)
    }
    this.ThicknessVisualArrows.setFromParams( {
      start:entryPoint,
      end:exitPoint,
      facingSide:putSide,
    })
    this.ThicknessVisualArrows.show()
  }

  unset(){
    //this.thickness = undefined
    this.position.set(0, 0, 0)
    let options = Object.assign({}, this.DEFAULTS, options) 
    Object.assign(this, options)//unsure
    this.ThicknessVisualArrows.hide()
  }
}

module.exports = ThicknessVisual
