var BaseHelper = require("../BaseHelper");
var LineHelper = require("../LineHelper");
var {LabelHelperPlane, LabelHelper3d} = require("../LabelHelper");
var {GizmoMaterial,GizmoLineMaterial} = require("../GizmoMaterial");
/*
  Made of two main arrows, and two lines perpendicular to the main arrow, at both its ends
  If the VISUAL distance between start & end of the helper is too short to fit text + arrow:
   * arrows should be on the outside
   * if text does not fit either, offset it to the side
*/

//TODO: how to put items on the left instead of right, front instead of back etc
class SizeHelper extends BaseHelper {
  constructor( options ) {
    const DEFAULTS = {
      _position:new THREE.Vector3(),
      centerColor:"#F00",
      crossColor:"#F00",
      
      drawArrows: true,
      drawLeftArrow: true,
      drawRightArrow: true,
      arrowColor: "000",
      arrowsPlacement:'dynamic',//can be either, dynamic, inside, outside
      arrowHeadSize:2.0,
      arrowHeadWidth:0.8,
      arrowFlatten : 0.6,
      
      lineWidth: 1,//TODO: how to ? would require not using simple lines but strips
      //see ANGLE issue on windows platforms
      drawSideLines: true,
      sideLength:0,
      sideLengthExtra: 2,//how much sidelines should stick out
      sideLineColor: "000",
      sideLineSide: "front",
      
      drawLabel: true,
      labelPos:"center",
      labelType: "flat",//frontFacing or flat
      fontSize: 10,
      fontFace: "Jura",
      textColor: "#000",
      textBgColor: "rgba(255, 255, 255, 0)",
      lengthAsLabel: true, //TODO: "length is too specific change that"
      text:undefined,
      textPrefix : "",//TODO: perhas a "textformat method would be better ??

      start: undefined,
      end: undefined,      
      up:  new THREE.Vector3(0,0,1),
      direction : undefined,//new THREE.Vector3(1,0,0),
      facingSide: new THREE.Vector3(0,1,0),//all placement computations are done relative to this one
      length : 0,
      
      debug: false,
    };
    
  let options = Object.assign({}, DEFAULTS, options); 
  super(options);

  Object.assign(this, options);

  //FIXME: do this better
  this.axisAligned = false;
  this.findGoodSide = true;
    
  //constants
  //FIXME: horrible
  /*const LABELFITOK    = 0;
  const LABELFITSHORT = 1;
  const LABELNOFIT    = 2;
  
  this.LABELFITOK    = LABELFITOK;
  this.LABELFITSHORT = LABELFITSHORT;
  this.LABELNOFIT    = LABELNOFIT;*/
  
    //arrows: move some of this to setter?
    /*var leftArrowHeadSize,rightArrowHeadSize;
    var leftArrowHeadWidth,rightArrowHeadWidth;
    leftArrowHeadSize  = rightArrowHeadSize = 0.00000000001;
    leftArrowHeadWidth = rightArrowHeadWidth = 0.00000000001;
    
    if(this.drawLeftArrow){ leftArrowHeadSize = this.arrowHeadSize; leftArrowHeadWidth=this.arrowHeadWidth}
    if(this.drawRightArrow){ rightArrowHeadSize = this.arrowHeadSize; rightArrowHeadWidth= this.arrowHeadWidth}
    
    this.mainArrowLeft = new THREE.ArrowHelper(this.leftArrowDir, this.leftArrowPos, this.arrowSize, this.arrowColor,this.leftArrowHeadSize, this.leftArrowHeadWidth);
    this.mainArrowRight = new THREE.ArrowHelper(this.rightArrowDir, this.rightArrowPos, this.arrowSize, this.arrowColor,this.rightArrowHeadSize, this.rightArrowHeadWidth);
    
    this.mainArrowRight.line.material = this.mainArrowLeft.line.material = this.arrowLineMaterial;
    this.mainArrowRight.cone.material = this.mainArrowLeft.cone.material = this.arrowConeMaterial;
    
    this.add( this.mainArrowLeft );
    this.add( this.mainArrowRight );*/
  
    this.set();
  }
  
   _init(){
     this._computeBasics();
     this._setupVisuals();
   }
  
  /* method compute all the minimal parameters, to have a minimal viable
  display of size
   parameter's priortity is in descending order as follows:
    - start & end
    - lengh & direction
   you can provide either:
    - start & end
    - start & length & direction
    - end & length & direction
  */ 
  _computeBasics( ){
    //either use provided length parameter , or compute things based on start/end parameters
    var start   = this.start;
    var end     = this.end ;
  
    if(end && start)
    {
      var tmpV = end.clone().sub( start ) ;
      this.length = tmpV.length();
      this.direction = tmpV.normalize();
    }
    else if(start && !end && this.direction && this.length){
      end = this.direction.clone().multiplyScalar( this.length ).add( start );
    }
    else if(end && !start && this.direction && this.length){
      start = this.direction.clone().negate().multiplyScalar( this.length ).add( end );
    }
    else if( this.direction && this.length )
    {
      start = this.direction.clone().multiplyScalar( -this.length/2).add( this.position );
      end   = this.direction.clone().multiplyScalar( this.length/2).add( this.position );
    }
    else{
      //throw new Error("No sufficient parameters provided to generate a SizeHelper");
      return;
    }
  
    this.start = start;
    this.end   = end;
    //MID is literally the middle point between start & end, nothing more
    this.mid   = this.direction.clone().multiplyScalar( this.length/2 ).add( this.start );
    
    
    //the size of arrows (if they are drawn) is max half the total length between start & end
    this.maxArrowSize  = this.length / 2;
    this.leftArrowDir  = this.direction.clone();
    this.rightArrowDir = this.direction.clone().negate();
    
    if(this.lengthAsLabel) this.text = this.length.toFixed(2);
    
     
    //HACK, for testing
    if( ( (Math.abs( this.direction.z) - 1) <= 0.0001) && this.direction.x == 0 && this.direction.y ==0 )
    {
      this.up = new THREE.Vector3( 1,0, 0 );
    }
    
    var cross = this.direction.clone().cross( this.up );
    cross.normalize().multiplyScalar( this.sideLength );
    //console.log("mid", this.mid,"cross", cross);
    
    this.leftArrowPos = this.mid.clone().add( cross );
    this.rightArrowPos = this.mid.clone().add( cross );
    this.flatNormal = cross.clone();
    
    
    //all the basic are computed, configure visuals
    this._setupVisuals();
  }
  
  /* compute the placement for label & arrows
    determine positioning for the label/text:
    Different cases:
     - arrows pointing inwards:
      * if label + arrows fits between ends, put label between arrows
      * if label does not fit between ends
  */
  _computeLabelAndArrows(){
    /*var sideLength = this.sideLength;
    var length = this.length;

    //draw dimention / text
    //this first one is used to get some labeling metrics, and is
    //not always displayed
    this.label = new LabelHelperPlane({text:this.text,fontSize:this.fontSize,color:this.textColor,bgColor:this.textBgColor});
    this.label.position.copy( this.leftArrowPos );
    
    //this.label.setRotationFromAxisAngle(this.direction.clone().normalize(), angle);
    //console.log("dir,angl",this.direction, angle, this.label.up);
    
    var labelDefaultOrientation = new THREE.Vector3(-1,0,1); 
    
    var quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors ( labelDefaultOrientation, this.direction.clone() );
    this.label.rotation.setFromQuaternion( quaternion );
    this.label.rotation.z += Math.PI;
    
    var labelWidth = this.label.textWidth;
    
    switch(this.labelType)
    {
      case "flat":
        this.label = new LabelHelperPlane({text:this.text,fontSize:this.fontSize, color:this.textColor, background:(this.textBgColor!=null),bgColor:this.textBgColor});
      break;
      case "frontFacing":
        this.label = new LabelHelper3d({text:this.text,fontSize:this.fontSize, color:this.textColor, bgColor:this.textBgColor});
      break;
    }
    this.label.position.copy( this.leftArrowPos );


    //TODO: only needed when drawing label
    //calculate offset so that there is a hole between the two arrows to draw the label
    var labelHoleExtra    = 0.5;
    var reqWith = labelWidth + this.arrowHeadSize*2;
    if(this.drawLabel) reqWith = reqWith + labelHoleExtra*2;
    //this.labelLength = labelWidth;    
    var labelHoleHalfSize = reqWith / 2;
    
    //IF arrows are pointer inwards
    
    //this.LABELFITOK    = LABELFITOK;
    //this.LABELFITSHORT = LABELFITSHORT;
    //this.LABELNOFIT    = LABELNOFIT;
    
    if(this.drawLabel) this.add( this.label );
    
    if( this.arrowsPlacement == "dynamic" )
    {
      if(reqWith>this.length)//if the label + arrows would not fit
      {
        this.arrowSize = Math.max(length/2,6);//we want arrows to be more than just arrowhead in all the cases
        var arrowXPos = this.length/2 + this.arrowSize;
      
        this.leftArrowDir = this.direction.clone().negate();
        this.rightArrowDir = this.leftArrowDir.clone().negate();
        
        this.leftArrowPos.sub( this.leftArrowDir.clone().normalize().multiplyScalar( arrowXPos ) );
        this.rightArrowPos.sub( this.rightArrowDir.clone().normalize().multiplyScalar( arrowXPos ) );
      
        if( labelWidth > this.length)//if even the label itself does not fit
        {
          this.label.position.y -= 5;
          //this.label.position.add( this.direction.clone().multiplyScalar( 5 ) );
        }
      }
      else{//if the label + arrows would fit
        this.arrowSize -= labelHoleHalfSize;
        this.leftArrowPos.add( this.leftArrowDir.clone().normalize().setLength( labelHoleHalfSize ) );
        this.rightArrowPos.add( this.rightArrowDir.clone().normalize().setLength( labelHoleHalfSize ) );
      }
    }else if( this.arrowsPlacement == "outside" ){
      //put the arrows outside of measure, pointing "inwards" towards center
      this.arrowSize = Math.max(length/2,6);//we want arrows to be more than just arrowhead in all the cases
      var arrowXPos = this.length/2 + this.arrowSize;
    
      this.leftArrowDir = this.direction.clone().negate();
      this.rightArrowDir = this.leftArrowDir.clone().negate();
      
      this.leftArrowPos.sub( this.leftArrowDir.clone().normalize().multiplyScalar( arrowXPos ) );
      this.rightArrowPos.sub( this.rightArrowDir.clone().normalize().multiplyScalar( arrowXPos ) );
      
      //console.log("labelWidth",labelWidth,"this.length",this.length);
      if(labelWidth>this.length)
      {
        //console.log("UH OH , this", this, "will not fit!!");
        //we want it "to the side" , aligned with the arrow, beyond the arrow head
        var lengthOffset = this.length + labelHoleExtra+ this.arrowHeadSize+labelWidth/2;
        //also offset to put on the line
        this.textHeightOffset = new THREE.Vector3();
        this.labelPosition = this.leftArrowPos.clone().add( this.leftArrowDir.clone().normalize().setLength(lengthOffset) );
        var heightOffset = this.label.textHeight;
       
        
        switch(this.labelPos)
        {
           case "top":
             this.textHeightOffset = new THREE.Vector3( ).crossVectors( this.up, this.direction ).setLength( heightOffset );
           break;
           case "bottom":
            this.textHeightOffset = new THREE.Vector3( ).crossVectors( this.up, this.direction ).setLength( heightOffset ).negate();
           break;
        }
        
        this.labelPosition.add( this.textHeightOffset );
        this.label.position.copy( this.labelPosition );
      }
      
    }else{
       this.arrowSize -= labelHoleHalfSize;
       this.leftArrowPos.add( this.leftArrowDir.clone().normalize().setLength( labelHoleHalfSize ) );
       this.rightArrowPos.add( this.rightArrowDir.clone().normalize().setLength( labelHoleHalfSize ) );
    }*/
  
  }
  
  _setupVisuals(){
    //materials
    this.arrowLineMaterial = new GizmoLineMaterial({color:this.arrowColor, linewidth:this.lineWidth, linecap:"miter"});
    this.arrowConeMaterial = new GizmoMaterial({color:this.arrowColor});
    
    //arrows
    var sideLength = this.sideLength;
    var leftArrowDir,rightArrowDir, leftArrowPos, rightArrowPos,
      arrowHeadSize, arrowSize,
      leftArrowHeadSize, leftArrowHeadWidth, rightArrowHeadSize, 
      rightArrowHeadWidth;
    
    leftArrowDir  = this.leftArrowDir;
    rightArrowDir = this.rightArrowDir;
    leftArrowPos  = this.leftArrowPos;
    rightArrowPos = this.rightArrowPos;
    
    arrowHeadSize = this.arrowHeadSize;
    arrowSize     = this.arrowSize; 
    
    leftArrowHeadSize  = rightArrowHeadSize  = 0.00000000001;
    leftArrowHeadWidth = rightArrowHeadWidth = 0.00000000001;
    
    if(this.drawLeftArrow) { leftArrowHeadSize = arrowHeadSize; leftArrowHeadWidth=this.arrowHeadWidth}
    if(this.drawRightArrow){ rightArrowHeadSize = arrowHeadSize; rightArrowHeadWidth= this.arrowHeadWidth}
  
    //direction, origin, length, color, headLength, headRadius, headColor
    this.mainArrowLeft = new THREE.ArrowHelper( leftArrowDir, leftArrowPos, arrowSize, 
      this.arrowColor, leftArrowHeadSize, leftArrowHeadWidth);
    this.mainArrowRight = new THREE.ArrowHelper(rightArrowDir, rightArrowPos, arrowSize, 
      this.arrowColor, rightArrowHeadSize, rightArrowHeadWidth);
    
    //Flaten in the UP direction(s) , not just z
    var arrowFlatScale = [].fill(this.arrowFlatten, 0, 3 );
    this.mainArrowLeft.scale.multiplyVectors( this.up, arrowFlatScale );
    this.mainArrowRight.scale.multiplyVectors( this.up, arrowFlatScale );
    //this.mainArrowLeft.scale.z.z =0.6;
    //this.mainArrowRight.scale.z=0.6;
    
    //for debuging
    this.dirDebugArrow = new THREE.ArrowHelper(this.direction, this.mid, 20, "#F00",3, 1);
    
    this.add( this.mainArrowLeft );
    this.add( this.mainArrowRight );
    this.add( this.dirDebugArrow );
    
    /* mainArrowRight.renderDepth = mainArrowLeft.renderDepth = 1e20;
    mainArrowRight.depthTest   = mainArrowLeft.depthTest = true;
    mainArrowRight.depthWrite  = mainArrowLeft.depthWrite = true;*/
    
    
    ////////sidelines
    /*var sideLength      = this.sideLength;
    var sideLengthExtra = this.sideLengthExtra;
    
    var sideLineGeometry = new THREE.Geometry();
    var sideLineStart  = this.start.clone();
    var sideLineEnd    = sideLineStart.clone().add( this.flatNormal.clone().normalize().multiplyScalar( sideLength+sideLengthExtra ) );
    var leftToRightOffset = this.end.clone().sub( this.start );
    
    this.leftSideLine  = new LineHelper( {start:sideLineStart, end:sideLineEnd } ); 
    this.rightSideLine = new LineHelper( {start:sideLineStart, end:sideLineEnd } );
    this.rightSideLine.position.add( leftToRightOffset );
    
    this.add( this.rightSideLine );
    this.add( this.leftSideLine );
    */
  }

  set(){
    //for debugging only
    /*if(this.debug) this._drawDebugHelpers();
    this._drawLabel();
    this._drawArrows();
    this._drawSideLines();*/
  }

  //setters
  setUp( up ){
    //this.up = up !== undefined ? up : new THREE.Vector3(0,0,1);
    //this._recomputeMidDir();
  }

  setDirection( direction ){
     /*this.direction = direction || new THREE.Vector3(1,0,0);
     
     this._recomputeMidDir();*/
  }

  setLength( length ){
    /*this.length = length !== undefined ? length : 10;
    
    this.start = this.direction.clone().multiplyScalar( -this.length/2).add( this._position );
    this.end   = this.direction.clone().multiplyScalar( this.length/2).add( this._position );
   
    this._recomputeMidDir();  */
  }

  setSideLength( sideLength ){
    /*this.sideLength = sideLength !== undefined ? sideLength : 0;
    
    this._recomputeMidDir();*/
  } 

  setText( text ){
    /*this.text = text !== undefined ? text : "";
    //console.log("setting text to", this.text);
    this._recomputeMidDir();*/
  } 

  setStart( start ){
    
    this.start = start || new THREE.Vector3();
    
    this._computeBasics();
    /*var tmpV = this.end.clone().sub( this.start ) ;
    this.length = tmpV.length();
    this.direction = tmpV.normalize();
    
    this._recomputeMidDir();*/
  }
    
  setEnd( end ){
    
    this.end = end || new THREE.Vector3();
    
    this._computeBasics();
    
    /*var tmpV = this.end.clone().sub( this.start ) ;
    this.length = tmpV.length();
    this.direction = tmpV.normalize();
    
    this._recomputeMidDir();*/
  } 

  setFacingSide( facingSide ){
    /*
    this.facingSide = facingSide;
    this._recomputeMidDir();*/
  }

  //helpers
  _recomputeMidDir(){

      this.mid   = this.direction.clone().multiplyScalar( this.length/2 ).add( this.start );
      
      if(this.lengthAsLabel) {
        this.text = this.textPrefix + this.length.toFixed(2);
      }
      
      this.arrowSize = this.length/2;//size of arrows 
      
      this.leftArrowDir = this.direction.clone();
      this.rightArrowDir = this.leftArrowDir.clone().negate();

      //HACK, for up vector issues prevention
      if( ( (Math.abs( this.direction.z) - 1) <= 0.0001) && this.direction.x == 0 && this.direction.y ==0 )
      {
        this.up = new THREE.Vector3( 1,0, 0 );
      }

      var cross = this.direction.clone().cross( this.up );
      cross.normalize().multiplyScalar(this.sideLength);
      //console.log("mid", this.mid,"cross", cross);
      
      if(this.sideLineSide == "back")
      {
        cross.negate();
      }
      
      console.log("cross", cross.x,cross.y,cross.z);
      //FIXME: experiment
      cross.x *= this.facingSide.x;
      cross.y *= this.facingSide.y;
      cross.z *= this.facingSide.z;
      
      console.log("cross", cross.x,cross.y,cross.z);

      this.leftArrowPos = this.mid.clone().add( cross );
      this.rightArrowPos = this.mid.clone().add( cross );
      this.flatNormal = cross.clone(); 
      
      //update label
      this.remove( this.label );
      this._drawLabel();
      
      //update arrows
      var arrowHeadSize = this.arrowHeadSize;
      var arrowSize     = this.arrowSize; 
      
      var rightArrowHeadSize = undefined;
      var rightArrowHeadWidth = undefined;
      
      var leftArrowHeadSize  = rightArrowHeadSize = 0.00000000001;
      var leftArrowHeadWidth = rightArrowHeadWidth = 0.00000000001;
      if(this.drawLeftArrow){ leftArrowHeadSize = arrowHeadSize; leftArrowHeadWidth=this.arrowHeadWidth}
      if(this.drawRightArrow){ rightArrowHeadSize = arrowHeadSize; rightArrowHeadWidth= this.arrowHeadWidth}
      
      this.mainArrowLeft.position.copy( this.leftArrowPos );
      this.mainArrowLeft.setDirection( this.leftArrowDir );
      this.mainArrowLeft.setLength( arrowSize, leftArrowHeadSize, leftArrowHeadWidth );
        
      this.mainArrowRight.position.copy( this.rightArrowPos );
      this.mainArrowRight.setDirection( this.rightArrowDir );
      this.mainArrowRight.setLength( arrowSize, rightArrowHeadSize, rightArrowHeadWidth );
      
      this.mainArrowRight.visible = this.drawArrows;
      this.mainArrowLeft.visible = this.drawArrows;
      
      //update side lines
      //TODO: make truely dynamic
      this.remove( this.rightSideLine );
      this.remove( this.leftSideLine );
      this._drawSideLines();
      
      //this.rightSideLine.
      //this.leftSideLine
      //for debug
      this.dirDebugArrow.setLength( this.length );
      this.dirDebugArrow.setDirection( this.direction );
      this.dirDebugArrow.position.copy( this.mid );
  }

  
  //drawing utilities

  /*determine positioning for the label/text:
    Different cases:
     - arrows pointing inwards:
      * if label + arrows fits between ends, put label between arrows
      * if label does not fit between ends
    
    TODO: this should be split up into two seperate methods : one for measurement
    and one for the display 
  */
  _drawLabel(){
    var sideLength = this.sideLength;
    var length = this.length;

    //draw dimention / text
    //this first one is used to get some labeling metrics, and is
    //not always displayed
    this.label = new LabelHelperPlane({text:this.text,fontSize:this.fontSize,color:this.textColor,bgColor:this.textBgColor});
    this.label.position.copy( this.leftArrowPos );
    
    //this.label.setRotationFromAxisAngle(this.direction.clone().normalize(), angle);
    //console.log("dir,angl",this.direction, angle, this.label.up);
    
    var labelDefaultOrientation = new THREE.Vector3(-1,0,1); 
    
    var quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors ( labelDefaultOrientation, this.direction.clone() );
    this.label.rotation.setFromQuaternion( quaternion );
    this.label.rotation.z += Math.PI;
    
    var labelWidth = this.label.textWidth;
    
    switch(this.labelType)
    {
      case "flat":
        this.label = new LabelHelperPlane({text:this.text,fontSize:this.fontSize, color:this.textColor, background:(this.textBgColor!=null),bgColor:this.textBgColor});
      break;
      case "frontFacing":
        this.label = new LabelHelper3d({text:this.text,fontSize:this.fontSize, color:this.textColor, bgColor:this.textBgColor});
      break;
    }
    this.label.position.copy( this.leftArrowPos );


    //TODO: only needed when drawing label
    //calculate offset so that there is a hole between the two arrows to draw the label
    var labelHoleExtra    = 0.5;
    var reqWith = labelWidth + this.arrowHeadSize*2;
    if(this.drawLabel) reqWith = reqWith + labelHoleExtra*2;
    //this.labelLength = labelWidth;    
    var labelHoleHalfSize = reqWith / 2;
    
    //IF arrows are pointer inwards
    
    //this.LABELFITOK    = LABELFITOK;
    //this.LABELFITSHORT = LABELFITSHORT;
    //this.LABELNOFIT    = LABELNOFIT;
    
    if(this.drawLabel) this.add( this.label );
    
    if( this.arrowsPlacement == "dynamic" )
    {
      if(reqWith>this.length)//if the label + arrows would not fit
      {
        this.arrowSize = Math.max(length/2,6);//we want arrows to be more than just arrowhead in all the cases
        var arrowXPos = this.length/2 + this.arrowSize;
      
        this.leftArrowDir = this.direction.clone().negate();
        this.rightArrowDir = this.leftArrowDir.clone().negate();
        
        this.leftArrowPos.sub( this.leftArrowDir.clone().normalize().multiplyScalar( arrowXPos ) );
        this.rightArrowPos.sub( this.rightArrowDir.clone().normalize().multiplyScalar( arrowXPos ) );
      
        if( labelWidth > this.length)//if even the label itself does not fit
        {
          this.label.position.y -= 5;
          //this.label.position.add( this.direction.clone().multiplyScalar( 5 ) );
        }
      }
      else{//if the label + arrows would fit
        this.arrowSize -= labelHoleHalfSize;
        this.leftArrowPos.add( this.leftArrowDir.clone().normalize().setLength( labelHoleHalfSize ) );
        this.rightArrowPos.add( this.rightArrowDir.clone().normalize().setLength( labelHoleHalfSize ) );
      }
    }else if( this.arrowsPlacement == "outside" ){
      //put the arrows outside of measure, pointing "inwards" towards center
      this.arrowSize = Math.max(length/2,6);//we want arrows to be more than just arrowhead in all the cases
      var arrowXPos = this.length/2 + this.arrowSize;
    
      this.leftArrowDir = this.direction.clone().negate();
      this.rightArrowDir = this.leftArrowDir.clone().negate();
      
      this.leftArrowPos.sub( this.leftArrowDir.clone().normalize().multiplyScalar( arrowXPos ) );
      this.rightArrowPos.sub( this.rightArrowDir.clone().normalize().multiplyScalar( arrowXPos ) );
      
      //console.log("labelWidth",labelWidth,"this.length",this.length);
      if(labelWidth>this.length)
      {
        //console.log("UH OH , this", this, "will not fit!!");
        //we want it "to the side" , aligned with the arrow, beyond the arrow head
        var lengthOffset = this.length + labelHoleExtra+ this.arrowHeadSize+labelWidth/2;
        //also offset to put on the line
        this.textHeightOffset = new THREE.Vector3();
        this.labelPosition = this.leftArrowPos.clone().add( this.leftArrowDir.clone().normalize().setLength(lengthOffset) );
        var heightOffset = this.label.textHeight;
       
        
        switch(this.labelPos)
        {
           case "top":
             this.textHeightOffset = new THREE.Vector3( ).crossVectors( this.up, this.direction ).setLength( heightOffset );
           break;
           case "bottom":
            this.textHeightOffset = new THREE.Vector3( ).crossVectors( this.up, this.direction ).setLength( heightOffset ).negate();
           break;
        }
        
        this.labelPosition.add( this.textHeightOffset );
        this.label.position.copy( this.labelPosition );
      }
      
    }else{
       this.arrowSize -= labelHoleHalfSize;
       this.leftArrowPos.add( this.leftArrowDir.clone().normalize().setLength( labelHoleHalfSize ) );
       this.rightArrowPos.add( this.rightArrowDir.clone().normalize().setLength( labelHoleHalfSize ) );
    }
  }

  _drawSideLines(){
      var sideLength      = this.sideLength;
      var sideLengthExtra = this.sideLengthExtra;
      
      var sideLineGeometry = new THREE.Geometry();
      var sideLineStart  = this.start.clone();
      var sideLineEnd    = sideLineStart.clone().add( this.flatNormal.clone().normalize().multiplyScalar( sideLength+sideLengthExtra ) );
      var leftToRightOffset = this.end.clone().sub( this.start );
      
      this.leftSideLine  = new LineHelper( {start:sideLineStart, end:sideLineEnd } ); 
      this.rightSideLine = new LineHelper( {start:sideLineStart, end:sideLineEnd } );
      this.rightSideLine.position.add( leftToRightOffset );
      
      this.add( this.rightSideLine );
      this.add( this.leftSideLine );
  }

  _drawDebugHelpers(){
    if(this.debugHelpers) this.remove( this.debugHelpers );

    this.debugHelpers = new THREE.Object3D();
    var directionHelper  = new THREE.ArrowHelper(this.direction.clone().normalize(), this.start, 15, 0XFF0000);
    var startHelper      = new CrossHelper({position:this.start,color:0xFF0000});
    var midHelper        = new CrossHelper({position:this.mid,color:0x0000FF});
    var endHelper        = new CrossHelper({position:this.end,color:0x00FF00});

    this.debugHelpers.add( directionHelper );
    this.debugHelpers.add( startHelper );
    this.debugHelpers.add( midHelper );
    this.debugHelpers.add( endHelper );
    
    this.add( this.debugHelpers );
  }

}

module.exports = SizeHelper;

