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


// Planets ---------------------------------------------------------------------
// -----------------------------------------------------------------------------
function Planet(game, id, x, y, size, player, maxCount, nodes, maxFactories) {
    this.$ = game;
    this.id = id;
    this.player = player;
    
    this.ships = {};
    this.shipCount = 0;
    
    this.ressources = 1;
    this.size = size;
    this.maxCount = maxCount;
    this.maxFactories = maxFactories;
    this.factoryCount = 0;
    this.factoryCompleteCount = 0;
    
    this.x = x;
    this.y = y;
    
    this.nodes = nodes;
    this.localCount = 0;
    this.playerCount = 0;
    this.oldPlayer = this.player;
    
    this.factories = {};
}

// Combat ----------------------------------------------------------------------
Planet.prototype.tick = function() {
    if (this.$.player) {
        var selected = this.$.player.selectPlanet;
        if (this === selected && this.player === this.$.player) {
            var oldPlayerCount = this.playerCount;
            this.playerCount = selected.getPlayerShipCount(this.$.player);
            if (oldPlayerCount != this.playerCount) {
                this.$.drawBackground();
            }
        
        } else if (this === this.$.inputHover) {
            var oldPlayerCount = this.playerCount;
            var oldLocalCount = this.localCount;
            
            this.playerCount = this.getPlayerShipCount(this.$.player);
            this.localCount = this.getPlayerShipCount(this.player);
            
            if (oldPlayerCount != this.playerCount
                || oldLocalCount != this.localCount) {
                
                this.$.drawBackground();
            }
        
        } else if (this.oldPlayer !== this.player) {
            this.$.drawBackground();
        }
        this.oldPlayer = this.player;
    }
};

Planet.prototype.tickCombat = function() {
    if (this.shipCount === 0) {
        return;
    }
    
    var ships = [];
    var tl = this.$.shipTypes.length;
    for(var p in this.ships) {
        for(var t = 0; t < tl; t++) {
            ships = ships.concat(this.ships[p][this.$.shipTypes[t]]);
        }
    }
    ships.sort(function(a, b) {
        return a.r < b.r;
    });
    
    for(var i = 0, l = ships.length; i < l; i++) {
        var c = ships[i];
        if (c.inOrbit && !c.traveling) {
            for(var e = i + 1;; e++) {
                if (e === l) {
                    e = 0;
                }
                if (e === i) {
                    break;
                }
                
                var s = ships[e];
                var ds = Math.abs(this.$.coreDifference(s.r, c.r));
                if (!s.traveling && ds <= c.getRotationSpeed() * 6) {
                    if (s.player !== c.player) {
                        c.attack(s);
                        s.attack(c);
                        break;
                    }
                
                } else {
                    break;
                }
            }
            
            if (!c.attacked) {
                for(var e in this.factories) {
                    var f = this.factories[e];
                    var ds = Math.abs(this.$.coreDifference(f.r, c.r));
                    if (ds <= c.getRotationSpeed() * 6 && f.player !== c.player) {
                        c.attackFactory(f);
                        break;
                    }
                }
            }
        }
    }
};


// Ships -----------------------------------------------------------------------
Planet.prototype.addShip = function(ship) {
    if (this.ships[ship.player.id][ship.type].indexOf(ship) === -1) {
        this.ships[ship.player.id][ship.type].push(ship);
        this.shipCount++;
    }
};

Planet.prototype.removeShip = function(ship) {
    var ships = this.ships[ship.player.id][ship.type];
    var index = ships.indexOf(ship);
    if (index !== -1) {
        ships.splice(index, 1);
        this.shipCount--;
    }
};

Planet.prototype.getPlayerShipCount = function(player) {
    return this.ships[player.id]['fight'].length
           + this.ships[player.id]['def'].length
           + this.ships[player.id]['bomb'].length;
};

Planet.prototype.getPlayerFactoryCount = function(player) {
    var count = 0;
    for(var i in this.factories) {
        if (this.factories[i].player === player) {
            count++;
        }
    }
    return count;
};


Planet.prototype.getCompleteFactoryCount = function() {
    var count = 0;
    for(var i in this.factories) {
        if (this.factories[i].build) {
            count++;
        }
    }
    return count;
};


// Drawing ---------------------------------------------------------------------
Planet.prototype.clear = function(sx, sy) {
    if (this.$.planetVisbile(this, sx, sy)) {
        this.$.bbg.clearRect(this.x - this.size - sx - 12,
                             this.y - this.size - sy - 12,
                             this.size * 2 + 24, this.size * 2 + 24);
    }
};

Planet.prototype.draw = function(sx, sy) {
    if (!this.$.planetVisbile(this, sx, sy)) {
        return false;
    }
    
    // Select
    var selected = this.$.player.selectPlanet;
    var selectShips = this === selected && (this.player === this.$.player
                                            || this.playerCount > 0);
    
    // Draw Planet Shape
    var ringScale = this.size / 20;
    var resScale = 0.25 + this.ressources * 0.75;
    this.$.drawBack();
    
    // Color
    if (this.player === this.$.player) {
        this.$.drawColor(this.$.player.color);
    
    } else {
        this.$.drawShaded(this.$.player.color);
    } 
    
    if (selectShips) {
        this.drawSelect();
    
    } else if (this === this.$.inputHover || (this === selected && this.playerCount > 0)) {
        if (this.$.sendPath.length === 0) {
            this.drawSelect();
        }
    }
    
    // Factories
    for(var i in this.factories) {
        this.factories[i].draw();
    }
    
    this.$.drawWidth(5 * (ringScale * resScale));
    this.$.drawColor(this.player ? this.player.color : 0);
    this.$.drawAlpha(selectShips ? 0.15 : 0.35);
    this.$.drawCircle(this.x, this.y, this.size - 3 * (ringScale * resScale), false);
    this.$.drawWidth(7 * (ringScale * resScale));
    this.$.drawAlpha(selectShips ? 0.075 : 0.20);
    this.$.drawCircle(this.x, this.y, this.size - 9 * (ringScale * resScale), false);
    
    this.$.drawAlpha(1);
    this.$.drawWidth(2 * ringScale);
    this.$.drawColor(this.player ? this.player.color : 0);
    this.$.drawCircle(this.x, this.y, this.size - 1 * ringScale + 1, false);

    // Color
    if (this.player === this.$.player) {
        this.$.drawColor(this.$.player.color);
    
    } else {
        this.$.drawShaded(this.$.player.color);
    }
    
    // Selected
    var size = (100 / 15) * this.size / 100;
    if (selectShips) {
        this.$.drawColor(this.$.player.color);
        var type = 'fight';
        this.$.drawShaded(this.$.player.color);
        this.$.drawText(this.x, this.y + 1 * size,
                        this.$.player.selectCount[type], 'center', 'bottom', size);
        
        this.$.drawText(this.x, this.y + 1 * size,
                        '_', 'center', 'bottom', size);
        
        this.$.drawText(this.x, this.y - 1 * size,
                        this.ships[this.$.player.id][type].length, 'center', 'top', size);
        
        
//        for(var i = 0, l = this.$.shipTypes.length; i < l; i++) {
//            var type = this.$.shipTypes[i];
//            r = (0 - Math.PI / 2) + Math.PI * 2 / l * i;
//            var x = this.x + Math.cos(r) * this.size * 0.5;
//            var y = this.y + Math.sin(r) * this.size * 0.5;  
//            this.$.drawText(x, y,  + '/'
//                            + this.ships[this.$.player.id][type].length,
//                            'center', 'middle', size * 0.6);      
//            
//        }
//    
    // Info
    } else if (this === this.$.inputHover || (this === selected && this.playerCount > 0)) {
                
        // Enemy Planet
        if (this.playerCount > 0 && this.player !== this.$.player) {
            this.$.drawShaded(this.$.player.color);
            this.$.drawText(this.x, this.y + 1 * size,
                            this.playerCount, 'center', 'bottom', size);
            
            this.$.drawShaded(this.player.color);
            this.$.drawText(this.x, this.y + 1 * size,
                            '_', 'center', 'bottom', size);
            
            this.$.drawText(this.x, this.y - 1 * size,
                            this.localCount, 'center', 'top', size);
        
        // Own Planet
        } else {
            this.$.drawShaded(this.player ? this.player.color : 0);
            this.$.drawText(this.x, this.y + 1 * size,
                            this.localCount, 'center', 'bottom', size);
            
            this.$.drawText(this.x, this.y + 1 * size,
                            '_', 'center', 'bottom', size);
            
            this.$.drawText(this.x, this.y - 1 * size,
                            this.maxCount, 'center', 'top', size);
        }
    }
    
    // Clear send path when all ships on the planet get destroyed
    if (this === selected && this.$.player.selectCount === 0) {
        if (this.$.sendPath.length > 0) {
            this.$.sendPath = [];
            this.$.drawBackground(true);
        }
    }
    this.$.drawFront();
};

Planet.prototype.drawSelect = function() {
    this.$.drawWidth(1);
    this.$.drawCircle(this.x, this.y, this.size + 3.5, false);
};

