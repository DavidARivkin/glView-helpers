
/*
Abstract Base helper class
*/
BaseHelper = function()
{
  THREE.Object3D.call( this );
}

BaseHelper.prototype = Object.create( THREE.Object3D.prototype );
BaseHelper.prototype.constructor = BaseHelper;

BaseHelper.prototype.setAsSelectionRoot = function ( flag ) {
	this.traverse(function( child ) {
		child.selectable = !flag;
    child.selectTrickleUp = flag;
	});
	this.selectable = flag;
  this.selectTrickleUp = !flag;
};

BaseHelper.prototype.hide = function () {
	this.traverse(function( child ) {
		child.visible = false;
	});
};

BaseHelper.prototype.show = function () {
	this.traverse(function( child ) {
		child.visible = true;
	});
};

BaseHelper.prototype.highlight = function ( item ) {
	this.traverse(function( child ) {
		if ( child.material && child.material.highlight ){
			if ( child === item ) {
			  console.log("highlight",item);
				child.material.highlight( true );
			} else {
				child.material.highlight( false );
			}
		}
	});
};

