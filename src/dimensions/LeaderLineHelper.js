import THREE from 'three'
import BaseHelper from '../BaseHelper'
import CrossHelper from "../CrossHelper"

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
    };
    
    let options = Object.assign({}, DEFAULTS, options); 
    super(options);
    Object.assign(this, options);
  
    this.arrowColor = options.arrowColor !== undefined ? options.arrowColor : 0x000000;
    this.arrowHeadSize = options.arrowHeadSize !== undefined ? options.arrowHeadSize : 2.0;
    this.arrowHeadWidth = options.arrowHeadWidth !== undefined ? options.arrowHeadWidth : 0.8;
    
    this.linesColor = options.linesColor !== undefined ? options.linesColor : 0x000000;
    this.lineWidth  = options.lineWidth !== undefined ? options.lineWidth : 1;
    
    this.fontSize   = options.fontSize!== undefined ? options.fontSize : 8;
    this.textColor  = options.textColor!== undefined ? options.textColor : "#000";
    this.textBgColor= options.textBgColor!== undefined ? options.textBgColor : "#fff";
    this.labelType  = options.labelType!== undefined ? options.labelType : "frontFacing";
    
    this.angle  = options.angle !== undefined ? options.angle : 45;
    this.angleLength  = options.angleLength !== undefined ? options.angleLength : 5;
    this.horizLength  = options.horizLength !== undefined ? options.horizLength : 5;
    this.radius = options.radius !== undefined ? options.radius : 0;
    
    var angle       = this.angle;
    var radius      = this.radius;
    var angleLength = this.angleLength;
    var horizLength = this.horizLength;
    var horizLength = this.horizLength;
    
    
    var textBorder = options.textBorder || null;
    var material = new GizmoLineMaterial( { color: this.linesColor});
    //depthTest:false,depthWrite:false});
   
    var rAngle = angle;
    rAngle = rAngle*Math.PI/180;
    var y = Math.cos( rAngle )*angleLength;
    var x = Math.sin( rAngle )*angleLength;
    var angleEndPoint = new THREE.Vector3( x,y,0 );
    angleEndPoint = angleEndPoint.add( angleEndPoint.clone().normalize().multiplyScalar( radius ) );
    var angleArrowDir = angleEndPoint.clone().normalize();
    angleEndPoint.x = -angleEndPoint.x;
    angleEndPoint.y = -angleEndPoint.y;
    
    this.angleArrow = new THREE.ArrowHelper(angleArrowDir, angleEndPoint, angleLength, this.color,this.arrowHeadSize,this.arrowHeadWidth);
    this.angleArrow.scale.z =0.6;
    
    var horizEndPoint = angleEndPoint.clone();
    horizEndPoint.x -= horizLength;
    
    var horizGeom = new THREE.Geometry();
    horizGeom.vertices.push( angleEndPoint );
    horizGeom.vertices.push( horizEndPoint );
    
    this.horizLine = new THREE.Line( horizGeom, material );
    
    //draw dimention / text
    switch(this.labelType)
    {
      case "flat":
        console.log("this.fontSize",this.fontSize);
        this.label = new LabelHelperPlane({text:this.text,fontSize:this.fontSize,background:(this.textBgColor!=null),color:this.textColor,bgColor:this.textBgColor});
      break;
      case "frontFacing":
        this.label = new LabelHelper3d({text:this.text,fontSize:this.fontSize,color:this.textColor, bgColor:this.textBgColor});
      break;
    }
    this.label.rotation.z = Math.PI;
    var labelSize=this.label.textWidth/2 + 1 //label size, plus some extra
    var labelPosition = horizEndPoint.clone().sub(new THREE.Vector3(labelSize,0,0))
    this.label.position.add( labelPosition );
    
    /*
    var precisionLabelPos = new THREE.Vector3().copy( labelPosition );
    precisionLabelPos.x += this.label.width;
    
    //TODO: this is both needed in the data structures & in the visuals (here)
    this.precision = 0.12;
    this.precisionText = "+"+this.precision+"\n"+"-"+this.precision;
    this.precisionLabel = new LabelHelperPlane({text:this.precisionText,fontSize:this.fontSize/1.5,background:(this.textBgColor!=null),color:this.textColor,bgColor:this.textBgColor});
    this.add( this.precisionLabel );
    
    this.precisionLabel.rotation.z = Math.PI;
    this.precisionLabel.position.copy( precisionLabelPos );*/
   
   
    var crossHelper = new CrossHelper({size:3});
    this.add( crossHelper );
    
    if(textBorder)
    {
      if(textBorder == "circle")
      {
        var textBorderGeom = new THREE.CircleGeometry( labelSize, 30 );
        textBorderGeom.vertices.shift();
        var textBorderOutline = new THREE.Line( textBorderGeom, material ); 
        textBorderOutline.position.add( labelPosition );
        this.add( textBorderOutline );
      }
    }
   
    this.add( this.angleArrow );
    this.add( this.horizLine );
    this.add( this.label );


    
    //material settings
    this.arrowLineMaterial = new GizmoLineMaterial({color:this.arrowColor, linewidth:this.lineWidth,linecap:"miter"});
    this.arrowConeMaterial = new GizmoMaterial({color:this.arrowColor});
    
    this.angleArrow.line.material = this.arrowLineMaterial;
    this.angleArrow.cone.material =  this.arrowConeMaterial;
    this.angleArrow.line.material.depthTest = this.angleArrow.line.material.depthTest = true;
    this.angleArrow.line.material.depthWrite = this.angleArrow.line.material.depthWrite = true;
    
    //this.angleArrow.renderDepth = 1e20;
    this.horizLine.renderDepth = 1e20;
  }
}

module.exports = LeaderLineHelper;

