import THREE from 'three'
import BaseHelper from "./BaseHelper"
import {GizmoMaterial,GizmoLineMaterial} from "./GizmoMaterial"


//TODO:should inherit from THREE.MESH, but some weird stuff going on
class LineHelper extends BaseHelper {
  constructor( options ) {
  
    const DEFAULTS = {
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      length:0,

      lineWidth:1,
      color:"#000",
    }
    
    options = Object.assign({}, DEFAULTS, options) 
    
    super( options )

    Object.assign(this, options)
    
    console.log("LINE",this.lineWidth)
    this.material = new GizmoLineMaterial( { 
      lineWidth:this.lineWidth,
      color: this.color, 
      opacity:0.4, 
      transparent:true,
      highlightColor:this.highlightColor } )
    this._updateGeometry()
    //super( this._geometry, this._material )  
  }
  
  _makeGeometry(){
    if( !this.start || !this.end ) return
    this._geometry = new THREE.Geometry()
    
    this._geometry.vertices.push( this.start )
    this._geometry.vertices.push( this.end )
    /**/
  }
  
  _updateGeometry(){
    /*this.geometry.dynamic = true
    this.geometry.vertices[0] = this.start 
    this.geometry.vertices[1] = this.end 
    this.geometry.verticesNeedUpdate = true*/
    
    if( !this.start || !this.end ) return
    var geometry = new THREE.Geometry()
    
    geometry.vertices.push( this.start )
    geometry.vertices.push( this.end )
    
    if(this.line) this.remove( this.line )
    this.line = new THREE.Line( geometry, this.material )
    this.add( this.line )
  }
  
  setStart( start ){
    this.start = start || new THREE.Vector3()
    this._updateGeometry()
  }
  
  setEnd( end ){
    this.end = end || new THREE.Vector3()
    this._updateGeometry()
  }
  
  setLength( length ){
    this.length = length || 0
    this.end = this.end.clone().sub( this.start ).setLength( this.length )
    this._updateGeometry()
  }
}

module.exports = LineHelper
