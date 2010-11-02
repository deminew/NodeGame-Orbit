/*
  
  NodeGame: Orbit
  Copyright (c) 2010 Ivo Wetzel.
  
  All rights reserved.
  
  NodeGame: Orbit is free software: you can redistribute it and/or
  modify it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  NodeGame: Orbit is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  NodeGame: Orbit. If not, see <http://www.gnu.org/licenses/>.
  
*/


// Input -----------------------------------------------------------------------
// -----------------------------------------------------------------------------
Game.prototype.inputInit = function() {
    var that = this;
    this.moveTimeout = null;
    this.inputHover = null;
    this.inputSelected = null;
    this.inputSend = false;
    
    this.canvas.addEventListener('mousemove', function(e) {
        e = e || window.event;
        clearTimeout(that.moveTimeout);
        that.moveTimeout = setTimeout(function() {
            that.inputMove(e.clientX - that.canvas.offsetLeft + window.scrollX,
                           e.clientY - that.canvas.offsetTop + window.scrollY);
        }, 5);
        
    }, false);
    
    this.canvas.addEventListener('mouseout', function(e) {
        clearTimeout(that.moveTimeout);
        that.moveTimeout = setTimeout(function() {
            that.inputMove(-1, -1);
        }, 5);
    
    }, false);
    
    this.canvas.addEventListener('mousedown', function(e) {
        that.inputDown(e || window.event);
    }, false);
    
    this.canvas.addEventListener('mouseup', function(e) {
        that.inputUp(e || window.event);
    }, false);
    
    this.canvas.addEventListener('click', function(e) {
        that.inputClick(e || window.event);
    }, false); 
};

Game.prototype.inputMove = function(x, y) {

    // Select Planet
    var oldHover = this.inputHover;
    var newHover = null;
    if (this.x !== -1) {
        for(var i in this.planets) {
            var p = this.planets[i];
            var dx = p.x - x;
            var dy = p.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < p.size) {
                newHover = p;
            }
        }
    }
    
    // Calculate path and stuff
    if (oldHover !== newHover) {
        if (this.oldHover) {
            this.player.selectStop();
        }
        if (this.player.selectPlanet && this.player.selectCount > 0) {
            if (newHover) {
                this.sendPath = this.corePath(this.player.selectPlanet,
                                              newHover, this.player);
            
            } else {
                this.sendPath = [];
            }
        }
    }
    this.inputHover = newHover;
};

Game.prototype.inputDown = function(e) {
    if (this.inputHover && !this.inputSend) {
        if (this.player.selectPlanet) {
            this.sendPath = [];
        }
        if (this.player.selectPlanet
            && this.inputHover !== this.player.selectPlanet
            && this.player.selectCount > 0) {
            
            this.player.send(this.inputHover);
            this.inputSend = true;
        
        } else {
            this.player.selectStart(this.inputHover, 'fight');
        }
    }
};

Game.prototype.inputUp = function(e) {
    if (this.inputHover) {
        if (!this.inputSend) {
            this.player.selectStop();
        }
        this.inputSend = false;
    }
};

Game.prototype.inputClick = function(e) {
    if (!this.inputHover) {
        this.player.selectCancel();
    }
};

