import THREE from 'three'
import BaseHelper from '../BaseHelper'
import CrossHelper from "../CrossHelper"
import ArrowHelper from "../ArrowHelper2"

import {LabelHelperPlane, LabelHelper3d} from "../LabelHelper"
import {GizmoMaterial,GizmoLineMaterial} from "../GizmoMaterial"

/*
  Visual helper representing leader lines
*/
class LeaderLineHelper extends BaseHelper {
  constructor( options ) {
    const DEFAULTS = {
      distance: 30,
      color:"#000",
      text:"",
      fontFace:"Jura"
    }
    
    options = Object.assign({}, DEFAULTS, options) 
    super(options)
    Object.assign(this, options)
  
    this.arrowColor = options.arrowColor !== undefined ? options.arrowColor : 0x000000
    this.arrowHeadSize = options.arrowHeadSize !== undefined ? options.arrowHeadSize : 2.0
    this.arrowHeadWidth = options.arrowHeadWidth !== undefined ? options.arrowHeadWidth : 0.8
    this.arrowHeadType  = options.arrowHeadType !== undefined ? options.arrowHeadType: undefined
    
    this.linesColor = options.linesColor !== undefined ? options.linesColor : 0x000000
    this.lineWidth  = options.lineWidth !== undefined ? options.lineWidth : 1
    
    this.fontSize   = options.fontSize!== undefined ? options.fontSize : 8
    this.textColor  = options.textColor!== undefined ? options.textColor : "#000"
    this.textBgColor= options.textBgColor!== undefined ? options.textBgColor : "#fff"
    this.labelType  = options.labelType!== undefined ? options.labelType : "frontFacing"
    
    this.angle  = options.angle !== undefined ? options.angle : 45
    this.angleLength  = options.angleLength !== undefined ? options.angleLength : 5
    this.horizLength  = options.horizLength !== undefined ? options.horizLength : 5
    this.radius = options.radius !== undefined ? options.radius : 0

    this.highlightColor = options.highlightColor !== undefined ? options.highlightColor : "#F00"
    
    let angle       = this.angle
    let radius      = this.radius
    let angleLength = this.angleLength
    let horizLength = this.horizLength
    
    let textBorder = options.textBorder || null
    let material = new GizmoLineMaterial( { 
        color: this.linesColor,
        lineWidth:this.lineWidth,
        linecap:"miter",
        highlightColor:this.highlightColor
    })
    //depthTest:false,depthWrite:false})
   
    let rAngle = angle
    rAngle = rAngle*Math.PI/180
    let y = Math.cos( rAngle )*angleLength
    let x = Math.sin( rAngle )*angleLength
    let angleEndPoint = new THREE.Vector3( x,y,0 )
    angleEndPoint = angleEndPoint.add( angleEndPoint.clone().normalize().multiplyScalar( radius ) )
    let angleArrowDir = angleEndPoint.clone().normalize()
    angleEndPoint.x = -angleEndPoint.x
    angleEndPoint.y = -angleEndPoint.y
    
    this.angleArrow = new ArrowHelper(angleArrowDir, angleEndPoint, angleLength, 
      this.color,this.arrowHeadSize,this.arrowHeadWidth,this.arrowHeadType)
    this.angleArrow.scale.z =0.6
    
    let horizEndPoint = angleEndPoint.clone()
    horizEndPoint.x -= horizLength
    
    let horizGeom = new THREE.Geometry()
    horizGeom.vertices.push( angleEndPoint )
    horizGeom.vertices.push( horizEndPoint )
    
    this.horizLine = new THREE.Line( horizGeom, material )
    
    //draw dimention / text
    switch(this.labelType)
    {
      case "flat":
        this.label = new LabelHelperPlane({
          text:this.text,
          fontSize:this.fontSize,
          fontFace:this.fontFace,
          background:(this.textBgColor!=null),
          color:this.textColor,
          bgColor:this.textBgColor,
          highlightColor:this.highlightColor
        })
      break
      case "frontFacing":
        this.label = new LabelHelper3d({
          text:this.text,
          fontSize:this.fontSize,
          fontFace:this.fontFace,
          color:this.textColor, 
          bgColor:this.textBgColor})
      break
    }
    this.label.rotation.z = Math.PI
    let labelSize=this.label.textWidth/2 + 1 //label size, plus some extra
    let labelPosition = horizEndPoint.clone().sub(new THREE.Vector3(labelSize,0,0))
    this.label.position.add( labelPosition )
    
    /*
    let precisionLabelPos = new THREE.Vector3().copy( labelPosition )
    precisionLabelPos.x += this.label.width
    
    //TODO: this is both needed in the data structures & in the visuals (here)
    this.precision = 0.12
    this.precisionText = "+"+this.precision+"\n"+"-"+this.precision
    this.precisionLabel = new LabelHelperPlane({text:this.precisionText,fontSize:this.fontSize/1.5,background:(this.textBgColor!=null),color:this.textColor,bgColor:this.textBgColor})
    this.add( this.precisionLabel )
    
    this.precisionLabel.rotation.z = Math.PI
    this.precisionLabel.position.copy( precisionLabelPos )*/
   
   
    /*let crossHelper = new CrossHelper({
        size:3
    })
    this.add( crossHelper )*/
    
    if(textBorder)
    {
      if(textBorder === "circle")
      {
        let textBorderGeom = new THREE.CircleGeometry( labelSize, 32 )
        textBorderGeom.vertices.shift()
        let textBorderOutline = new THREE.Line( textBorderGeom, material ) 
        textBorderOutline.position.add( labelPosition )
        this.add( textBorderOutline )
      }
      if(textBorder === "rectangle"){
        let rectWidth  = this.label.textHeight
        let rectLength = this.label.textWidth

        //console.log("textWidth",this.label.textWidth, this.label.width,"textHeight",this.label.textHeight, this.label.height)

        let rectShape = new THREE.Shape()
        rectShape.moveTo( 0,0 )
        rectShape.lineTo( 0, rectWidth )
        rectShape.lineTo( rectLength, rectWidth )
        rectShape.lineTo( rectLength, 0 )
        rectShape.lineTo( 0, 0 )
        rectShape.lineTo( 0, 0 )

        let textBorderGeom = new THREE.ShapeGeometry( rectShape )
        let textBorderOutline = new THREE.Line( textBorderGeom, material ) 
        textBorderOutline.position.add( labelPosition )
        textBorderOutline.position.add( new THREE.Vector3(-rectLength/2,-rectWidth/2,0) )
        this.add( textBorderOutline )

      }
    }
   
    this.add( this.angleArrow )
    this.add( this.horizLine )
    this.add( this.label )


    
    //material settings
    this.arrowLineMaterial = new GizmoLineMaterial({
        color:this.arrowColor, 
        lineWidth:this.lineWidth,
        linecap:"miter",
        highlightColor:this.highlightColor})
    this.arrowConeMaterial = new GizmoMaterial({
        color:this.arrowColor,
        highlightColor:this.highlightColor
    })
    
    this.angleArrow.line.material = this.arrowLineMaterial
    this.angleArrow.head.material =  this.arrowConeMaterial
    this.angleArrow.line.material.depthTest = this.angleArrow.line.material.depthTest = true
    this.angleArrow.line.material.depthWrite = this.angleArrow.line.material.depthWrite = true
    
    //this.angleArrow.renderDepth = 1e20
    this.horizLine.renderDepth = 1e20
  }
}

module.exports = LeaderLineHelper

